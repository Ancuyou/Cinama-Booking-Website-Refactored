package com.example.MovieTicker.service;

import com.example.MovieTicker.entity.PasswordResetToken;
import com.example.MovieTicker.response.HoaDonResponse;
import com.example.MovieTicker.response.VeResponse;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.io.*;
import java.net.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    public void sendPasswordResetEmail(String to, PasswordResetToken token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Yêu Cầu Đặt Lại Mật Khẩu");
        String resetUrl = frontendBaseUrl + "/reset-password?token=" + token.getToken();
        String emailBody = "Chào bạn,\n\n"
                + "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n"
                + "Vui lòng nhấp vào đường link dưới đây để đặt lại mật khẩu:\n"
                + resetUrl + "\n\n"
                + "Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email này.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ Cinema.";
        message.setText(emailBody);
        mailSender.send(message);
    }

    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác Thực Tài Khoản Cinema");
        String emailBody = "Chào bạn,\n\n"
                + "Cảm ơn bạn đã đăng ký tài khoản tại Cinema.\n"
                + "Mã OTP của bạn là: " + otp + "\n\n"
                + "Mã này sẽ hết hạn sau 1 phút.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ Cinema.";
        message.setText(emailBody);
        mailSender.send(message);
    }
    public void sendNewAccountCredentialsEmail(String to, String username, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Chào mừng bạn đến với MovieTicker - Thông tin tài khoản của bạn");
        message.setText("Chào bạn,\n\n"
                + "Cảm ơn bạn đã đăng ký tài khoản tại MovieTicker qua Google.\n"
                + "Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập để bạn có thể sử dụng trong trường hợp cần thiết:\n\n"
                + "Tên đăng nhập: " + username + "\n"
                + "Mật khẩu: " + password + "\n\n"
                + "Bạn có thể đăng nhập bằng tài khoản Google hoặc sử dụng thông tin trên.\n"
                + "Trân trọng,\n"
                + "Đội ngũ MovieTicker");
        mailSender.send(message);
    }

    public void sendSuccessInvoiceEmail(String to, HoaDonResponse invoiceDetails) {
        System.out.println("=== START SENDING EMAIL ===");
        System.out.println("To: " + to);
        System.out.println("Invoice: " + (invoiceDetails != null ? invoiceDetails.getMaHD() : "null"));
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setFrom("noreply@cinema.com");
            helper.setSubject("🎬 Hóa Đơn Mua Vé - Cinema");
            
            System.out.println("Building email HTML...");
            String htmlContent = buildEmailHTML(invoiceDetails);
            helper.setText(htmlContent, true);
            System.out.println("✓ HTML content built successfully");

            // Attach QR codes
            if (invoiceDetails.getDanhSachVe() != null && !invoiceDetails.getDanhSachVe().isEmpty()) {
                System.out.println("Attaching QR codes for " + invoiceDetails.getDanhSachVe().size() + " tickets");
                int index = 0;
                for (VeResponse ve : invoiceDetails.getDanhSachVe()) {
                    System.out.println("  - Ticket " + index + ": " + ve.getMaVe());
                    if (ve.getQrCodeUrl() != null && !ve.getQrCodeUrl().isEmpty()) {
                        System.out.println("    QR URL: " + ve.getQrCodeUrl());
                        attachQRCode(helper, ve.getQrCodeUrl(), "qr" + index);
                    } else {
                        System.out.println("    ⚠ No QR code URL");
                    }
                    index++;
                }
            } else {
                System.out.println("⚠ No tickets found in invoice");
            }

            System.out.println("Sending email...");
            mailSender.send(message);
            System.out.println("✓ Email sent successfully to: " + to);
            System.out.println("=== EMAIL SENT SUCCESSFULLY ===\n");
        } catch (MessagingException e) {
            System.err.println("✗ MessagingException: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi email cho: " + to, e);
        } catch (Exception e) {
            System.err.println("✗ Failed to send email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi email cho: " + to, e);
        }
    }

    // ============= BUILD HTML EMAIL =============
    private String buildEmailHTML(HoaDonResponse invoice) {
        System.out.println("  Building HTML for invoice: " + invoice.getMaHD());
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>")
            .append("<html><head><meta charset='UTF-8'></head>")
            .append("<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif'>")
            .append("<div style='max-width:600px;margin:30px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)'>");

        // Header
        html.append("<div style='background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center'>")
            .append("<h1 style='color:#fff;margin:0;font-size:28px'>🎬 Cinema</h1>")
            .append("<p style='color:#fff;margin:10px 0 0;opacity:0.9'>Cảm ơn bạn đã đặt vé</p>")
            .append("</div>");

        // Invoice Info
        html.append("<div style='padding:30px'>")
            .append("<h2 style='color:#333;margin:0 0 20px;font-size:20px'>Thông tin hóa đơn</h2>")
            .append("<table style='width:100%;border-collapse:collapse'>")
            .append(buildInfoRow("Mã hóa đơn", invoice.getMaHD()))
            .append(buildInfoRow("Khách hàng", invoice.getTenNguoiDung() != null ? invoice.getTenNguoiDung() : invoice.getTenKhachHang()))
            .append(buildInfoRow("Email", invoice.getEmailNguoiDung() != null ? invoice.getEmailNguoiDung() : invoice.getEmailKhachHang()))
            .append(buildInfoRow("Số điện thoại", invoice.getSoDienThoai() != null ? invoice.getSoDienThoai() : invoice.getSdtKhachHang()))
            .append(buildInfoRow("Ngày lập", invoice.getNgayLap()))
            .append(buildInfoRow("Thanh toán", invoice.getPhuongThucThanhToan()))
            .append("</table>");

        // Total
        System.out.println("  Total amount type: " + (invoice.getTongTien() != null ? invoice.getTongTien().getClass().getName() : "null"));
        System.out.println("  Total amount value: " + invoice.getTongTien());
        
        String formattedTotal;
        try {
            Object tongTien = invoice.getTongTien();
            if (tongTien instanceof Double || tongTien instanceof Float) {
                formattedTotal = String.format("%,.0f", ((Number) tongTien).doubleValue());
            } else if (tongTien instanceof Number) {
                formattedTotal = String.format("%,d", ((Number) tongTien).longValue());
            } else if (tongTien != null) {
                // If it's String or BigDecimal, parse it
                formattedTotal = String.format("%,.0f", Double.parseDouble(tongTien.toString()));
            } else {
                formattedTotal = "0";
            }
        } catch (Exception e) {
            System.err.println("  ✗ Error formatting total: " + e.getMessage());
            formattedTotal = invoice.getTongTien() != null ? invoice.getTongTien().toString() : "0";
        }
        
        html.append("<div style='margin:20px 0;padding:15px;background:#f8f9fa;border-radius:8px;text-align:right'>")
            .append("<span style='font-size:16px;color:#666'>Tổng tiền:</span> ")
            .append("<span style='font-size:24px;color:#667eea;font-weight:bold'>")
            .append(formattedTotal)
            .append(" VNĐ</span></div>");

        // Tickets
        if (invoice.getDanhSachVe() != null && !invoice.getDanhSachVe().isEmpty()) {
            html.append("<h2 style='color:#333;margin:30px 0 20px;font-size:20px'>Thông tin vé</h2>");
            
            int qrIndex = 0;
            for (VeResponse ve : invoice.getDanhSachVe()) {
                html.append(buildTicketCard(ve, qrIndex++));
            }
            System.out.println("  Added " + invoice.getDanhSachVe().size() + " ticket cards to HTML");
        }

        // Footer
        html.append("<div style='margin-top:30px;padding-top:20px;border-top:1px solid #eee'>")
            .append("<p style='color:#666;font-size:14px;line-height:1.6;margin:0'>")
            .append("Vui lòng mang QR code này đến quầy để đổi vé.<br>")
            .append("Đến trước giờ chiếu 15 phút để có chỗ ngồi tốt nhất.</p>")
            .append("</div>");

        html.append("</div>") // End padding
            .append("<div style='text-align:center;padding:20px;color:#999;font-size:12px'>")
            .append("© 2024 Cinema. All rights reserved.")
            .append("</div>");

        html.append("</div></body></html>");
        
        System.out.println("  HTML built, length: " + html.length() + " characters");
        return html.toString();
    }

    // ============= BUILD TICKET CARD =============
    private String buildTicketCard(VeResponse ve, int qrIndex) {
        StringBuilder card = new StringBuilder();
        LocalDateTime thoiGianChieu = ve.getThoiGianChieu();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedTime = thoiGianChieu.format(formatter);

        card.append("<div style='border:2px dashed #667eea;border-radius:10px;padding:20px;margin:15px 0;background:#fafbff'>")
            // Sử dụng flexbox: căn đều 2 bên, canh giữa theo trục dọc
            .append("<div style='display:flex;justify-content:space-between;align-items:center;'>")
            
            // Bên trái: thông tin vé
            .append("<div style='flex:1; padding-right:20px;'>")
            .append("<h3 style='color:#667eea;margin:0 0 15px;font-size:18px'>").append(escapeHtml(ve.getTenPhim())).append("</h3>")
            .append("<p style='margin:5px 0;color:#666'><b>Mã vé:</b> ").append(escapeHtml(ve.getMaVe())).append("</p>")
            .append("<p style='margin:5px 0;color:#666'><b>Ghế:</b> <span style='display:inline-block;padding:4px 12px;background:#667eea;color:#fff;border-radius:4px;font-weight:bold'>")
            .append(escapeHtml(ve.getTenGhe())).append("</span></p>")
            .append("<p style='margin:5px 0;color:#666'><b>Suất chiếu:</b> ").append(escapeHtml(formattedTime)).append("</p>")
            .append("</div>");

        // Bên phải: QR Code
        if (ve.getQrCodeUrl() != null && !ve.getQrCodeUrl().isEmpty()) {
            card.append("<div style='flex-shrink:0; text-align:center;'>")
                .append("<img src='cid:qr").append(qrIndex).append("' ")
                .append("alt='QR Code' style='width:120px;height:120px;border:3px solid #667eea;border-radius:8px;background:#fff;padding:8px;display:block;margin:auto;'/>")
                .append("</div>");
        }

        card.append("</div></div>");

        return card.toString();
    }
    // ============= ESCAPE HTML =============
    private String escapeHtml(Object value) {
        if (value == null) return "";
        return value.toString()
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;");
    }

    // ============= BUILD INFO ROW =============
    private String buildInfoRow(String label, Object value) {
        String displayValue = (value != null) ? escapeHtml(value) : "";
        return "<tr><td style='padding:8px 0;color:#666;width:40%'>" + escapeHtml(label) + ":</td>" +
            "<td style='padding:8px 0;color:#333;font-weight:500'>" + displayValue + "</td></tr>";
    }

    // ============= ATTACH QR CODE =============
    private void attachQRCode(MimeMessageHelper helper, String qrCodeUrl, String contentId) {
        System.out.println("    Attaching QR [" + contentId + "]...");
        System.out.println("    URL type: " + getUrlType(qrCodeUrl));
        
        try {
            // Base64 Data URI
            if (qrCodeUrl.startsWith("data:image")) {
                System.out.println("    Processing as Base64 data URI");
                int commaIndex = qrCodeUrl.indexOf(",");
                if (commaIndex == -1) {
                    System.err.println("    ✗ Invalid data URI format (no comma found)");
                    return;
                }
                
                String base64 = qrCodeUrl.substring(commaIndex + 1);
                System.out.println("    Base64 length: " + base64.length());
                
                byte[] bytes = Base64.getDecoder().decode(base64);
                System.out.println("    Decoded bytes: " + bytes.length);
                
                helper.addInline(contentId, new ByteArrayResource(bytes), "image/png");
                System.out.println("    ✓ QR attached as inline resource (Base64)");
                return;
            }
            
            // HTTP/HTTPS URL
            if (qrCodeUrl.startsWith("http://") || qrCodeUrl.startsWith("https://")) {
                System.out.println("    Processing as HTTP URL");
                URI uri = new URI(qrCodeUrl);
                HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                conn.setRequestMethod("GET");
                
                System.out.println("    Connecting to: " + uri);
                int responseCode = conn.getResponseCode();
                System.out.println("    Response code: " + responseCode);
                
                if (responseCode == 200) {
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    InputStream in = conn.getInputStream();
                    byte[] buffer = new byte[4096];
                    int n;
                    int totalBytes = 0;
                    while ((n = in.read(buffer)) != -1) {
                        out.write(buffer, 0, n);
                        totalBytes += n;
                    }
                    in.close();
                    System.out.println("    Downloaded: " + totalBytes + " bytes");
                    
                    helper.addInline(contentId, new ByteArrayResource(out.toByteArray()), "image/png");
                    System.out.println("    ✓ QR attached as inline resource (HTTP)");
                    return;
                } else {
                    System.err.println("    ✗ HTTP request failed with code: " + responseCode);
                    return;
                }
            }
            
            // Local File Path
            System.out.println("    Processing as local file path");
            File file = new File(qrCodeUrl);
            System.out.println("    Trying path: " + file.getAbsolutePath());
            
            if (!file.exists()) {
                System.out.println("    File not found, trying with user.dir");
                file = new File(System.getProperty("user.dir"), qrCodeUrl);
                System.out.println("    Trying path: " + file.getAbsolutePath());
            }
            
            if (file.exists()) {
                if (file.canRead()) {
                    System.out.println("    File found and readable, size: " + file.length() + " bytes");
                    helper.addInline(contentId, file);
                    System.out.println("    ✓ QR attached as file resource");
                } else {
                    System.err.println("    ✗ File exists but cannot be read: " + file.getAbsolutePath());
                }
            } else {
                System.err.println("    ✗ QR file not found: " + file.getAbsolutePath());
            }
            
        } catch (URISyntaxException e) {
            System.err.println("    ✗ Invalid URI: " + e.getMessage());
            e.printStackTrace();
        } catch (IOException e) {
            System.err.println("    ✗ IO Error: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("    ✗ Failed to attach QR: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ============= GET URL TYPE =============
    private String getUrlType(String url) {
        if (url == null) return "null";
        if (url.startsWith("data:image")) return "Base64 Data URI";
        if (url.startsWith("http://") || url.startsWith("https://")) return "HTTP URL";
        return "Local File Path";
    }

    public void sendRefundInvoiceEmail(String to, HoaDonResponse invoiceDetails, String refundTransactionNo) {
        System.out.println("=== START SENDING REFUND EMAIL ===");
        System.out.println("To: " + to);
        System.out.println("Invoice: " + (invoiceDetails != null ? invoiceDetails.getMaHD() : "null"));
        System.out.println("Refund Transaction: " + refundTransactionNo);
        
        if (invoiceDetails == null || invoiceDetails.getDanhSachVe() == null || invoiceDetails.getDanhSachVe().isEmpty()) {
            System.err.println("✗ Invalid invoice details or no tickets found");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            // ✅ QUAN TRỌNG: Phải set multipart = true nếu có attach QR codes
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setFrom("noreply@cinema.com"); // ✅ Thêm setFrom
            helper.setSubject("🔄 Thông Báo Hoàn Tiền - Mã HĐ: " + invoiceDetails.getMaHD());
            
            System.out.println("Building refund email HTML...");
            
            // Format thời gian
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String ngayLap = invoiceDetails.getNgayLap() != null ? 
                invoiceDetails.getNgayLap().format(formatter) : "N/A";
            String ngayHoanTien = LocalDateTime.now().format(formatter);
            
            // Tạo HTML content
            StringBuilder html = new StringBuilder();
            html.append("<!DOCTYPE html>")
                .append("<html><head><meta charset='UTF-8'>")
                .append("<meta name='viewport' content='width=device-width,initial-scale=1.0'>")
                .append("</head><body style='margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5'>")
                .append("<div style='max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)'>")
                
                // Header
                .append("<div style='background:linear-gradient(135deg,#ffc107 0%,#ff9800 100%);color:#fff;padding:40px 30px;text-align:center'>")
                .append("<h1 style='margin:0 0 10px;font-size:28px'>🔄 HOÀN TIỀN THÀNH CÔNG</h1>")
                .append("<p style='margin:0;font-size:16px;opacity:0.9'>Mã hóa đơn: ").append(escapeHtml(invoiceDetails.getMaHD())).append("</p>")
                .append("</div>")
                
                // Content
                .append("<div style='padding:30px'>")
                
                // Warning badge
                .append("<div style='background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:15px;margin-bottom:20px'>")
                .append("<p style='margin:0;color:#856404;font-size:14px'><strong>⚠️ LƯU Ý:</strong> Vé đã được hoàn tiền và không còn hiệu lực sử dụng.</p>")
                .append("</div>")
                
                // Thông tin hoàn tiền
                .append("<h2 style='color:#333;margin:0 0 15px;font-size:20px'>📋 Thông tin hoàn tiền</h2>")
                .append("<table style='width:100%;border-collapse:collapse;margin-bottom:25px'>")
                .append(buildInfoRow("Mã giao dịch hoàn", refundTransactionNo))
                .append(buildInfoRow("Ngày đặt vé", ngayLap))
                .append(buildInfoRow("Ngày hoàn tiền", ngayHoanTien))
                .append(buildInfoRow("Phương thức", invoiceDetails.getPhuongThucThanhToan()))
                .append("</table>");
            
            // Tổng tiền hoàn - ✅ Sửa lỗi format
            String formattedTotal;
            try {
                Object tongTien = invoiceDetails.getTongTien();
                if (tongTien instanceof Double || tongTien instanceof Float) {
                    formattedTotal = String.format("%,.0f", ((Number) tongTien).doubleValue());
                } else if (tongTien instanceof Number) {
                    formattedTotal = String.format("%,d", ((Number) tongTien).longValue());
                } else if (tongTien != null) {
                    formattedTotal = String.format("%,.0f", Double.parseDouble(tongTien.toString()));
                } else {
                    formattedTotal = "0";
                }
            } catch (Exception e) {
                System.err.println("✗ Error formatting total: " + e.getMessage());
                formattedTotal = invoiceDetails.getTongTien() != null ? invoiceDetails.getTongTien().toString() : "0";
            }
            
            html.append("<div style='background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:20px;text-align:center;margin:20px 0'>")
                .append("<p style='margin:0;color:#856404;font-size:14px'>Số tiền hoàn</p>")
                .append("<div style='font-size:32px;font-weight:bold;color:#ff9800;margin:5px 0'>")
                .append(formattedTotal)
                .append(" VNĐ</div>")
                .append("</div>");
            
            // Tickets
            if (invoiceDetails.getDanhSachVe() != null && !invoiceDetails.getDanhSachVe().isEmpty()) {
                html.append("<h2 style='color:#333;margin:30px 0 20px;font-size:20px'>🎫 Chi tiết vé đã hoàn</h2>");
                
                int qrIndex = 0;
                for (VeResponse ve : invoiceDetails.getDanhSachVe()) {
                    html.append(buildRefundTicketCardHTML(ve, qrIndex, formatter)); // ✅ Tách riêng HTML
                    qrIndex++;
                }
                
                System.out.println("Added " + invoiceDetails.getDanhSachVe().size() + " refund ticket cards");
            }
            
            // Info box
            html.append("<div style='background:#f8f9fa;border-left:4px solid #ffc107;border-radius:4px;padding:15px;margin:20px 0'>")
                .append("<h3 style='margin:0 0 10px;color:#333;font-size:16px'>💰 Thông tin hoàn trả</h3>")
                .append("<p style='margin:5px 0;color:#666;font-size:14px;line-height:1.6'>")
                .append("Số tiền sẽ được hoàn vào tài khoản thanh toán của bạn trong vòng 7-10 ngày làm việc.<br>")
                .append("Nếu có thắc mắc, vui lòng liên hệ bộ phận CSKH.</p>")
                .append("</div>")
                
                .append("</div>") // End padding
                
                // Footer
                .append("<div style='text-align:center;padding:20px;color:#999;font-size:12px'>")
                .append("<p style='margin:5px 0'>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>")
                .append("<p style='margin:5px 0'>© 2025 Cinema System. All rights reserved.</p>")
                .append("</div>")
                
                .append("</div></body></html>");
            
            System.out.println("✓ HTML content built, length: " + html.length());
            
            // ✅ Set HTML content trước khi attach files
            helper.setText(html.toString(), true);
            
            // ✅ Attach QR codes SAU KHI đã set text
            if (invoiceDetails.getDanhSachVe() != null && !invoiceDetails.getDanhSachVe().isEmpty()) {
                System.out.println("Attaching QR codes for refund email...");
                int qrIndex = 0;
                for (VeResponse ve : invoiceDetails.getDanhSachVe()) {
                    if (ve.getQrCodeUrl() != null && !ve.getQrCodeUrl().isEmpty()) {
                        System.out.println("  - Attaching QR for ticket: " + ve.getMaVe());
                        attachQRCode(helper, ve.getQrCodeUrl(), "qr" + qrIndex);
                    }
                    qrIndex++;
                }
            }
            
            System.out.println("Sending refund email...");
            mailSender.send(message);
            System.out.println("✓ Refund email sent successfully to: " + to);
            System.out.println("=== REFUND EMAIL SENT SUCCESSFULLY ===\n");
            
        } catch (MessagingException e) {
            System.err.println("✗ MessagingException: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi email hoàn tiền cho: " + to, e);
        } catch (Exception e) {
            System.err.println("✗ Error sending refund email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi email hoàn tiền cho: " + to, e);
        }
    }

    // ✅ Tách hàm build HTML riêng, KHÔNG truyền helper vào
    private String buildRefundTicketCardHTML(VeResponse ve, int qrIndex, DateTimeFormatter formatter) {
        StringBuilder card = new StringBuilder();
        LocalDateTime thoiGianChieu = ve.getThoiGianChieu();
        String formattedTime = thoiGianChieu != null ? thoiGianChieu.format(formatter) : "N/A";

        card.append("<div style='border:2px dashed #ffc107;border-radius:10px;padding:20px;margin:15px 0;background:#fffbf0'>")
            .append("<div style='display:flex;justify-content:space-between;align-items:center;'>")
            
            // Bên trái: thông tin vé
            .append("<div style='flex:1; padding-right:20px;'>")
            .append("<h3 style='color:#ff9800;margin:0 0 15px;font-size:18px'>🎬 ").append(escapeHtml(ve.getTenPhim())).append("</h3>")
            .append("<p style='margin:5px 0;color:#666'><b>Mã vé:</b> ").append(escapeHtml(ve.getMaVe())).append("</p>");
        
        // Thêm tên phòng chiếu nếu có
        if (ve.getTenPhongChieu() != null) {
            card.append("<p style='margin:5px 0;color:#666'><b>Phòng:</b> ").append(escapeHtml(ve.getTenPhongChieu())).append("</p>");
        }
        
        card.append("<p style='margin:5px 0;color:#666'><b>Ghế:</b> <span style='display:inline-block;padding:4px 12px;background:#ffc107;color:#000;border-radius:4px;font-weight:bold'>")
            .append(escapeHtml(ve.getTenGhe())).append("</span></p>")
            .append("<p style='margin:5px 0;color:#666'><b>Suất chiếu:</b> ").append(escapeHtml(formattedTime)).append("</p>")
            .append("<p style='margin:10px 0 0;'><span style='background:#fff3cd;color:#856404;padding:5px 10px;border-radius:4px;font-size:12px;font-weight:bold;'>")
            .append("⚠️ ĐÃ HOÀN TIỀN - VÔ HIỆU HÓA</span></p>")
            .append("</div>");

        // Bên phải: QR Code với overlay vô hiệu hóa
        if (ve.getQrCodeUrl() != null && !ve.getQrCodeUrl().isEmpty()) {
            String contentId = "qr" + qrIndex;
            card.append("<div style='flex-shrink:0; text-align:center; position:relative;'>")
                .append("<div style='position:relative; display:inline-block;'>")
                .append("<img src='cid:").append(contentId).append("' ")
                .append("alt='QR Code' style='width:120px;height:120px;border:3px solid #ffc107;border-radius:8px;background:#fff;padding:8px;opacity:0.5;'/>")
                .append("<div style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(220,53,69,0.9);color:#fff;padding:8px 12px;border-radius:4px;font-size:11px;font-weight:bold;white-space:nowrap;'>")
                .append("VÔ HIỆU HÓA</div>")
                .append("</div>")
                .append("<p style='color:#dc3545;font-size:11px;margin:5px 0;'>QR không còn hiệu lực</p>")
                .append("</div>");
        }

        card.append("</div></div>");

        return card.toString();
    }
}