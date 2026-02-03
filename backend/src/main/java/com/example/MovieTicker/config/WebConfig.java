package com.example.MovieTicker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
public class WebConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Cho phép TẤT CẢ các nguồn gốc (website) truy cập
        configuration.setAllowedOriginPatterns(List.of("*"));
        
        // Hoặc dùng cách này (nhưng không nên dùng cùng lúc với setAllowCredentials(true))
        // configuration.setAllowedOrigins(List.of("*"));

        // Các phương thức HTTP được phép
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));

        // Cho phép TẤT CẢ headers
        configuration.setAllowedHeaders(List.of("*"));

        // Cho phép gửi cookie và các thông tin xác thực
        configuration.setAllowCredentials(true);

        // Các header có thể expose cho client
        configuration.setExposedHeaders(List.of(
            "Authorization", 
            "Content-Type", 
            "X-Total-Count",
            "X-Request-Id"
        ));

        // Thời gian pre-flight request được cache lại (1 giờ)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        
        // Áp dụng cho TẤT CẢ các endpoint
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}