package com.example.MovieTicker.payment;

import com.example.MovieTicker.request.PaymentRequest;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;

/**
 * ✅ ABSTRACT FACTORY — Product Interface
 *
 * Đây là "hợp đồng" (contract) mà mọi payment gateway phải tuân theo.
 * HoaDonService chỉ biết đến interface này, không biết MoMo hay VNPay cụ thể.
 *
 * Mỗi provider phải implement đủ 3 operations:
 *   - createPayment()  → tạo link / QR thanh toán
 *   - refund()         → hoàn tiền
 *   - getProviderName() → tên hiển thị để log/debug
 */
public interface PaymentGateway {

    /**
     * Tạo yêu cầu thanh toán.
     * @return URL thanh toán (VNPay) hoặc payUrl (MoMo) đã được chuẩn hoá vào PaymentResult
     */
    PaymentResult createPayment(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException;

    /**
     * Hoàn tiền giao dịch.
     * @return kết quả hoàn tiền đã được chuẩn hoá vào PaymentResult
     */
    PaymentResult refund(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException;

    /**
     * Kiểm tra trạng thái hoàn tiền (chủ yếu dành cho MoMo).
     * VNPay không có operation này — default trả về unsupported.
     */
    default PaymentResult checkRefundStatus(PaymentRequest paymentRequest) throws IOException {
        return PaymentResult.failure("Provider " + getProviderName() + " không hỗ trợ checkRefundStatus", "UNSUPPORTED");
    }

    /**
     * Tên provider để log, hiển thị, debug.
     */
    String getProviderName();
}
