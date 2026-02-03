package com.example.MovieTicker.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateMomoResponse {
    private String partnerCode;
    private String orderId;
    private String requestId;
    private long amount;
    private long responseTime;
    private String message;
    private int resultCode;
    private String payUrl;
    private String deeplink;
    private String qrCodeUrl;

    private Long transId;        // ID giao dịch MoMo
    private String transType;    // Loại giao dịch: "capture" (thanh toán) hoặc "refund" (hoàn tiền)
    private String refundTrans;  // ID giao dịch hoàn tiền (nếu có)
}
