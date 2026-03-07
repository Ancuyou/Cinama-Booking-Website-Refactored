package com.example.MovieTicker.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.text.ParseException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import com.example.MovieTicker.entity.*;
import com.example.MovieTicker.exception.AppException;
import com.example.MovieTicker.exception.ErrorCode;
import com.example.MovieTicker.repository.*;
import com.example.MovieTicker.request.*;
import com.example.MovieTicker.response.AuthenticateResponse;
import com.example.MovieTicker.response.IntrospectResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
// ✅ SINGLETON REFACTOR: Bỏ import NetHttpTransport + JacksonFactory
// ❌ CŨ: import com.google.api.client.http.javanet.NetHttpTransport;
// ❌ CŨ: import com.google.api.client.json.jackson2.JacksonFactory;
// Hai class này giờ chỉ được dùng trong GoogleAuthConfig.java (tạo Bean 1 lần duy nhất)
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
// ✅ SINGLETON REFACTOR: Bỏ import BCryptPasswordEncoder
// ❌ CŨ: import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// BCryptPasswordEncoder giờ được inject qua PasswordEncoder @Bean từ WebSecurityConfig
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticateService {
    private final TaiKhoanRepository taiKhoanRepository;
    private final InvalidatedRepository invalidatedTokenRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PendingRegistrationRepository pendingRepo;

    // =========================================================
    //  SINGLETON PATTERN — PasswordEncoder
    // =========================================================
    // ❌ CŨ: Mỗi method tự gọi: new BCryptPasswordEncoder(10)
    //   - register()        → new BCryptPasswordEncoder(10)  [lần 1]
    //   - authenticated()   → new BCryptPasswordEncoder(10)  [lần 2]
    //   - resetPassword()   → new BCryptPasswordEncoder(10)  [lần 3]
    //   - loginWithGoogle() → new BCryptPasswordEncoder(10)  [lần 4]
    //   Mỗi lần: khởi tạo Blowfish cipher + S-box, tốn ~0.5–1ms CPU, tạo object rác cho GC
    //
    // ✅ MỚI: Spring inject 1 instance duy nhất từ WebSecurityConfig.passwordEncoder() @Bean
    //   Tạo đúng 1 lần khi app start → tái sử dụng mãi mãi, 0 GC pressure
    private final PasswordEncoder passwordEncoder;

    // =========================================================
    //  SINGLETON PATTERN — GoogleIdTokenVerifier
    // =========================================================
    // ❌ CŨ: loginWithGoogle() tạo mới mỗi request:
    //   new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new JacksonFactory())
    //       .setAudience(...).build();
    //   Chi phí mỗi lần: tạo socket pool (~100ms) + fetch Google public keys qua HTTPS (~300ms)
    //   10 concurrent login Google → 10 HTTPS calls đến Google servers
    //
    // ✅ MỚI: Inject Singleton Bean từ GoogleAuthConfig.java
    //   Tạo 1 lần khi app start, public keys được cache, tái sử dụng mãi mãi
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    @Value("${jwt.Key}")
    @NonFinal
    String singerKey;

    // ❌ CŨ: @Value googleClientId dùng để new GoogleIdTokenVerifier trong loginWithGoogle()
    // ✅ MỚI: Đã chuyển sang GoogleAuthConfig.java, không cần ở đây nữa
    // @Value("${spring.security.oauth2.client.registration.google.client-id}")
    // private String googleClientId;

    @Transactional
    public void register(RegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }
        if (taiKhoanRepository.existsById(request.getTenDangNhap())) {
            throw new AppException(ErrorCode.USER_EXISTS);
        }
        if (request.getMatKhau().length() < 6) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }

        pendingRepo.findByEmail(request.getEmail()).ifPresent(pendingRepo::delete);

        // ❌ CŨ: PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        // ✅ MỚI: Dùng this.passwordEncoder — Singleton đã inject, instance ID không đổi
        log.info("[SINGLETON] register() | passwordEncoder@{}",
                Integer.toHexString(System.identityHashCode(passwordEncoder)));

        // 1. Tạo OTP
        String otp = new Random().ints(6, 0, 10).mapToObj(String::valueOf).collect(Collectors.joining());

        // 2. Lưu thông tin đăng ký và OTP vào bảng tạm
        PendingRegistration pendingUser = new PendingRegistration();
        pendingUser.setTenDangNhap(request.getTenDangNhap());
        pendingUser.setMatKhau(passwordEncoder.encode(request.getMatKhau()));
        pendingUser.setHoTen(request.getHoTen());
        pendingUser.setEmail(request.getEmail());
        pendingUser.setSdt(request.getSdt());
        pendingUser.setNgaySinh(request.getNgaySinh());
        pendingUser.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        pendingUser.setOtp(otp);
        pendingUser.setOtpGeneratedTime(LocalDateTime.now());
        pendingRepo.save(pendingUser);

        // 3. Gửi email chứa OTP
        emailService.sendOtpEmail(request.getEmail(), otp);
    }

    private void sendNewOtpForUser(String email) {
        String otp = new Random().ints(6, 0, 10).mapToObj(String::valueOf).collect(Collectors.joining());
        TaiKhoan tempKey = new TaiKhoan();
        tempKey.setTenDangNhap(email);
        passwordResetTokenRepository.findByTaiKhoan(tempKey)
                .ifPresent(passwordResetTokenRepository::delete);
        PasswordResetToken otpToken = new PasswordResetToken(otp, tempKey);
        otpToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        passwordResetTokenRepository.save(otpToken);
        emailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        PendingRegistration registrationData = pendingRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        if (registrationData.getOtp() == null || !registrationData.getOtp().equals(request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
        if (registrationData.getOtpGeneratedTime().plusMinutes(5).isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }
        User user = new User();
        user.setHoTen(registrationData.getHoTen());
        user.setEmail(registrationData.getEmail());
        user.setSdt(registrationData.getSdt());
        user.setNgaySinh(registrationData.getNgaySinh());
        User savedUser = userRepository.save(user);
        VaiTro userRole = vaiTroRepository.findByTenVaiTro("USER")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        TaiKhoan taiKhoan = new TaiKhoan();
        taiKhoan.setTenDangNhap(registrationData.getTenDangNhap());
        taiKhoan.setMatKhau(registrationData.getMatKhau());
        taiKhoan.setUser(savedUser);
        taiKhoan.setVaiTro(userRole);
        taiKhoanRepository.save(taiKhoan);
        pendingRepo.delete(registrationData);
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        PendingRegistration registrationData = pendingRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        String newOtp = new Random().ints(6, 0, 10).mapToObj(String::valueOf).collect(Collectors.joining());
        registrationData.setOtp(newOtp);
        registrationData.setOtpGeneratedTime(LocalDateTime.now());
        pendingRepo.save(registrationData);
        emailService.sendOtpEmail(request.getEmail(), newOtp);
    }

    public AuthenticateResponse authenticated(AuthenticateRequest request) {
        var taiKhoan = taiKhoanRepository.findById(request.getUsername()).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_FOUND)
        );
        // ❌ CŨ: PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        //   Method login được gọi nhiều nhất trong hệ thống — tạo mới mỗi request là lãng phí nhất
        // ✅ MỚI: Dùng this.passwordEncoder — Singleton, cùng instance với register() ở trên
        log.info("[SINGLETON] authenticated() | passwordEncoder@{} (phải giống register)",
                Integer.toHexString(System.identityHashCode(passwordEncoder)));
        boolean isAuthenticated = passwordEncoder.matches(request.getPassword(), taiKhoan.getMatKhau());
        if (!isAuthenticated) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }
        if (!taiKhoan.isTrangThai()) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        var accessToken = generateToken(taiKhoan, 3600 * 1000);
        var refreshToken = generateToken(taiKhoan, 3600 * 24 * 7 * 1000);
        return AuthenticateResponse.builder()
                .authenticated(true)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthenticateResponse refreshToken(IntrospectRequest request) throws ParseException, JOSEException {
        var signedJWT = verifyToken(request.getToken());
        var username = signedJWT.getJWTClaimsSet().getSubject();
        var taiKhoan = taiKhoanRepository.findById(username)
                .orElseThrow(() -> new AppException(ErrorCode.UNTHENTICATED));
        var accessToken = generateToken(taiKhoan, 3600 * 1000);
        var newRefreshToken = generateToken(taiKhoan, 3600 * 24 * 7 * 1000);
        invalidateToken(request.getToken());
        return AuthenticateResponse.builder()
                .authenticated(true)
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        var taiKhoan = taiKhoanRepository.findByUser(user)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        passwordResetTokenRepository.findByTaiKhoan(taiKhoan).ifPresent(passwordResetTokenRepository::delete);
        String tokenString = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(tokenString, taiKhoan);
        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getOtp())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }
        TaiKhoan taiKhoan = resetToken.getTaiKhoan();
        // ❌ CŨ: PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        // ✅ MỚI: Dùng this.passwordEncoder — cùng Singleton instance với các method trên
        log.info("[SINGLETON] resetPassword() | passwordEncoder@{} (phải giống register/login)",
                Integer.toHexString(System.identityHashCode(passwordEncoder)));
        taiKhoan.setMatKhau(passwordEncoder.encode(request.getNewPassword()));
        taiKhoanRepository.save(taiKhoan);
        passwordResetTokenRepository.delete(resetToken);
    }

    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = false;
        try {
            JWSVerifier verifier = new MACVerifier(singerKey.getBytes());
            SignedJWT signedJWT = SignedJWT.parse(token);
            boolean signatureVerified = signedJWT.verify(verifier);
            boolean expired = signedJWT.getJWTClaimsSet().getExpirationTime().before(new Date());
            String jit = signedJWT.getJWTClaimsSet().getJWTID();
            boolean invalidated = invalidatedTokenRepository.existsById(jit);
            if (signatureVerified && !expired && !invalidated) {
                isValid = true;
            }
        } catch (Exception e) {
            log.error("Introspect token error: {}", e.getMessage());
        }
        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    private String generateToken(TaiKhoan taiKhoan, long expirationTime) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(taiKhoan.getTenDangNhap())
                .issuer("com.example.MovieTicker")
                .expirationTime(new Date(System.currentTimeMillis() + expirationTime))
                .issueTime(new Date())
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScopeString(taiKhoan))
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(jwsHeader, payload);
        try {
            jwsObject.sign(new MACSigner(singerKey.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Error signing JWT: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void logout(LogoutRequest logoutRequest) {
        invalidateToken(logoutRequest.getAccessToken());
        invalidateToken(logoutRequest.getRefreshToken());
    }

    private SignedJWT verifyToken(String token) throws ParseException, JOSEException, AppException {
        JWSVerifier verifier = new MACVerifier(singerKey.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean verified = signedJWT.verify(verifier);
        if (!(verified && expirationTime.after(new Date()))) {
            throw new AppException(ErrorCode.UNTHENTICATED);
        }
        return signedJWT;
    }

    private void invalidateToken(String token) {
        if (token == null || token.isEmpty()) return;
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            String jit = signedJWT.getJWTClaimsSet().getJWTID();
            Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jit)
                    .expiryDate(expiryTime)
                    .build();
            invalidatedTokenRepository.save(invalidatedToken);
        } catch (ParseException e) {
            log.error("Error while invalidating token: {}", e.getMessage());
        }
    }

    public String buildScopeString(TaiKhoan taiKhoan) {
        StringJoiner scopeString = new StringJoiner(" ");
        VaiTro role = taiKhoan.getVaiTro();
        if (role != null) {
            scopeString.add("ROLE_" + role.getTenVaiTro().toUpperCase());
            if (!CollectionUtils.isEmpty(role.getPermissions())) {
                role.getPermissions().forEach(permission -> scopeString.add(permission.getName()));
            }
        }
        return scopeString.toString();
    }

    @Transactional
    public AuthenticateResponse loginWithGoogle(String tokenId) {
        try {
            // ❌ CŨ: Tạo mới toàn bộ verifier mỗi lần user login Google:
            //   GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
            //       .Builder(new NetHttpTransport(), new JacksonFactory())
            //       .setAudience(Collections.singletonList(googleClientId))
            //       .build();
            //   → Mỗi lần: tạo socket pool + fetch Google public keys (~400ms overhead)
            //   → 10 user login cùng lúc = 10 HTTPS calls đến googleapis.com
            //
            // ✅ MỚI: Dùng this.googleIdTokenVerifier — Singleton Bean từ GoogleAuthConfig
            //   Tạo 1 lần khi app start, public keys được cache, verify chỉ tốn ~5–20ms
            log.info("[SINGLETON] loginWithGoogle() | googleIdTokenVerifier@{}",
                    Integer.toHexString(System.identityHashCode(googleIdTokenVerifier)));
            log.info("[SINGLETON] loginWithGoogle() | passwordEncoder@{} (phải giống register/login)",
                    Integer.toHexString(System.identityHashCode(passwordEncoder)));

            GoogleIdToken idToken = googleIdTokenVerifier.verify(tokenId);
            if (idToken == null) {
                throw new AppException(ErrorCode.UNTHENTICATED);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String hoTen = (String) payload.get("name");

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setHoTen(hoTen);
                newUser.setSdt("");
                newUser.setNgaySinh(LocalDate.now());
                return userRepository.save(newUser);
            });

            // ❌ CŨ: PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10); [lần 4!]
            // ✅ MỚI: Dùng this.passwordEncoder — Singleton đã inject từ đầu
            TaiKhoan taiKhoan = taiKhoanRepository.findByUser(user).orElseGet(() -> {
                TaiKhoan newAccount = new TaiKhoan();
                newAccount.setTenDangNhap(email);
                String rawPassword = UUID.randomUUID().toString().substring(0, 12);
                newAccount.setMatKhau(passwordEncoder.encode(rawPassword));
                newAccount.setUser(user);
                newAccount.setVaiTro(vaiTroRepository.findByTenVaiTro("USER").orElseThrow());
                emailService.sendNewAccountCredentialsEmail(email, email, rawPassword);
                return taiKhoanRepository.save(newAccount);
            });

            if (!taiKhoan.isTrangThai()) {
                throw new AppException(ErrorCode.ACCOUNT_LOCKED);
            }

            var accessToken = generateToken(taiKhoan, 3600 * 1000);
            var refreshToken = generateToken(taiKhoan, 3600 * 24 * 7 * 1000);
            return AuthenticateResponse.builder()
                    .authenticated(true)
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();

        } catch (GeneralSecurityException | IOException e) {
            throw new AppException(ErrorCode.UNTHENTICATED);
        }
    }

    @Transactional
    public AuthenticateResponse changeUsername(ChangeUsernameRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();
        TaiKhoan current = taiKhoanRepository.findById(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.UNTHENTICATED));
        String newUsername = request.getNewUsername().trim();
        if (newUsername.equals(currentUsername)) {
            var accessToken = generateToken(current, 3600 * 1000);
            var refreshToken = generateToken(current, 3600 * 24 * 7 * 1000);
            return AuthenticateResponse.builder()
                    .authenticated(true)
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build();
        }
        if (taiKhoanRepository.existsById(newUsername)) {
            throw new AppException(ErrorCode.USER_EXISTS);
        }
        TaiKhoan renamed = new TaiKhoan();
        renamed.setTenDangNhap(newUsername);
        renamed.setMatKhau(current.getMatKhau());
        renamed.setTrangThai(current.isTrangThai());
        renamed.setUser(current.getUser());
        renamed.setVaiTro(current.getVaiTro());
        taiKhoanRepository.save(renamed);
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTaiKhoan(current);
        tokenOpt.ifPresent(t -> {
            t.setTaiKhoan(renamed);
            passwordResetTokenRepository.save(t);
        });
        taiKhoanRepository.delete(current);
        var accessToken = generateToken(renamed, 3600 * 1000);
        var refreshToken = generateToken(renamed, 3600 * 24 * 7 * 1000);
        return AuthenticateResponse.builder()
                .authenticated(true)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}

