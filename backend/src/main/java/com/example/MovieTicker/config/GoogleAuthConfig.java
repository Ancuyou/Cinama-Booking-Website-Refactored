package com.example.MovieTicker.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;

/**
 * ============================================================
 *  SINGLETON PATTERN — GoogleAuthConfig
 * ============================================================
 *
 * VẤN ĐỀ CŨ (trước khi refactor):
 * ---------------------------------
 * Trong AuthenticateService.loginWithGoogle(), cứ mỗi lần user
 * bấm "Đăng nhập bằng Google", đoạn code cũ thực hiện:
 *
 *   GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
 *       .Builder(new NetHttpTransport(), new JacksonFactory())
 *       .setAudience(Collections.singletonList(googleClientId))
 *       .build();
 *
 * Điều đó có nghĩa là MỖI REQUEST tạo ra 3 object nặng:
 *   1. NetHttpTransport  — mở connection pool, allocate thread/socket
 *   2. JacksonFactory    — khởi tạo Jackson JSON engine
 *   3. GoogleIdTokenVerifier — fetch Google public keys qua HTTPS
 *                              để verify chữ ký JWT của Google
 *
 * Chi phí thực tế:
 *   - NetHttpTransport.build() ≈ 50–200ms (tạo socket pool)
 *   - Fetch Google public keys (https://www.googleapis.com/oauth2/v3/certs)
 *     ≈ 100–400ms mạng (chỉ được cache SAU KHI build)
 *   - Nếu 100 user login đồng thời → 100 lần tạo, 100 lần fetch key
 *
 * GIẢI PHÁP — SINGLETON:
 * -----------------------
 * Khai báo GoogleIdTokenVerifier là @Bean trong @Configuration.
 * Spring IoC Container đảm bảo chỉ khởi tạo ĐÚNG MỘT LẦN khi
 * ứng dụng start, sau đó tái sử dụng cho mọi request.
 *
 *   100 user login đồng thời → vẫn chỉ 1 instance duy nhất
 *
 * Log khi ứng dụng start sẽ in:
 *   [SINGLETON DEMO] GoogleIdTokenVerifier Bean được tạo.
 *   Instance ID: GoogleIdTokenVerifier@1a2b3c4d  ← chỉ 1 lần
 *
 * ============================================================
 */
@Slf4j
@Configuration
public class GoogleAuthConfig {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    /**
     * Tạo GoogleIdTokenVerifier Singleton Bean.
     *
     * Bean này được Spring tạo ĐÚNG MỘT LẦN khi ứng dụng khởi động,
     * sau đó inject vào AuthenticateService và tái sử dụng cho mọi
     * request đăng nhập Google về sau.
     *
     * NetHttpTransport và JacksonFactory bên trong cũng chỉ được
     * khởi tạo 1 lần duy nhất, không lặp lại theo từng request.
     */
    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier() {
        // ✅ Chỉ chạy 1 lần duy nhất khi application start
        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║  [SINGLETON DEMO] Khởi tạo GoogleIdTokenVerifier    ║");
        log.info("║  NetHttpTransport + JacksonFactory được tạo 1 lần   ║");
        log.info("╚══════════════════════════════════════════════════════╝");

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
                .Builder(new NetHttpTransport(), new JacksonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        // In Instance ID để chứng minh Singleton: địa chỉ memory không đổi
        log.info("[SINGLETON DEMO] GoogleIdTokenVerifier instance ID: {}",
                Integer.toHexString(System.identityHashCode(verifier)));

        return verifier;
    }
}

