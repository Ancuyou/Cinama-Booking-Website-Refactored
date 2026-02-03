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
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
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

    @Value("${jwt.Key}") // Lấy key từ application.yaml
    @NonFinal
    String singerKey;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

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
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

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
        pendingUser.setExpiryDate(LocalDateTime.now().plusMinutes(5)); // Yêu cầu hết hạn sau 5 phút

        pendingUser.setOtp(otp); // Lưu OTP
        pendingUser.setOtpGeneratedTime(LocalDateTime.now()); // Lưu thời gian tạo OTP

        pendingRepo.save(pendingUser);

        // 3. Gửi email chứa OTP
        emailService.sendOtpEmail(request.getEmail(), otp);
    }

    private void sendNewOtpForUser(String email) {
        String otp = new Random().ints(6, 0, 10).mapToObj(String::valueOf).collect(Collectors.joining());

        // Dùng tạm một đối tượng TaiKhoan để tìm kiếm token, vì PasswordResetToken liên kết với TaiKhoan
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
        // 1. Lấy thông tin đăng ký đang chờ từ bảng tạm qua email
        PendingRegistration registrationData = pendingRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST)); // "Yêu cầu đăng ký không hợp lệ hoặc đã hết hạn."));

        // 2. Kiểm tra OTP
        if (registrationData.getOtp() == null || !registrationData.getOtp().equals(request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_TOKEN); // "Mã OTP không chính xác.");
        }

        // 3. Kiểm tra OTP có hết hạn không (ví dụ 5 phút)
        if (registrationData.getOtpGeneratedTime().plusMinutes(5).isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED); // "Mã OTP đã hết hạn.");
        }

        // 4. Tạo tài khoản trong DB từ dữ liệu bảng tạm
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

        // 5. Xóa dữ liệu trong bảng tạm sau khi hoàn tất
        pendingRepo.delete(registrationData);
    }

    @Transactional // Đảm bảo các thay đổi được lưu vào CSDL
    public void resendOtp(ResendOtpRequest request) {
        // 1. Tìm thông tin đăng ký đang chờ qua email
        PendingRegistration registrationData = pendingRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));

        // 2. Tạo một mã OTP mới
        String newOtp = new Random().ints(6, 0, 10).mapToObj(String::valueOf).collect(Collectors.joining());

        // 3. Cập nhật mã OTP và thời gian tạo mới cho bản ghi đang chờ
        registrationData.setOtp(newOtp);
        registrationData.setOtpGeneratedTime(LocalDateTime.now());
        pendingRepo.save(registrationData); // Lưu lại thay đổi

        // 4. Gửi email chứa mã OTP mới
        emailService.sendOtpEmail(request.getEmail(), newOtp);
    }

    // XU LY LOGIC Refresh Token
    public AuthenticateResponse authenticated(AuthenticateRequest request){
        // Tìm kiếm theo TenDangNhap (là username và cũng là ID)
        var taiKhoan = taiKhoanRepository.findById(request.getUsername()).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_FOUND)
        );
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean isAuthenticated = passwordEncoder.matches(request.getPassword(), taiKhoan.getMatKhau());

        if (!isAuthenticated) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }
        if (!taiKhoan.isTrangThai()) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }
        var accessToken = generateToken(taiKhoan, 3600*1000); // 1 hour
        var refreshToken = generateToken(taiKhoan, 3600*24*7*1000); // 7 days
        return
                AuthenticateResponse.builder()
                        .authenticated(true)
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .build();
    }
    public AuthenticateResponse refreshToken(IntrospectRequest request) throws ParseException, JOSEException {
        // 1. Xác thực refresh token cũ
        var signedJWT = verifyToken(request.getToken());
        var username = signedJWT.getJWTClaimsSet().getSubject();
        var taiKhoan = taiKhoanRepository.findById(username)
                .orElseThrow(() -> new AppException(ErrorCode.UNTHENTICATED));

        // 2. Tạo access token và refresh token MỚI
        var accessToken = generateToken(taiKhoan, 3600 * 1000); // 1 giờ
        var newRefreshToken = generateToken(taiKhoan, 3600 * 24 * 7 * 1000); // 7 ngày

        // 3. Vô hiệu hóa refresh token CŨ bằng hàm nội bộ
        invalidateToken(request.getToken());

        // 4. Trả về cặp token mới
        return AuthenticateResponse.builder()
                .authenticated(true)
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .build();
    }
    // -- XU LY LOGIC QUEN MAT KHAU
    public void forgotPassword(ForgotPasswordRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        var taiKhoan = taiKhoanRepository.findByUser(user)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        // Xóa token cũ nếu có
        passwordResetTokenRepository.findByTaiKhoan(taiKhoan).ifPresent(passwordResetTokenRepository::delete);
        // Tạo một token dài, ngẫu nhiên và an toàn hơn thay vì OTP 6 số
        String tokenString = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(tokenString, taiKhoan);
        passwordResetTokenRepository.save(resetToken);
        // EmailService sẽ nhận token này và xây dựng link hoàn chỉnh
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
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        taiKhoan.setMatKhau(passwordEncoder.encode(request.getNewPassword()));
        taiKhoanRepository.save(taiKhoan);
        passwordResetTokenRepository.delete(resetToken);
    }
    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = false; // Mặc định là không hợp lệ
        try {
            // Sử dụng verifier đã được tạo từ signerKey
            JWSVerifier verifier = new MACVerifier(singerKey.getBytes());
            SignedJWT signedJWT = SignedJWT.parse(token);

            // 1. Kiểm tra chữ ký
            boolean signatureVerified = signedJWT.verify(verifier);

            // 2. Kiểm tra hạn sử dụng
            boolean expired = signedJWT.getJWTClaimsSet().getExpirationTime().before(new Date());

            // 3. Kiểm tra trong database xem token đã bị vô hiệu hóa chưa
            String jit = signedJWT.getJWTClaimsSet().getJWTID();
            boolean invalidated = invalidatedTokenRepository.existsById(jit);

            // Token chỉ hợp lệ khi tất cả các điều kiện đều đúng
            if (signatureVerified && !expired && !invalidated) {
                isValid = true;
            }
        } catch (Exception e) {
            // Nếu có bất kỳ lỗi nào trong quá trình parse hoặc verify, token không hợp lệ
            log.error("Introspect token error: {}", e.getMessage());
            isValid = false;
        }
        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    // Sửa tham số từ User sang TaiKhoan
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
        // Vô hiệu hóa cả hai token
        invalidateToken(logoutRequest.getAccessToken());
        invalidateToken(logoutRequest.getRefreshToken());
    }

    private SignedJWT verifyToken(String token) throws ParseException, JOSEException, AppException {
        JWSVerifier verifier = new MACVerifier(singerKey.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean verified = signedJWT.verify(verifier);
        // Chỉ kiểm tra chữ ký và token còn hạn hay không
        if (!(verified && expirationTime.after(new Date()))) {
            throw new AppException(ErrorCode.UNTHENTICATED);
        }
        return signedJWT;
    }

    private void invalidateToken(String token) {
        if (token == null || token.isEmpty()) {
            return; // Bỏ qua nếu token rỗng
        }
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
            // Có thể bỏ qua lỗi parse vì token có thể không hợp lệ,
            // mục đích chính là cố gắng vô hiệu hóa nó nếu có thể.
        }
    }

    // **Đây là phần quan trọng nhất: Sửa lại để phù hợp với mô hình 1 vai trò**
    public String buildScopeString(TaiKhoan taiKhoan) {
        StringJoiner scopeString = new StringJoiner(" ");
        VaiTro role = taiKhoan.getVaiTro();
        if (role != null) {
            // Thêm vai trò, ví dụ: ROLE_ADMIN
            scopeString.add("ROLE_" + role.getTenVaiTro().toUpperCase());

            // Thêm các quyền (permissions) của vai trò đó nếu có
            if (!CollectionUtils.isEmpty(role.getPermissions())){
                role.getPermissions().forEach(permission -> scopeString.add(permission.getName()));
            }
        }
        return scopeString.toString();
    }
    @Transactional
    public AuthenticateResponse loginWithGoogle(String tokenId) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new JacksonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            System.out.println("Google Client ID: " + googleClientId);
            System.out.println("Token ID: " + tokenId);
            System.out.println("Verifying token..." + verifier.toString());

            GoogleIdToken idToken = verifier.verify(tokenId);
            if (idToken == null) {
                throw new AppException(ErrorCode.UNTHENTICATED);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String hoTen = (String) payload.get("name");

            // Tìm hoặc tạo người dùng mới
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setHoTen(hoTen);
                newUser.setSdt(""); // Có thể yêu cầu người dùng cập nhật sau
                newUser.setNgaySinh(LocalDate.now()); // Giá trị mặc định
                return userRepository.save(newUser);
            });
            PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
            // Tìm hoặc tạo tài khoản
            TaiKhoan taiKhoan = taiKhoanRepository.findByUser(user).orElseGet(() -> {
                TaiKhoan newAccount = new TaiKhoan();
                newAccount.setTenDangNhap(email);  // Tạo username duy nhất
                String rawPassword = UUID.randomUUID().toString().substring(0, 12);
                newAccount.setMatKhau(passwordEncoder.encode(rawPassword)); // Mật khẩu ngẫu nhiên 12 ký tự
                newAccount.setUser(user);
                newAccount.setVaiTro(vaiTroRepository.findByTenVaiTro("USER").orElseThrow());
                emailService.sendNewAccountCredentialsEmail(email, email, rawPassword);
                return taiKhoanRepository.save(newAccount);
            });

            if (!taiKhoan.isTrangThai()) {
                throw new AppException(ErrorCode.ACCOUNT_LOCKED);
            }

            // Tạo và trả về token của hệ thống
            var accessToken = generateToken(taiKhoan, 3600 * 1000); // 1 giờ
            var refreshToken = generateToken(taiKhoan, 3600 * 24 * 7 * 1000); // 7 ngày

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
            // No change; return tokens for current username to keep behavior consistent
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

        // Clone account to new primary key
        TaiKhoan renamed = new TaiKhoan();
        renamed.setTenDangNhap(newUsername);
        renamed.setMatKhau(current.getMatKhau());
        renamed.setTrangThai(current.isTrangThai());
        renamed.setUser(current.getUser());
        renamed.setVaiTro(current.getVaiTro());
        taiKhoanRepository.save(renamed);

        // Reattach password reset token if exists
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTaiKhoan(current);
        tokenOpt.ifPresent(t -> {
            t.setTaiKhoan(renamed);
            passwordResetTokenRepository.save(t);
        });

        // Remove old account
        taiKhoanRepository.delete(current);

        // Issue fresh tokens for the new username
        var accessToken = generateToken(renamed, 3600 * 1000);
        var refreshToken = generateToken(renamed, 3600 * 24 * 7 * 1000);

        return AuthenticateResponse.builder()
                .authenticated(true)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}