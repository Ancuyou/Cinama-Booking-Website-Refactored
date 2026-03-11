package com.example.MovieTicker.payment;

import com.example.MovieTicker.config.MomoAPI;
import com.example.MovieTicker.config.PaymentConfig;
import com.example.MovieTicker.request.CreateMomoRefundRequest;
import com.example.MovieTicker.request.CreateMomoRequest;
import com.example.MovieTicker.request.PaymentRequest;
import com.example.MovieTicker.response.CreateMomoResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * ✅ ABSTRACT FACTORY — Concrete Product: MoMo Gateway
 *
 * Toàn bộ logic đặc thù của MoMo (HMAC-SHA256, partnerCode, requestType,
 * build CreateMomoRequest...) được đóng gói hoàn toàn ở đây.
 * HoaDonService không cần biết bất cứ điều gì về MoMo.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MomoPaymentGateway implements PaymentGateway {

    private final MomoAPI momoAPI;

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

    @Override
    public String getProviderName() {
        return "MOMO";
    }

    @Override
    public PaymentResult createPayment(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException {
        try {
            String orderId    = paymentRequest.getOrderId();
            String orderInfo  = "Thanh toan don hang: " + orderId;
            String requestId  = UUID.randomUUID().toString();
            String extraData  = "Khong co khuyen mai";
            long   amount     = paymentRequest.getAmount();

            String rawSignature = "accessKey=" + accessKey
                    + "&amount=" + amount
                    + "&extraData=" + extraData
                    + "&ipnUrl=" + notifyUrl
                    + "&orderId=" + orderId
                    + "&orderInfo=" + orderInfo
                    + "&partnerCode=" + partnerCode
                    + "&redirectUrl=" + returnUrl
                    + "&requestId=" + requestId
                    + "&requestType=" + requestType;
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

            CreateMomoResponse momoResponse = momoAPI.createMomoQR(request);
            log.info("[FACTORY] MomoGateway.createPayment() → orderId={}, resultCode={}", orderId, momoResponse.getResultCode());

            if (momoResponse.getResultCode() == 0) {
                return PaymentResult.success(momoResponse.getPayUrl());
            } else {
                return PaymentResult.failure(momoResponse.getMessage(), String.valueOf(momoResponse.getResultCode()));
            }
        } catch (Exception e) {
            log.error("[FACTORY] MomoGateway.createPayment() error: {}", e.getMessage());
            return PaymentResult.failure("Lỗi kết nối MoMo: " + e.getMessage(), "-1");
        }
    }

    @Override
    public PaymentResult refund(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException {
        try {
            String orderId     = UUID.randomUUID().toString();
            long   amount      = paymentRequest.getAmount();
            String requestId   = paymentRequest.getRequestId();
            String transId     = paymentRequest.getTransId();
            String description = "Hoàn tiền hóa đơn " + orderId;

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

            CreateMomoResponse momoResponse = momoAPI.createMomoRefund(request);
            log.info("[FACTORY] MomoGateway.refund() → orderId={}, resultCode={}", orderId, momoResponse.getResultCode());

            if (momoResponse.getResultCode() == 0 || momoResponse.getResultCode() == 1000) {
                String msg = momoResponse.getResultCode() == 0
                        ? "Hoàn tiền MoMo thành công"
                        : "Yêu cầu hoàn tiền MoMo đang xử lý";
                return PaymentResult.refundSuccess(transId, msg);
            } else {
                return PaymentResult.failure(momoResponse.getMessage(), String.valueOf(momoResponse.getResultCode()));
            }
        } catch (Exception e) {
            log.error("[FACTORY] MomoGateway.refund() error: {}", e.getMessage());
            return PaymentResult.failure("Lỗi hoàn tiền MoMo: " + e.getMessage(), "-1");
        }
    }

    @Override
    public PaymentResult checkRefundStatus(PaymentRequest paymentRequest) throws IOException {
        try {
            String orderId   = paymentRequest.getOrderId();
            String requestId = paymentRequest.getRequestId();

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

            CreateMomoResponse momoResponse = momoAPI.checkRefundStatus(request);
            log.info("[FACTORY] MomoGateway.checkRefundStatus() → orderId={}, resultCode={}", orderId, momoResponse.getResultCode());

            return PaymentResult.builder()
                    .success(momoResponse.getResultCode() == 0)
                    .message(momoResponse.getMessage())
                    .rawResponseCode(String.valueOf(momoResponse.getResultCode()))
                    .transactionId(momoResponse.getTransId() != null ? momoResponse.getTransId().toString() : null)
                    .build();
        } catch (Exception e) {
            log.error("[FACTORY] MomoGateway.checkRefundStatus() error: {}", e.getMessage());
            return PaymentResult.failure("Lỗi kiểm tra hoàn tiền MoMo: " + e.getMessage(), "-1");
        }
    }
}

