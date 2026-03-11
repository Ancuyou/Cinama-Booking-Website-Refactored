package com.example.MovieTicker.service;

import com.example.MovieTicker.entity.HoaDon;
import com.example.MovieTicker.entity.User;
import com.example.MovieTicker.entity.TaiKhoan;
import com.example.MovieTicker.entity.Ve;
import com.example.MovieTicker.entity.ChiTietDichVuVe;
import com.example.MovieTicker.enums.InvoiceStatus;
import com.example.MovieTicker.enums.TicketStatus;
// ✅ FACTORY PATTERN — chỉ import interface + factory, không còn import MoMo/VNPay cụ thể
import com.example.MovieTicker.payment.PaymentGateway;
import com.example.MovieTicker.payment.PaymentGatewayFactory;
import com.example.MovieTicker.payment.PaymentResult;
import com.example.MovieTicker.repository.HoaDonRepository;
import com.example.MovieTicker.repository.TaiKhoanRepository;
import com.example.MovieTicker.repository.VeRepository;
import com.example.MovieTicker.request.PaymentRequest;
import com.example.MovieTicker.response.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HoaDonService {

    @Autowired
    private HoaDonRepository hoaDonRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private VeRepository veRepository;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private EmailService emailService;

    // =========================================================
    //  ✅ FACTORY PATTERN — PaymentGatewayFactory
    // =========================================================
    // ❌ CŨ: HoaDonService tự chứa toàn bộ logic của MoMo + VNPay:
    //   @Value("${momo.partnerCode}"), @Value("${momo.accessKey}"), ...  ← 7 @Value MoMo
    //   @Value("${backend.base-url}")                                    ← 1 @Value VNPay
    //   @Autowired MomoAPI                                               ← phụ thuộc trực tiếp vào MoMo SDK
    //   createMoMoQR()       → 30 dòng HMAC-SHA256 + build CreateMomoRequest
    //   refundMomo()         → 25 dòng HMAC-SHA256 + build CreateMomoRefundRequest
    //   createVnPayRequest() → 50 dòng Map + URL encode + HMAC-SHA512
    //   refundVnPay()        → 60 dòng JsonObject + HTTP POST thủ công
    //   Tổng: ~165 dòng logic payment nằm sai chỗ, vi phạm SRP nặng
    //
    // ✅ MỚI: Inject factory duy nhất — 1 dòng thay 165 dòng
    //   HoaDonService không còn biết MoMo hay VNPay tồn tại
    //   Thêm ZaloPay → tạo 1 file ZaloPayPaymentGateway.java, không sửa gì ở đây
    @Autowired
    private PaymentGatewayFactory paymentGatewayFactory;

    // ─── ✅ Unified payment methods dùng Factory ──────────────────────────────

    /**
     * Tạo thanh toán — provider được quyết định tự động từ phuongThucThanhToan trong HoaDon.
     * Thay thế hoàn toàn: createMoMoQR() + createVnPayRequest()
     */
    public PaymentResult createPaymentViaFactory(PaymentRequest paymentRequest,
                                                  HttpServletRequest httpRequest) throws IOException {
        HoaDon hoaDon = getHoaDonByMaHD(paymentRequest.getOrderId());
        String provider = hoaDon.getPhuongThucThanhToan();
        PaymentGateway gateway = paymentGatewayFactory.getGateway(provider);
        return gateway.createPayment(paymentRequest, httpRequest);
    }

    /**
     * Hoàn tiền — provider được quyết định tự động từ phuongThucThanhToan trong HoaDon.
     * Thay thế hoàn toàn: refundMomo() + refundVnPay()
     */
    public PaymentResult refundViaFactory(PaymentRequest paymentRequest,
                                           HttpServletRequest httpRequest) throws IOException {
        HoaDon hoaDon = getHoaDonByMaHD(paymentRequest.getOrderId());
        String provider = hoaDon.getPhuongThucThanhToan();
        PaymentGateway gateway = paymentGatewayFactory.getGateway(provider);
        return gateway.refund(paymentRequest, httpRequest);
    }

    /**
     * Kiểm tra trạng thái hoàn tiền — thay thế checkmomorefund()
     */
    public PaymentResult checkRefundStatusViaFactory(PaymentRequest paymentRequest) throws IOException {
        HoaDon hoaDon = getHoaDonByMaHD(paymentRequest.getOrderId());
        String provider = hoaDon.getPhuongThucThanhToan();
        PaymentGateway gateway = paymentGatewayFactory.getGateway(provider);
        return gateway.checkRefundStatus(paymentRequest);
    }

    public HoaDon getHoaDonByVeList(List<Ve> ticketList) {
        if (ticketList == null || ticketList.isEmpty()) {
            throw new RuntimeException("Danh sách vé trống");
        }
        String maHD = ticketList.get(0).getHoaDon().getMaHD();
        Optional<HoaDon> hoaDonOpt = hoaDonRepository.findById(maHD);
        if (hoaDonOpt.isPresent()) {
            return hoaDonOpt.get();
        } else {
            throw new RuntimeException("Không tìm thấy hóa đơn với mã: " + maHD);
        }
    }

    public HoaDon getHoaDonByMaHD(String maHD) {
        Optional<HoaDon> hoaDonOpt = hoaDonRepository.findById(maHD);
        if (hoaDonOpt.isPresent()) {
            return hoaDonOpt.get();
        } else {
            throw new RuntimeException("Không tìm thấy hóa đơn với mã: " + maHD);
        }
    }

    @Transactional
    public void updatePaymentStatus(String orderId, String transactionNo, String transactionDate, String responseCode,String requestId) {
        try {
            HoaDon hoaDon = getHoaDonByMaHD(orderId);

            // Kiểm tra hóa đơn có hết hạn không (10 phút)
            if (isInvoiceExpired(hoaDon)) {
                throw new RuntimeException("Hóa đơn đã hết hạn thanh toán (quá 10 phút). Vui lòng tạo đơn hàng mới.");
            }

            // Cập nhật thông tin giao dịch
            hoaDon.setTransactionNo(transactionNo);
            hoaDon.setTransactionDate(transactionDate);
            hoaDon.setResponseCode(responseCode);
            if(requestId != null && !requestId.trim().isEmpty()) {
                hoaDon.setRequestId(requestId);
            }
            // Cập nhật trạng thái dựa trên response code
            if ("00".equals(responseCode) || "0".equals(responseCode)) {
                hoaDon.setTrangThai(InvoiceStatus.PAID.getCode());
                // Cập nhật trạng thái tất cả vé trong hóa đơn
                if (hoaDon.getVes() != null) {
                    for (Ve ve : hoaDon.getVes()) {
                        ve.setTrangThai(TicketStatus.PAID.getCode());
                        try {
                            String qrContent = qrCodeService.createTicketQRContent(
                                    ve.getMaVe(),
                                    ve.getSuatChieu().getPhim().getTenPhim(),
                                    ve.getSuatChieu().getPhongChieu().getTenPhong(),
                                    ve.getGhe().getTenGhe(),
                                    ve.getSuatChieu().getThoiGianBatDau().toString(),
                                    ve.getTrangThai(),
                                    hoaDon.getTenKhachHang() != null ? hoaDon.getTenKhachHang() : (hoaDon.getUser() != null ? hoaDon.getUser().getHoTen() : "Khach vang lai"),
                                    hoaDon.getSdtKhachHang() != null ? hoaDon.getSdtKhachHang() : (hoaDon.getUser() != null ? hoaDon.getUser().getSdt() : "Chua cap nhat")
                            );

                            String qrCodeUrl = qrCodeService.generateQRCode(qrContent, ve.getMaVe());
                            System.out.println("QR Code URL for ticket " + ve.getMaVe() + ": " + qrCodeUrl);
                            ve.setQrCodeUrl(qrCodeUrl);
                            veRepository.save(ve);

                        } catch (Exception e) {
                            System.err.println("Lỗi khi tạo QR code cho vé " + ve.getMaVe() + ": " + e.getMessage());
                        }

                    }
                }
                HoaDon hoaDon1 = hoaDonRepository.save(hoaDon);

                // Gửi email cho cả user đăng nhập và khách vãng lai
                HoaDonResponse response = convertToHoaDonResponse(hoaDon1);
                String emailTo = null;

                if (hoaDon1.getUser() != null && hoaDon1.getUser().getEmail() != null) {
                    emailTo = hoaDon1.getUser().getEmail();
                } else if (hoaDon1.getEmailKhachHang() != null && !hoaDon1.getEmailKhachHang().trim().isEmpty()) {
                    emailTo = hoaDon1.getEmailKhachHang();
                }

                if (emailTo != null) {
                    emailService.sendSuccessInvoiceEmail(emailTo, response);
                }
            } else {
                hoaDon.setTrangThai(InvoiceStatus.CANCELLED.getCode());
                if (hoaDon.getVes() != null) {
                    for (Ve ve : hoaDon.getVes()) {
                        ve.setTrangThai(TicketStatus.CANCELLED.getCode());
                    }
                }
                hoaDonRepository.save(hoaDon);
            }


        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi cập nhật trạng thái thanh toán: " + e.getMessage());
        }
    }

    /**
     * Kiểm tra hóa đơn có hết hạn không (10 phút)
     */
    public boolean isInvoiceExpired(HoaDon hoaDon) {
        if (hoaDon == null || hoaDon.getNgayLap() == null) {
            return true;
        }
        // Nếu hóa đơn đã được thanh toán thì không coi là expired
        if (InvoiceStatus.PAID.getCode().equals(hoaDon.getTrangThai())) {
            return false;
        }

        LocalDateTime expiredTime = LocalDateTime.now().minusMinutes(10);
        return hoaDon.getNgayLap().isBefore(expiredTime);
    }

    /**
     * Kiểm tra hóa đơn có thể thanh toán không
     */
    public void validateInvoiceForPayment(String maHD) {
        HoaDon hoaDon = getHoaDonByMaHD(maHD);

        // Kiểm tra trạng thái hiện tại
        if (!InvoiceStatus.PROCESSING.getCode().equals(hoaDon.getTrangThai())) {
            throw new RuntimeException("Hóa đơn không ở trạng thái chờ thanh toán");
        }

        // Kiểm tra hết hạn
        if (isInvoiceExpired(hoaDon)) {
            // Tự động cập nhật trạng thái thành EXPIRED
            hoaDon.setTrangThai(InvoiceStatus.EXPIRED.getCode());
            if (hoaDon.getVes() != null) {
                for (Ve ve : hoaDon.getVes()) {
                    ve.setTrangThai(TicketStatus.EXPIRED.getCode());
                }
            }
            hoaDonRepository.save(hoaDon);

            throw new RuntimeException("Hóa đơn đã hết hạn thanh toán (quá 10 phút). Vui lòng tạo đơn hàng mới.");
        }
    }

    
    public void cancelInvoiceManual(String maHD) {
        try {
            HoaDon hoaDon = getHoaDonByMaHD(maHD);

            // Chỉ cho phép hủy hóa đơn đang PROCESSING
            if (!InvoiceStatus.PROCESSING.getCode().equals(hoaDon.getTrangThai())) {
                throw new RuntimeException("Không thể hủy hóa đơn. Trạng thái hiện tại: " + hoaDon.getTrangThai());
            }

            // Cập nhật trạng thái hóa đơn thành CANCELLED
            hoaDon.setTrangThai(InvoiceStatus.CANCELLED.getCode());

            // Cập nhật trạng thái tất cả vé trong hóa đơn thành CANCELLED
            if (hoaDon.getVes() != null) {
                for (Ve ve : hoaDon.getVes()) {
                    ve.setTrangThai(TicketStatus.CANCELLED.getCode());
                }
            }

            hoaDonRepository.save(hoaDon);

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi hủy hóa đơn: " + e.getMessage());
        }
    }

  
    @Transactional
    public void processRefund(String maHD, String transactionNo) {
        try {
            HoaDon hoaDon = getHoaDonByMaHD(maHD);

            if (!InvoiceStatus.PAID.getCode().equals(hoaDon.getTrangThai())) {
                throw new RuntimeException("Chỉ có thể hoàn tiền cho hóa đơn đã thanh toán. Trạng thái hiện tại: " + hoaDon.getTrangThai());
            }

            if (hoaDon.getVes() != null && !hoaDon.getVes().isEmpty()) {
                LocalDateTime now = LocalDateTime.now();
                for (Ve ve : hoaDon.getVes()) {
                    LocalDateTime showTime = ve.getSuatChieu().getThoiGianBatDau();
                    if (now.isAfter(showTime.plusHours(1))) {
                        throw new RuntimeException("Không thể hoàn tiền. Suất chiếu đã diễn ra quá 1 giờ.");
                    }
                }
            }

            hoaDon.setTrangThai(InvoiceStatus.REFUNDED.getCode());
            hoaDon.setGhiChu((hoaDon.getGhiChu() != null ? hoaDon.getGhiChu() : "") + 
                            "\n[Hoàn tiền] Mã GD: " + transactionNo + " - Ngày: " + LocalDateTime.now());

            // Cập nhật trạng thái và tạo lại QR code cho tất cả vé
            if (hoaDon.getVes() != null) {
                for (Ve ve : hoaDon.getVes()) {
                    ve.setTrangThai(TicketStatus.REFUNDED.getCode());
                    
                    // Tạo lại QR code với trạng thái REFUNDED
                    try {
                        String tenKH = hoaDon.getUser() != null ? hoaDon.getUser().getHoTen() : hoaDon.getTenKhachHang();
                        String sdt = hoaDon.getUser() != null ? hoaDon.getUser().getSdt() : hoaDon.getSdtKhachHang();
                        
                        String qrContent = qrCodeService.createTicketQRContent(
                            ve.getMaVe(),
                            ve.getSuatChieu().getPhim().getTenPhim(),
                            ve.getSuatChieu().getPhongChieu().getTenPhong(),
                            ve.getGhe().getTenGhe(),
                            ve.getSuatChieu().getThoiGianBatDau().toString(),
                            TicketStatus.REFUNDED.getCode(),
                            tenKH != null ? tenKH : "Guest",
                            sdt != null ? sdt : ""
                        );
                        
                        String qrCodeUrl = qrCodeService.generateQRCode(qrContent, ve.getMaVe());
                        ve.setQrCodeUrl(qrCodeUrl);
                        
                    } catch (Exception e) {
                        System.err.println("Lỗi khi tạo QR code cho vé hoàn tiền " + ve.getMaVe() + ": " + e.getMessage());
                    }
                }
            }

            HoaDon savedHoaDon = hoaDonRepository.save(hoaDon);
            
            // Gửi email thông báo hoàn tiền
            try {
                HoaDonResponse response = convertToHoaDonResponse(savedHoaDon);
                String emailTo = null;
                
                if (savedHoaDon.getUser() != null && savedHoaDon.getUser().getEmail() != null) {
                    emailTo = savedHoaDon.getUser().getEmail();
                } else if (savedHoaDon.getEmailKhachHang() != null && !savedHoaDon.getEmailKhachHang().trim().isEmpty()) {
                    emailTo = savedHoaDon.getEmailKhachHang();
                }
                
                if (emailTo != null) {
                    emailService.sendRefundInvoiceEmail(emailTo, response, transactionNo);
                }
            } catch (Exception e) {
                System.err.println("Lỗi khi gửi email thông báo hoàn tiền: " + e.getMessage());
            }

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xử lý hoàn tiền: " + e.getMessage());
        }
    }

   
    public String getInvoiceStatus(String maHD) {
        HoaDon hoaDon = getHoaDonByMaHD(maHD);

        // Kiểm tra xem có hết hạn không
        if (InvoiceStatus.PROCESSING.getCode().equals(hoaDon.getTrangThai()) && isInvoiceExpired(hoaDon)) {
            // Tự động cập nhật trạng thái thành EXPIRED
            hoaDon.setTrangThai(InvoiceStatus.EXPIRED.getCode());
            if (hoaDon.getVes() != null) {
                for (Ve ve : hoaDon.getVes()) {
                    ve.setTrangThai(TicketStatus.EXPIRED.getCode());
                }
            }
            hoaDonRepository.save(hoaDon);
            return InvoiceStatus.EXPIRED.getCode();
        }

        return hoaDon.getTrangThai();
    }

    public List<HoaDon> getAllHoaDon() {
        return hoaDonRepository.findAll();
    }

    public HoaDonResponse getHoaDonResponseByMaHD(String maHD) {
        Optional<HoaDon> hoaDonOpt = hoaDonRepository.findById(maHD);
        if (hoaDonOpt.isPresent()) {
            HoaDon hoaDon = hoaDonOpt.get();
            return convertToHoaDonResponse(hoaDon);
        } else {
            throw new RuntimeException("Không tìm thấy hóa đơn với mã: " + maHD);
        }
    }


    private HoaDonResponse convertToHoaDonResponse(HoaDon hoaDon) {
        List<VeResponse> danhSachVeResponse = new ArrayList<>();
        if (hoaDon.getVes() != null) {
            for (Ve ve : hoaDon.getVes()) {
                // Parse tenGhe để lấy hàng và số
                String tenGhe = ve.getGhe().getTenGhe();
                String hangGhe = tenGhe.substring(0, 1);
                String soGhe = tenGhe.substring(1);

                VeResponse veResponse = VeResponse.builder()
                        .maVe(ve.getMaVe())
                        .tenPhim(ve.getSuatChieu().getPhim().getTenPhim())
                        .tenPhongChieu(ve.getSuatChieu().getPhongChieu().getTenPhong())
                        .tenGhe(tenGhe)
                        .hangGhe(hangGhe)
                        .soGhe(Integer.parseInt(soGhe))
                        .loaiGhe(ve.getGhe().getLoaiGhe().getTenLoaiGhe())
                        .giaGhe((double) ve.getGhe().getLoaiGhe().getPhuThu())
                        .ngayChieu(ve.getSuatChieu().getThoiGianBatDau())
                        .thoiGianChieu(ve.getSuatChieu().getThoiGianBatDau())
                        .ngayDat(ve.getNgayDat())
                        .thanhTien(ve.getThanhTien())
                        .trangThai(ve.getTrangThai())
                        .maHoaDon(hoaDon.getMaHD())
                        .maSuatChieu(ve.getSuatChieu().getMaSuatChieu())
                        .qrCodeUrl(ve.getQrCodeUrl())
                        .build();
                danhSachVeResponse.add(veResponse);
            }
        }

        List<DichVuResponse> danhSachDichVuResponse = new ArrayList<>();
        if (hoaDon.getVes() != null) {
            for (Ve ve : hoaDon.getVes()) {
                if (ve.getChiTietDichVuVes() != null) {
                    for (ChiTietDichVuVe chiTiet : ve.getChiTietDichVuVes()) {
                        DichVuResponse dichVuResponse = DichVuResponse.builder()
                                .maDichVu(chiTiet.getDichVuDiKem().getMaDv().toString())
                                .tenDichVu(chiTiet.getDichVuDiKem().getTenDv())
                                .giaDichVu(chiTiet.getDichVuDiKem().getDonGia())
                                .soLuong(chiTiet.getSoLuong())
                                .thanhTien(chiTiet.getDichVuDiKem().getDonGia() * chiTiet.getSoLuong())
                                .moTa(chiTiet.getDichVuDiKem().getMoTa())
                                .build();
                        danhSachDichVuResponse.add(dichVuResponse);
                    }
                }
            }
        }

        // Tính toán tổng tiền
        double tongTienVe = danhSachVeResponse.stream()
                .mapToDouble(VeResponse::getThanhTien)
                .sum();
        double tongTienDichVu = danhSachDichVuResponse.stream()
                .mapToDouble(DichVuResponse::getThanhTien)
                .sum();

        // Kiểm tra hết hạn
        boolean isExpired = isInvoiceExpired(hoaDon);
        LocalDateTime expiredAt = hoaDon.getNgayLap().plusMinutes(10);

        // Build response
        return HoaDonResponse.builder()
                .maHD(hoaDon.getMaHD())
                .ngayLap(hoaDon.getNgayLap())
                .tongTien(hoaDon.getTongTien())
                .tongTienVe(tongTienVe)
                .tongTienDichVu(tongTienDichVu)
                .phuongThucThanhToan(hoaDon.getPhuongThucThanhToan())
                .trangThai(hoaDon.getTrangThai())
                .maGiaoDich(hoaDon.getMaGiaoDich())
                .transactionNo(hoaDon.getTransactionNo())
                .transactionDate(hoaDon.getTransactionDate())
                .responseCode(hoaDon.getResponseCode())
                .ghiChu(hoaDon.getGhiChu())
                .danhSachVe(danhSachVeResponse)
                .danhSachDichVu(danhSachDichVuResponse)
                .tenNguoiDung(hoaDon.getUser() != null ? hoaDon.getUser().getHoTen() : null)
                .emailNguoiDung(hoaDon.getUser() != null ? hoaDon.getUser().getEmail() : null)
                .soDienThoai(hoaDon.getUser() != null ? hoaDon.getUser().getSdt() : null)
                .soLuongVe(danhSachVeResponse.size())
                .expiredAt(expiredAt)
                .isExpired(isExpired)
                .requestId(hoaDon.getRequestId())
                .tenKhachHang(hoaDon.getTenKhachHang())
                .sdtKhachHang(hoaDon.getSdtKhachHang())
                .emailKhachHang(hoaDon.getEmailKhachHang())
                .build();
    }

   
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            String username = authentication.getName(); // Đây là tenDangNhap từ JWT

            // Tìm TaiKhoan theo tenDangNhap
            TaiKhoan taiKhoan = taiKhoanRepository.findById(username).orElse(null);
            if (taiKhoan != null) {
                return taiKhoan.getUser();
            }
        }
        return null;
    }

   
    public List<HoaDonResponse> getMyInvoices() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Bạn cần đăng nhập để xem danh sách hóa đơn");
        }

        List<HoaDon> hoaDonList = hoaDonRepository.findByUserOrderByNgayLapDesc(currentUser);
        List<HoaDonResponse> responseList = new ArrayList<>();

        for (HoaDon hoaDon : hoaDonList) {
            HoaDonResponse response = getHoaDonResponseByMaHD(hoaDon.getMaHD());
            responseList.add(response);
        }

        return responseList;
    }


    public Map<String, Object> searchHoaDon(String tenKhachHang, Integer nam, Integer thang,
                                            String trangThai, int page, int size) {
        Long totalUserNotLogin = 0L;
        List<HoaDon> allHoaDon = hoaDonRepository.findAll();
        List<HoaDon> filteredHoaDon = allHoaDon.stream()
                .filter(hd -> {
                    if (tenKhachHang != null && !tenKhachHang.trim().isEmpty()) {
                        String searchTerm = tenKhachHang.toLowerCase();
                        boolean matchUser = hd.getUser() != null &&
                                hd.getUser().getHoTen() != null &&
                                hd.getUser().getHoTen().toLowerCase().contains(searchTerm);
                        boolean matchGuest = hd.getTenKhachHang() != null &&
                                hd.getTenKhachHang().toLowerCase().contains(searchTerm);
                        if (!matchUser && !matchGuest) {
                            return false;
                        }
                    }
                    if (nam != null && hd.getNgayLap() != null) {
                        if (hd.getNgayLap().getYear() != nam) {
                            return false;
                        }
                    }
                    if (thang != null && hd.getNgayLap() != null) {
                        if (hd.getNgayLap().getMonthValue() != thang) {
                            return false;
                        }
                    }
                    if (trangThai != null && !trangThai.trim().isEmpty()) {
                        if (!trangThai.equals(hd.getTrangThai())) {
                            return false;
                        }
                    }

                    return true;
                })
                .sorted((hd1, hd2) -> hd2.getNgayLap().compareTo(hd1.getNgayLap()))
                .collect(Collectors.toList());
        double tongDoanhThu = filteredHoaDon.stream()
                .filter(hd -> "PAID".equals(hd.getTrangThai()))
                .mapToDouble(HoaDon::getTongTien)
                .sum();

        int totalItems = filteredHoaDon.size();
        int totalPages = (int) Math.ceil((double) totalItems / size);
        int startIndex = (page - 1) * size;
        int endIndex = Math.min(startIndex + size, totalItems);

        List<HoaDon> pagedHoaDon = new ArrayList<>();
        if (startIndex < totalItems) {
            pagedHoaDon = filteredHoaDon.subList(startIndex, endIndex);
        }

        List<HoaDonResponse> hoaDonResponseList = new ArrayList<>();
        for (HoaDon hoaDon : pagedHoaDon) {
            if (hoaDon.getUser() == null) {
                totalUserNotLogin++;
            }
            hoaDonResponseList.add(convertToHoaDonResponse(hoaDon));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("items", hoaDonResponseList);
        response.put("currentPage", page);
        response.put("totalPages", totalPages);
        response.put("totalItems", (long) totalItems);
        response.put("itemsPerPage", size);
        response.put("tongDoanhThu", tongDoanhThu);
        response.put("totalUserNotLogin", totalUserNotLogin);
        return response;
    }

    public List<HoaDonSatisticResponse> getAllHoaDonResponse(LocalDateTime NgayBatDau, LocalDateTime NgayKetThuc) {
        NgayBatDau = NgayBatDau.plusHours(7);
        NgayKetThuc = NgayKetThuc.plusHours(7);
        System.out.println("NgayBatDau: " + NgayBatDau);
        System.out.println("NgayKetThuc: " + NgayKetThuc);
        return hoaDonRepository.findAllHoaDonPaid(NgayBatDau, NgayKetThuc);
    }

    public List<HoaDonSatisticResponse> getAllHoaDonStatusResponse(LocalDateTime NgayBatDau, LocalDateTime NgayKetThuc) {
        NgayBatDau = NgayBatDau.plusHours(7);
        NgayKetThuc = NgayKetThuc.plusHours(7);
        System.out.println("NgayBatDau: " + NgayBatDau);
        System.out.println("NgayKetThuc: " + NgayKetThuc);
        return hoaDonRepository.findAllHoaDonStatus(NgayBatDau, NgayKetThuc);
    }

    public List<PhimStatisticResponse> getAllHoaDonByPhim(LocalDateTime NgayBatDau, LocalDateTime NgayKetThuc) {
        NgayBatDau = NgayBatDau.plusHours(7);
        NgayKetThuc = NgayKetThuc.plusHours(7);
        System.out.println("NgayBatDau: " + NgayBatDau);
        System.out.println("NgayKetThuc: " + NgayKetThuc);
        return hoaDonRepository.findAllPhimStatistic(NgayBatDau, NgayKetThuc);
    }
}
