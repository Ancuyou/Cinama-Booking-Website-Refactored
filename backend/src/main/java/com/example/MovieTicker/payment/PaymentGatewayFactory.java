package com.example.MovieTicker.payment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * ✅ ABSTRACT FACTORY — The Factory
 *
 * Đây là trung tâm của pattern:
 *   - Nhận tên provider (String: "MOMO" / "VNPAY")
 *   - Trả về đúng PaymentGateway implementation
 *   - HoaDonService chỉ gọi: factory.getGateway("MOMO")
 *     → không cần biết MomoPaymentGateway hay VNPayPaymentGateway tồn tại
 *
 * Khi thêm ZaloPay:
 *   1. Tạo ZaloPayPaymentGateway implements PaymentGateway  ← file mới
 *   2. Thêm @Component → Spring tự inject vào gatewayMap    ← không sửa Factory
 *   3. Xong. HoaDonService không cần sửa.
 *
 * Spring tự động inject tất cả @Component implements PaymentGateway
 * vào Map<String, PaymentGateway> với key = bean name.
 * Ta override tên bean bằng getProviderName() để key = "MOMO" / "VNPAY".
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentGatewayFactory {

    /**
     * Spring inject tất cả PaymentGateway beans vào đây.
     * Key = bean name (momoPaymentGateway, vNPayPaymentGateway...).
     * Ta dùng getProviderName() để map lại cho đúng.
     */
    private final Map<String, PaymentGateway> gatewayBeans;

    /**
     * Trả về PaymentGateway phù hợp với provider.
     *
     * @param provider "MOMO" hoặc "VNPAY" (case-insensitive)
     * @return PaymentGateway implementation
     * @throws IllegalArgumentException nếu provider không hợp lệ
     */
    public PaymentGateway getGateway(String provider) {
        if (provider == null || provider.isBlank()) {
            throw new IllegalArgumentException("[PaymentGatewayFactory] Provider không được null hoặc rỗng");
        }

        String key = provider.toUpperCase().trim();

        // Tìm gateway có providerName khớp
        PaymentGateway gateway = gatewayBeans.values().stream()
                .filter(g -> g.getProviderName().equalsIgnoreCase(key))
                .findFirst()
                .orElse(null);

        if (gateway == null) {
            String supported = gatewayBeans.values().stream()
                    .map(PaymentGateway::getProviderName)
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("(none)");
            throw new IllegalArgumentException(
                    "[PaymentGatewayFactory] Provider \"" + provider + "\" không được hỗ trợ. " +
                    "Các provider hợp lệ: " + supported
            );
        }

        log.info("[FACTORY] getGateway({}) → {}@{}",
                key,
                gateway.getClass().getSimpleName(),
                Integer.toHexString(System.identityHashCode(gateway)));

        return gateway;
    }
}

