package com.example.MovieTicker.payment;

import lombok.Builder;
import lombok.Data;

/**
 * ✅ ABSTRACT FACTORY — Unified Product Result
 *
 * Chuẩn hoá kết quả trả về của mọi provider.
 * HoaDonService nhận PaymentResult thay vì phải xử lý
 * String (VNPay) vs CreateMomoResponse (MoMo) khác nhau.
 */
@Data
@Builder
public class PaymentResult {

    /** true = thành công, false = thất bại */
    private boolean success;

    /** URL redirect để thanh toán (VNPay) hoặc payUrl (MoMo) */
    private String payUrl;

    /** Message từ gateway */
    private String message;

    /** Response code gốc từ gateway (để log / debug) */
    private String rawResponseCode;

    /** Transaction ID từ gateway */
    private String transactionId;

    // ─── Static factory helpers ───────────────────────────────────────────────

    public static PaymentResult success(String payUrl) {
        return PaymentResult.builder()
                .success(true)
                .payUrl(payUrl)
                .message("Tạo thanh toán thành công")
                .build();
    }

    public static PaymentResult failure(String message, String rawCode) {
        return PaymentResult.builder()
                .success(false)
                .message(message)
                .rawResponseCode(rawCode)
                .build();
    }

    public static PaymentResult refundSuccess(String transactionId, String message) {
        return PaymentResult.builder()
                .success(true)
                .transactionId(transactionId)
                .message(message)
                .build();
    }
}

