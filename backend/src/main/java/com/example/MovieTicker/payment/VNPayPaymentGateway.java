package com.example.MovieTicker.payment;

import com.example.MovieTicker.config.PaymentConfig;
import com.example.MovieTicker.request.PaymentRequest;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * ✅ ABSTRACT FACTORY — Concrete Product: VNPay Gateway
 *
 * Toàn bộ logic đặc thù của VNPay (HMAC-SHA512, vnp_Params Map,
 * URL encoding, HTTP POST thủ công...) được đóng gói hoàn toàn ở đây.
 * HoaDonService không cần biết bất cứ điều gì về VNPay.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VNPayPaymentGateway implements PaymentGateway {

    @Value("${backend.base-url}")
    private String backendBaseUrl;

    @Override
    public String getProviderName() {
        return "VNPAY";
    }

    @Override
    public PaymentResult createPayment(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException {
        try {
            String vnp_TxnRef = paymentRequest.getOrderId();
            long   amount     = paymentRequest.getAmount() * 100;
            String vnp_IpAddr = PaymentConfig.getIpAddress(httpRequest);

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version",   PaymentConfig.vnp_Version);
            vnp_Params.put("vnp_Command",   PaymentConfig.vnp_Command);
            vnp_Params.put("vnp_TmnCode",   PaymentConfig.vnp_TmnCode);
            vnp_Params.put("vnp_Amount",    String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode",  "VND");
            vnp_Params.put("vnp_Locale",    "vn");
            vnp_Params.put("vnp_TxnRef",    vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang:" + vnp_TxnRef);
            vnp_Params.put("vnp_OrderType", "other");
            vnp_Params.put("vnp_ReturnUrl", backendBaseUrl + PaymentConfig.vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr",    vnp_IpAddr);

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));
            cld.add(Calendar.MINUTE, 15);
            vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query    = new StringBuilder();
            Iterator<String> itr   = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName  = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName).append('=')
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                         .append('=')
                         .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    if (itr.hasNext()) { query.append('&'); hashData.append('&'); }
                }
            }
            String secureHash = PaymentConfig.hmacSHA512(PaymentConfig.secretKey, hashData.toString());
            String payUrl = PaymentConfig.vnp_PayUrl + "?" + query + "&vnp_SecureHash=" + secureHash;

            log.info("[FACTORY] VNPayGateway.createPayment() → orderId={}", vnp_TxnRef);
            return PaymentResult.success(payUrl);
        } catch (Exception e) {
            log.error("[FACTORY] VNPayGateway.createPayment() error: {}", e.getMessage());
            return PaymentResult.failure("Lỗi tạo thanh toán VNPay: " + e.getMessage(), "-1");
        }
    }

    @Override
    public PaymentResult refund(PaymentRequest paymentRequest, HttpServletRequest httpRequest) throws IOException {
        try {
            String vnp_RequestId      = PaymentConfig.getRandomNumber(8);
            String vnp_TxnRef         = paymentRequest.getOrderId();
            String vnp_TransactionType = paymentRequest.getTransType();
            long   amount             = paymentRequest.getAmount() * 100;
            String vnp_TransactionNo  = paymentRequest.getTransId();
            String vnp_TransactionDate = paymentRequest.getTransDate();
            String vnp_IpAddr         = PaymentConfig.getIpAddress(httpRequest);

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());

            JsonObject vnp_Params = new JsonObject();
            vnp_Params.addProperty("vnp_RequestId",       vnp_RequestId);
            vnp_Params.addProperty("vnp_Version",         PaymentConfig.vnp_Version);
            vnp_Params.addProperty("vnp_Command",         "refund");
            vnp_Params.addProperty("vnp_TmnCode",         PaymentConfig.vnp_TmnCode);
            vnp_Params.addProperty("vnp_TransactionType", vnp_TransactionType);
            vnp_Params.addProperty("vnp_TxnRef",          vnp_TxnRef);
            vnp_Params.addProperty("vnp_Amount",          String.valueOf(amount));
            vnp_Params.addProperty("vnp_OrderInfo",       "Hoan tien GD OrderId:" + vnp_TxnRef);
            if (vnp_TransactionNo != null && !vnp_TransactionNo.isEmpty()) {
                vnp_Params.addProperty("vnp_TransactionNo", vnp_TransactionNo);
            }
            vnp_Params.addProperty("vnp_TransactionDate", vnp_TransactionDate);
            vnp_Params.addProperty("vnp_CreateBy",        "System");
            vnp_Params.addProperty("vnp_CreateDate",      vnp_CreateDate);
            vnp_Params.addProperty("vnp_IpAddr",          vnp_IpAddr);

            String hash_Data = String.join("|",
                    vnp_RequestId, PaymentConfig.vnp_Version, "refund", PaymentConfig.vnp_TmnCode,
                    vnp_TransactionType, vnp_TxnRef, String.valueOf(amount), vnp_TransactionNo,
                    vnp_TransactionDate, "System", vnp_CreateDate, vnp_IpAddr,
                    "Hoan tien GD OrderId:" + vnp_TxnRef);
            vnp_Params.addProperty("vnp_SecureHash", PaymentConfig.hmacSHA512(PaymentConfig.secretKey, hash_Data));

            // HTTP POST tới VNPay API
            URL url = new URL(PaymentConfig.vnp_ApiUrl);
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/json");
            con.setDoOutput(true);
            try (DataOutputStream wr = new DataOutputStream(con.getOutputStream())) {
                wr.writeBytes(vnp_Params.toString());
            }
            StringBuilder responseStr = new StringBuilder();
            try (BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()))) {
                String line;
                while ((line = in.readLine()) != null) responseStr.append(line);
            }

            JsonObject resp = JsonParser.parseString(responseStr.toString()).getAsJsonObject();
            String responseCode = resp.get("vnp_ResponseCode").getAsString();
            String message      = resp.get("vnp_Message").getAsString();

            log.info("[FACTORY] VNPayGateway.refund() → orderId={}, responseCode={}", vnp_TxnRef, responseCode);
            if ("00".equals(responseCode)) {
                return PaymentResult.refundSuccess("VNPAY_REFUND_" + System.currentTimeMillis(), "Hoàn tiền VNPay thành công");
            } else {
                return PaymentResult.failure(message, responseCode);
            }
        } catch (Exception e) {
            log.error("[FACTORY] VNPayGateway.refund() error: {}", e.getMessage());
            return PaymentResult.failure("Lỗi hoàn tiền VNPay: " + e.getMessage(), "-1");
        }
    }
}

