package com.example.MovieTicker.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.MovieTicker.repository.*;
import com.example.MovieTicker.request.*;
import com.example.MovieTicker.response.*;
import com.example.MovieTicker.entity.*;
import com.example.MovieTicker.enums.TicketStatus;
import com.example.MovieTicker.enums.InvoiceStatus;
import com.example.MovieTicker.config.MomoAPI;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class VeService {
    @Autowired
    private VeRepository veRepository;
    @Autowired
    private KhuyenMaiRepository khuyenMaiRepository;
    @Autowired
    private VeKhuyenMaiRepository veKhuyenMaiRepository;
    @Autowired
    private ChiTietDichVuVeRepository chiTietDichVuVeRepository;
    @Autowired
    private DichVuDiKemRepository dichVuDiKemRepository;
    @Autowired
    private GheRepository gheRepository;
    @Autowired
    private SuatChieuRepository suatChieuRepository;
    @Autowired
    private HoaDonService hoaDonService;
    @Autowired
    private MomoAPI momoAPI;
    @Autowired
    private HoaDonRepository hoaDonRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private QRCodeService qrCodeService;
    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Transactional
    public HoaDonResponse createTickets(TicketBookingRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        // Validate the request
        if (request.getMaGheList() == null || request.getMaGheList().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ghế trước khi đặt vé");
        }

        SuatChieu suatChieu = suatChieuRepository.findById(request.getMaSuatChieu())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy suất chiếu với mã: " + request.getMaSuatChieu()));

        // Kiểm tra nếu có yêu cầu phim cụ thể, đảm bảo suất chiếu đúng phim
        if (request.getMaPhim() != null && !request.getMaPhim().equals(suatChieu.getPhim().getMaPhim())) {
            throw new RuntimeException("Suất chiếu không khớp với phim đã chọn");
        }
            
        // Kiểm tra các ghế có tồn tại không
        List<Ghe> gheList = gheRepository.findAllById(request.getMaGheList());
        if (gheList.size() != request.getMaGheList().size()) {
            throw new RuntimeException("Một hoặc nhiều ghế không tồn tại trong hệ thống");
        }
        // Kiểm tra và xóa các vé processing đã hết hạn (quá 10 phút)
        LocalDateTime expiredTime = LocalDateTime.now().minusMinutes(10);
        List<Ve> expiredTickets = veRepository.findTicketsBySuatChieuAndSeatsAndStatusAndTime(
            request.getMaSuatChieu(), 
            request.getMaGheList(), 
            TicketStatus.PROCESSING.getCode(),
            expiredTime
        );
        if (!expiredTickets.isEmpty()) {
            // Cập nhật trạng thái các vé hết hạn thành EXPIRED
            for (Ve expiredTicket : expiredTickets) {
                expiredTicket.setTrangThai(TicketStatus.EXPIRED.getCode());
                veRepository.save(expiredTicket);
            }
        }
        // Kiểm tra ghế đã được đặt và thanh toán chưa
        List<Ve> paidTickets = veRepository.findTicketsBySuatChieuAndSeatsAndStatus(
            request.getMaSuatChieu(), 
            request.getMaGheList(), 
            TicketStatus.PAID.getCode()
        );
        if (!paidTickets.isEmpty()) {
            throw new RuntimeException("Đã có người đặt một hoặc nhiều ghế bạn chọn. Vui lòng chọn ghế khác.");
        }
        List<Ve> paidTickets2 = veRepository.findTicketsBySuatChieuAndSeatsAndStatus(
            request.getMaSuatChieu(), 
            request.getMaGheList(), 
            TicketStatus.PROCESSING.getCode()
        );
        if (!paidTickets2.isEmpty()) {
            throw new RuntimeException("Đã có người đặt một hoặc nhiều ghế bạn chọn. Vui lòng chọn ghế khác.");
        }
        
        
        
        // Kiểm tra khuyến mãi nếu có
        KhuyenMai khuyenMai = null;
        if (request.getMaKhuyenMai() != null) {
            khuyenMai = khuyenMaiRepository.findById(request.getMaKhuyenMai())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khuyến mãi với mã: " + request.getMaKhuyenMai()));
                
            // Kiểm tra khuyến mãi có hợp lệ không
            if (!isPromotionValid(khuyenMai)) {
                throw new RuntimeException("Khuyến mãi không còn hiệu lực hoặc chưa bắt đầu");
            }
        }
        
        // Tính trước tổng tiền để tạo hóa đơn
        double tongTienVe = 0;
        for (Ghe ghe : gheList) {
            double giaVe = suatChieu.getDonGiaCoSo();
            double phuThuGhe = ghe.getLoaiGhe().getPhuThu();
            tongTienVe += giaVe + phuThuGhe;
        }
        
        // Tạo hóa đơn trước
        HoaDon hoaDon = new HoaDon();
        hoaDon.setTongTien(tongTienVe); // Sẽ cập nhật lại sau khi thêm dịch vụ và khuyến mãi
        hoaDon.setPhuongThucThanhToan(request.getPhuongThucThanhToan());
        hoaDon.setNgayLap(LocalDateTime.now());
        hoaDon.setTrangThai(InvoiceStatus.PROCESSING.getCode());
        hoaDon.setMaGiaoDich("GD" + System.currentTimeMillis()); 
        
        User currentUser = getCurrentUser();
        hoaDon.setUser(currentUser);
        
        if (currentUser == null) {
            // Validate thông tin khách vãng lai
            if (request.getTenKhachHang() == null || request.getTenKhachHang().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng nhập tên khách hàng");
            }
            if (request.getSdtKhachHang() == null || request.getSdtKhachHang().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng nhập số điện thoại");
            }
            if (request.getEmailKhachHang() == null || request.getEmailKhachHang().trim().isEmpty()) {
                throw new RuntimeException("Vui lòng nhập email");
            }
            
            hoaDon.setTenKhachHang(request.getTenKhachHang());
            hoaDon.setSdtKhachHang(request.getSdtKhachHang());
            hoaDon.setEmailKhachHang(request.getEmailKhachHang());
        } else {
            // Nếu có user, set các trường khách vãng lai về null
            hoaDon.setTenKhachHang(null);
            hoaDon.setSdtKhachHang(null);
            hoaDon.setEmailKhachHang(null);
        }
        
        hoaDon = hoaDonRepository.save(hoaDon);
        
        // Tạo vé cho từng ghế
        List<Ve> ticketList = new ArrayList<>();
        try {
            for (Ghe ghe : gheList) {
                Ve ve1 = createSingleTicket(request, suatChieu, ghe, hoaDon);
                ticketList.add(ve1);
                
                // Áp dụng khuyến mãi nếu có
                if (khuyenMai != null) {
                    try {
                        for (Ve ve : ticketList) {
                            // Đảm bảo vé đã được lưu và có mã vé
                            if (ve.getMaVe() == null) {
                                throw new RuntimeException("Mã vé không được null khi áp dụng khuyến mãi");
                            }
                            
                            VeKhuyenMaiId veKhuyenMaiId = new VeKhuyenMaiId();
                            veKhuyenMaiId.setMaVe(ve.getMaVe());
                            veKhuyenMaiId.setMaKm(khuyenMai.getMaKm());
                            
                            VeKhuyenMai veKhuyenMai = new VeKhuyenMai();
                            veKhuyenMai.setId(veKhuyenMaiId);
                            
                            // Lưu ý: Khi đã dùng @MapsId, không cần set ve và khuyenMai riêng nữa
                            // Nhưng để an toàn, vẫn set cả hai
                            veKhuyenMai.setVe(ve);
                            veKhuyenMai.setKhuyenMai(khuyenMai);
                            veKhuyenMai.setNgayApDung(LocalDate.now());
                            
                            // Debug
                            System.out.println("Áp dụng KM: Ve_ID=" + ve.getMaVe() + ", KM_ID=" + khuyenMai.getMaKm());
                            
                            veKhuyenMaiRepository.save(veKhuyenMai);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        throw new RuntimeException("Lỗi khi áp dụng khuyến mãi: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Có lỗi xảy ra khi tạo vé: " + e.getMessage());
        }
        
        // Xử lý dịch vụ đi kèm
        double tongTienDichVu = 0;
        if (request.getDichVuList() != null && !request.getDichVuList().isEmpty()) {
            try {
                Ve firstTicket = ticketList.get(0);
                tongTienDichVu = processAdditionalServices(firstTicket, request.getDichVuList());
            } catch (Exception e) {
                throw new RuntimeException("Có lỗi xảy ra khi thêm dịch vụ đi kèm: " + e.getMessage());
            }
        }
        
        // Tính toán giá cuối cùng và cập nhật hóa đơn
        double tongCong = tongTienVe + tongTienDichVu;
        double giamGia = 0;
        
        // Áp dụng khuyến mãi nếu có
        if (request.getMaKhuyenMai() != null) {
            KhuyenMai km = khuyenMaiRepository.findById(request.getMaKhuyenMai()).get();
            giamGia = tongCong * (km.getGiaTri() / 100.0);
            tongCong -= giamGia;
        }
        
        // Cập nhật hóa đơn với thông tin cuối cùng
        hoaDon.setTongTien(tongCong);
        String thongTinChiTiet = String.format(
            "Tổng tiền vé: %.0f VND\nPhụ thu dịch vụ: %.0f VND\nGiảm giá: %.0f VND\nTổng cộng: %.0f VND",
            tongTienVe, tongTienDichVu, giamGia, tongCong
        );
        hoaDon.setGhiChu(thongTinChiTiet);
        hoaDon.setVes(ticketList);
        hoaDon.setTrangThai(InvoiceStatus.PROCESSING.getCode());
        hoaDon = hoaDonRepository.save(hoaDon);
        
        // Chuyển đổi sang response
        return convertToHoaDonResponse(hoaDon);
    }
    
    private Ve createSingleTicket(TicketBookingRequest request, SuatChieu suatChieu, Ghe ghe, HoaDon hoaDon) {
        Ve ve = new Ve();
        ve.setSuatChieu(suatChieu);
        ve.setGhe(ghe);
        ve.setHoaDon(hoaDon); // Set the HoaDon reference here
        
        double giaVe = suatChieu.getDonGiaCoSo();
        double phuThuGhe = ghe.getLoaiGhe().getPhuThu();
        ve.setThanhTien(giaVe + phuThuGhe);
        
        ve.setNgayDat(LocalDateTime.now());
        ve.setUser(null);
        ve.setTrangThai(TicketStatus.PROCESSING.getCode());

        // Lưu vé trước để có mã vé
        ve = veRepository.save(ve);
        
        // // Tạo QR code cho vé
        // try {
        //     String qrContent = qrCodeService.createTicketQRContent(
        //         ve.getMaVe(),
        //         suatChieu.getPhim().getTenPhim(),
        //         suatChieu.getPhongChieu().getTenPhong(),
        //         ghe.getTenGhe(),
        //         suatChieu.getThoiGianBatDau().toString()
        //     );
            
        //     String qrCodeUrl = qrCodeService.generateQRCode(qrContent, ve.getMaVe());
        //     ve.setQrCodeUrl(qrCodeUrl);
            
        //     // Cập nhật lại vé với QR code URL
        //     ve = veRepository.save(ve);
            
        // } catch (Exception e) {
        //     // Log lỗi nhưng không dừng việc tạo vé
        //     System.err.println("Lỗi khi tạo QR code cho vé " + ve.getMaVe() + ": " + e.getMessage());
        // }

        return ve;
    }
    
    private double processAdditionalServices(Ve ve, List<DichVuRequest> dichVuList) {
        double totalServiceAmount = 0;
        
        for (DichVuRequest dvRequest : dichVuList) {
            DichVuDiKem dichVu = dichVuDiKemRepository.findById(dvRequest.getMaDv())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ đi kèm với mã: " + dvRequest.getMaDv()));
            
            // Kiểm tra số lượng hợp lệ
            if (dvRequest.getSoLuong() <= 0) {
                throw new RuntimeException("Số lượng dịch vụ phải lớn hơn 0");
            }
            
            double serviceCost = dichVu.getDonGia() * dvRequest.getSoLuong();
            totalServiceAmount += serviceCost;
                
            ChiTietDichVuVe chiTiet = new ChiTietDichVuVe();
            chiTiet.setVe(ve);
            chiTiet.setDichVuDiKem(dichVu);
            chiTiet.setSoLuong(dvRequest.getSoLuong());
            chiTiet.setThanhTien(serviceCost);
            chiTietDichVuVeRepository.save(chiTiet);
        }
        
        return totalServiceAmount;
    }
    
    private boolean isPromotionValid(KhuyenMai khuyenMai) {
        LocalDate today = LocalDate.now();
       
        return khuyenMai.isTrangThai() &&
               (khuyenMai.getNgayBatDau().compareTo(today) <= 0) &&
               (khuyenMai.getNgayKetThuc().compareTo(today) >= 0) &&
               (khuyenMai.getSoLuong() > 0);
    }
    
    public Ve getVeById(String maVe) {
        return veRepository.findById(maVe)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy vé với mã: " + maVe));
    }
    
    public List<Ve> getVesBySuatChieu(String maSuatChieu) {
        return veRepository.findBySuatChieuMaSuatChieu(maSuatChieu);
    }
    
    private HoaDonResponse convertToHoaDonResponse(HoaDon hoaDon) {
        List<VeResponse> danhSachVeResponse = hoaDon.getVes().stream()
            .map(this::convertToVeResponse)
            .collect(Collectors.toList());
            
        return HoaDonResponse.builder()
            .maHD(hoaDon.getMaHD())
            .ngayLap(hoaDon.getNgayLap())
            .tongTien(hoaDon.getTongTien())
            .phuongThucThanhToan(hoaDon.getPhuongThucThanhToan())
            .trangThai(hoaDon.getTrangThai())
            .maGiaoDich(hoaDon.getMaGiaoDich())
            .ghiChu(hoaDon.getGhiChu())
            .danhSachVe(danhSachVeResponse)
            .tenNguoiDung(hoaDon.getUser() != null ? hoaDon.getUser().getHoTen() : null)
            .emailNguoiDung(hoaDon.getUser() != null ? hoaDon.getUser().getEmail() : null)
            .soDienThoai(hoaDon.getUser() != null ? hoaDon.getUser().getSdt() : null)
            .tenKhachHang(hoaDon.getTenKhachHang())
            .sdtKhachHang(hoaDon.getSdtKhachHang())
            .emailKhachHang(hoaDon.getEmailKhachHang())
            .soLuongVe(danhSachVeResponse.size())
            .build();
    }
    
    private VeResponse convertToVeResponse(Ve ve) {
        String tenGhe = ve.getGhe().getTenGhe();
        String hangGhe = tenGhe.substring(0, 1);
        String soGheStr = tenGhe.substring(1); 
        Integer soGhe = Integer.parseInt(soGheStr);
        
        return VeResponse.builder()
            .maVe(ve.getMaVe())
            .tenPhim(ve.getSuatChieu().getPhim().getTenPhim())
            .tenPhongChieu(ve.getSuatChieu().getPhongChieu().getTenPhong())
            .tenGhe(tenGhe)
            .hangGhe(hangGhe)
            .soGhe(soGhe)
            .loaiGhe(ve.getGhe().getLoaiGhe().getTenLoaiGhe())
            .giaGhe((double) ve.getGhe().getLoaiGhe().getPhuThu())
            .ngayChieu(ve.getSuatChieu().getThoiGianBatDau())
            .thoiGianChieu(ve.getSuatChieu().getThoiGianBatDau())
            .ngayDat(ve.getNgayDat())
            .thanhTien(ve.getThanhTien())
            .trangThai(ve.getTrangThai())
            .maHoaDon(ve.getHoaDon().getMaHD())
            .maSuatChieu(ve.getSuatChieu().getMaSuatChieu())
            .qrCodeUrl(ve.getQrCodeUrl())
            .build();
    }


    private User getCurrentUser() {
        String username = com.example.MovieTicker.util.SecurityUtil.getCurrentUsername();
        if (username != null && !"anonymousUser".equals(username)) {
            TaiKhoan taiKhoan = taiKhoanRepository.findById(username).orElse(null);
            if (taiKhoan != null) {
                return taiKhoan.getUser();
            }
        }
        return null;
    }


    public Map<String, Object> searchVe(String tenKhachHang, String tenPhim, Integer nam, 
                                                   Integer thang, String trangThai, String maHoaDon,
                                                   int page, int size) {
      
        List<Ve> allVe = veRepository.findAll();
   
        List<Ve> filteredVe = allVe.stream()
            .filter(ve -> {
                // Filter theo tên khách hàng (tìm trong cả user và khách vãng lai của hóa đơn)
                if (tenKhachHang != null && !tenKhachHang.trim().isEmpty()) {
                    String searchTerm = tenKhachHang.toLowerCase();
                    HoaDon hoaDon = ve.getHoaDon();
                    if (hoaDon != null) {
                        boolean matchUser = hoaDon.getUser() != null && 
                                           hoaDon.getUser().getHoTen() != null && 
                                           hoaDon.getUser().getHoTen().toLowerCase().contains(searchTerm);
                        boolean matchGuest = hoaDon.getTenKhachHang() != null && 
                                            hoaDon.getTenKhachHang().toLowerCase().contains(searchTerm);
                        if (!matchUser && !matchGuest) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                
                // Filter theo tên phim
                if (tenPhim != null && !tenPhim.trim().isEmpty()) {
                    String searchTerm = tenPhim.toLowerCase();
                    if (ve.getSuatChieu() == null || 
                        ve.getSuatChieu().getPhim() == null ||
                        ve.getSuatChieu().getPhim().getTenPhim() == null ||
                        !ve.getSuatChieu().getPhim().getTenPhim().toLowerCase().contains(searchTerm)) {
                        return false;
                    }
                }
                
                // Filter theo năm
                if (nam != null && ve.getNgayDat() != null) {
                    if (ve.getNgayDat().getYear() != nam) {
                        return false;
                    }
                }
                
                // Filter theo tháng
                if (thang != null && ve.getNgayDat() != null) {
                    if (ve.getNgayDat().getMonthValue() != thang) {
                        return false;
                    }
                }
                
                // Filter theo trạng thái
                if (trangThai != null && !trangThai.trim().isEmpty()) {
                    if (!trangThai.equals(ve.getTrangThai())) {
                        return false;
                    }
                }
                
                // Filter theo mã hóa đơn
                if (maHoaDon != null && !maHoaDon.trim().isEmpty()) {
                    if (ve.getHoaDon() == null || !maHoaDon.equals(ve.getHoaDon().getMaHD())) {
                        return false;
                    }
                }
                
                return true;
            })
            .sorted((ve1, ve2) -> ve2.getNgayDat().compareTo(ve1.getNgayDat())) // Sort by date DESC
            .collect(Collectors.toList());
        
        // Tính tổng doanh thu từ các vé đã filter
        double tongDoanhThu = filteredVe.stream()
            .filter(ve -> "PAID".equals(ve.getTrangThai())) // Chỉ tính vé đã thanh toán
            .mapToDouble(Ve::getThanhTien)
            .sum();
        
        // Pagination
        int totalItems = filteredVe.size();
        int totalPages = (int) Math.ceil((double) totalItems / size);
        int startIndex = (page - 1) * size;
        int endIndex = Math.min(startIndex + size, totalItems);
        
        List<Ve> pagedVe = new ArrayList<>();
        if (startIndex < totalItems) {
            pagedVe = filteredVe.subList(startIndex, endIndex);
        }
        
        // Convert to response
        List<VeResponse> veResponseList = new ArrayList<>();
        for (Ve ve : pagedVe) {
            veResponseList.add(convertToVeResponse(ve));
        }
        
        // Build response map
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("items", veResponseList);
        response.put("currentPage", page);
        response.put("totalPages", totalPages);
        response.put("totalItems", (long) totalItems);
        response.put("itemsPerPage", size);
        response.put("tongDoanhThu", tongDoanhThu);
        
        return response;
    }
}
