package com.example.MovieTicker.service;

import com.example.MovieTicker.config.MomoAPI;
import com.example.MovieTicker.config.PaymentConfig;
import com.example.MovieTicker.entity.HoaDon;
import com.example.MovieTicker.entity.KhuyenMai;
import com.example.MovieTicker.entity.User;
import com.example.MovieTicker.entity.TaiKhoan;
import com.example.MovieTicker.entity.Ve;
import com.example.MovieTicker.entity.ChiTietDichVuVe;
import com.example.MovieTicker.enums.InvoiceStatus;
import com.example.MovieTicker.enums.TicketStatus;
import com.example.MovieTicker.repository.HoaDonRepository;
import com.example.MovieTicker.repository.TaiKhoanRepository;
import com.example.MovieTicker.repository.VeRepository;
import com.example.MovieTicker.request.CreateMomoRefundRequest;
import com.example.MovieTicker.request.CreateMomoRequest;
import com.example.MovieTicker.request.PaymentRequest;
import com.example.MovieTicker.response.*;
import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;


import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
public class HoaDonService {
    @Value("${momo.partnerCode}")
    private String partnerCode;
    @Value("${momo.accessKey}")
    private String accessKey;
    @Value("${momo.secretKey}")
    private String secretKey;
    @Value("${momo.returnUrl}")
    private String returnUrl;
    @Value("${momo.ipn-url}")
    private String notifyUrl;
    @Value("${momo.requestType}")
    private String requestType;

    @Value("${backend.base-url}")
    private String backendBaseUrl;

    @Autowired
    private HoaDonRepository hoaDonRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private VeRepository veRepository;

    @Autowired
    private MomoAPI momoAPI;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private EmailService emailService;

    public CreateMomoResponse createMoMoQR(PaymentRequest paymentRequest) {
        String orderId = paymentRequest.getOrderId();
        String orderInfo = "Thanh toan don hang: " + orderId;
        String requestId = UUID.randomUUID().toString();
        String extraData = "Khong co khuyen mai";
        long amount = paymentRequest.getAmount();

        String rawSignature = "accessKey=" + accessKey +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&ipnUrl=" + notifyUrl +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + partnerCode +
                "&redirectUrl=" + returnUrl +
                "&requestId=" + requestId +
                "&requestType=" + requestType;
        String signature = PaymentConfig.hmacSHA256(secretKey, rawSignature);

        CreateMomoRequest request = CreateMomoRequest.builder()
                .partnerCode(partnerCode)
                .requestType(requestType)
                .ipnUrl(notifyUrl)
                .redirectUrl(returnUrl)
                .orderId(orderId)
                .orderInfo(orderInfo)
                .requestId(requestId)
                .extraData(extraData)
                .signature(signature)
                .amount(amount)
                .lang("vi")
                .build();

        return momoAPI.createMomoQR(request);
    }

    public CreateMomoResponse refundMomo(PaymentRequest paymentRequest) {
        String orderId = UUID.randomUUID().toString();
        long amount = paymentRequest.getAmount();
        String requestId = paymentRequest.getRequestId();
        String description = "Hoàn tiền hóa đơn" + orderId;
        String transId = paymentRequest.getTransId();

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&description=" + description
                + "&orderId=" + orderId
                + "&partnerCode=" + partnerCode
                + "&requestId=" + requestId
                + "&transId=" + transId;

        String signature = PaymentConfig.hmacSHA256(secretKey, rawSignature);

        CreateMomoRefundRequest request = CreateMomoRefundRequest.builder()
                .partnerCode(partnerCode)
                .amount(amount)
                .requestId(requestId)
                .orderId(orderId)
                .transId(transId)
                .lang("vi")
                .description(description)
                .signature(signature)
                .build();
        return momoAPI.createMomoRefund(request);
    }

    public CreateMomoResponse checkmomorefund(PaymentRequest paymentRequest) {
        String orderId = paymentRequest.getOrderId();
        String requestId = paymentRequest.getRequestId();
        
        // Tạo signature cho query
        String rawSignature = "accessKey=" + accessKey
                + "&orderId=" + orderId
                + "&partnerCode=" + partnerCode
                + "&requestId=" + requestId;
        
        String signature = PaymentConfig.hmacSHA256(secretKey, rawSignature);
        
        CreateMomoRefundRequest request = CreateMomoRefundRequest.builder()
                .partnerCode(partnerCode)
                .orderId(orderId)
                .requestId(requestId)
                .lang("vi")
                .signature(signature)
                .build();
        
        return momoAPI.checkRefundStatus(request);
    }
       

    public String createVnPayRequest(PaymentRequest paymentRequest, HttpServletRequest request, HttpServletResponse response) throws IOException {
        String orderId = paymentRequest.getOrderId();
        long amount = paymentRequest.getAmount() * 100;

        String vnp_TxnRef = paymentRequest.getOrderId();
        String vnp_IpAddr = PaymentConfig.getIpAddress(request);

        String vnp_TmnCode = PaymentConfig.vnp_TmnCode;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", PaymentConfig.vnp_Version);
        vnp_Params.put("vnp_Command", PaymentConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang:" + vnp_TxnRef);
        vnp_Params.put("vnp_OrderType", "other");
        String vnp_ReturnUrl = backendBaseUrl + PaymentConfig.vnp_ReturnUrl;
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List fieldNames = new ArrayList(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = (String) itr.next();
            String fieldValue = (String) vnp_Params.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                //Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                //Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        String queryUrl = query.toString();
        String vnp_SecureHash = PaymentConfig.hmacSHA512(PaymentConfig.secretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        return PaymentConfig.vnp_PayUrl + "?" + queryUrl;
    }

    public String refundVnPay(PaymentRequest paymentRequest, HttpServletRequest request) throws IOException {
        String vnp_RequestId = PaymentConfig.getRandomNumber(8);
        String vnp_Version = PaymentConfig.vnp_Version;
        String vnp_Command = "refund";
        String vnp_TmnCode = PaymentConfig.vnp_TmnCode;
        String vnp_TransactionType = paymentRequest.getTransType();
        String vnp_TxnRef = paymentRequest.getOrderId();
        long amount = paymentRequest.getAmount() * 100;
        String vnp_Amount = String.valueOf(amount);
        String vnp_OrderInfo = "Hoan tien GD OrderId:" + vnp_TxnRef;
        String vnp_TransactionNo = paymentRequest.getTransId();
        String vnp_TransactionDate = paymentRequest.getTransDate();
        String vnp_CreateBy = "System";

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());

        String vnp_IpAddr = PaymentConfig.getIpAddress(request);

        JsonObject vnp_Params = new JsonObject();

        vnp_Params.addProperty("vnp_RequestId", vnp_RequestId);
        vnp_Params.addProperty("vnp_Version", vnp_Version);
        vnp_Params.addProperty("vnp_Command", vnp_Command);
        vnp_Params.addProperty("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.addProperty("vnp_TransactionType", vnp_TransactionType);
        vnp_Params.addProperty("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.addProperty("vnp_Amount", vnp_Amount);
        vnp_Params.addProperty("vnp_OrderInfo", vnp_OrderInfo);

        if (vnp_TransactionNo != null && !vnp_TransactionNo.isEmpty()) {
            vnp_Params.addProperty("vnp_TransactionNo", vnp_TransactionNo);
        }

        vnp_Params.addProperty("vnp_TransactionDate", vnp_TransactionDate);
        vnp_Params.addProperty("vnp_CreateBy", vnp_CreateBy);
        vnp_Params.addProperty("vnp_CreateDate", vnp_CreateDate);
        vnp_Params.addProperty("vnp_IpAddr", vnp_IpAddr);

        String hash_Data = String.join("|", vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode,
                vnp_TransactionType, vnp_TxnRef, vnp_Amount, vnp_TransactionNo, vnp_TransactionDate,
                vnp_CreateBy, vnp_CreateDate, vnp_IpAddr, vnp_OrderInfo);

        String vnp_SecureHash = PaymentConfig.hmacSHA512(PaymentConfig.secretKey, hash_Data.toString());

        vnp_Params.addProperty("vnp_SecureHash", vnp_SecureHash);

        URL url = new URL(PaymentConfig.vnp_ApiUrl);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");
        con.setDoOutput(true);
        DataOutputStream wr = new DataOutputStream(con.getOutputStream());
        wr.writeBytes(vnp_Params.toString());
        wr.flush();
        wr.close();
        int responseCode = con.getResponseCode();
        System.out.println("nSending 'POST' request to URL : " + url);
        System.out.println("Post Data : " + vnp_Params);
        System.out.println("Response Code : " + responseCode);
        BufferedReader in = new BufferedReader(
                new InputStreamReader(con.getInputStream()));
        String output;
        StringBuffer response = new StringBuffer();
        while ((output = in.readLine()) != null) {
            response.append(output);
        }
        in.close();
        System.out.println(response.toString());
        return response.toString();
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
