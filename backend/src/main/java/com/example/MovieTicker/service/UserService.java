package com.example.MovieTicker.service;

import com.example.MovieTicker.entity.TaiKhoan;
import com.example.MovieTicker.entity.User;
import com.example.MovieTicker.entity.VaiTro;
import com.example.MovieTicker.exception.AppException;
import com.example.MovieTicker.exception.ErrorCode;
import com.example.MovieTicker.repository.TaiKhoanRepository;
import com.example.MovieTicker.repository.UserRepository;
import com.example.MovieTicker.repository.VaiTroRepository;
import com.example.MovieTicker.request.ProfileUpdateRequest;
import com.example.MovieTicker.request.UserRequest;
import com.example.MovieTicker.request.UserUpdateRequest;
import com.example.MovieTicker.response.UserResponse;
import com.example.MovieTicker.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;

    // Helper Method: Chuyển đổi từ TaiKhoan Entity sang UserResponse DTO
    private UserResponse convertToUserResponse(TaiKhoan taiKhoan) {
        User user = taiKhoan.getUser();
        if (user == null) return null;
        return UserResponse.builder()
                .maUser(user.getMaUser())
                .hoTen(user.getHoTen())
                .email(user.getEmail())
                .sdt(user.getSdt())
                .ngaySinh(user.getNgaySinh())
                .tenDangNhap(taiKhoan.getTenDangNhap())
                .tenVaiTro(taiKhoan.getVaiTro().getTenVaiTro())
                .trangThai(taiKhoan.isTrangThai())
                .build();
    }

    // =================== LOGIC CHO PROFILE ===================
    public User getMyInfo() {
        String currentUsername = SecurityUtil.getCurrentUsername();
        return taiKhoanRepository.findByTenDangNhap(currentUsername)
                .map(TaiKhoan::getUser)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    public User updateMyInfo(ProfileUpdateRequest request) {
        User currentUser = getMyInfo();
        currentUser.setHoTen(request.getHoTen());
        currentUser.setSdt(request.getSdt());
        currentUser.setNgaySinh(request.getNgaySinh());
        currentUser.setEmail(request.getEmail().trim());
        return userRepository.save(currentUser);
    }

    // =================== LOGIC CHO USER MANAGER ===================
    public Page<UserResponse> searchUsers(String keyword, String role, Boolean status, Pageable pageable) {
        String roleFilter = (role == null || role.equalsIgnoreCase("all")) ? null : role.toUpperCase();
        Page<TaiKhoan> taiKhoanPage = taiKhoanRepository.searchUsers(keyword, roleFilter, status, pageable);
        return taiKhoanPage.map(this::convertToUserResponse);
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (taiKhoanRepository.existsByTenDangNhap(request.getTenDangNhap())) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        VaiTro vaiTro = vaiTroRepository.findByTenVaiTro(request.getTenVaiTro())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User newUser = new User();
        newUser.setHoTen(request.getHoTen());
        newUser.setEmail(request.getEmail());
        newUser.setSdt(request.getSdt());
        newUser.setNgaySinh(request.getNgaySinh());
        User savedUser = userRepository.save(newUser);

        TaiKhoan newTaiKhoan = new TaiKhoan();
        newTaiKhoan.setTenDangNhap(request.getTenDangNhap());
        newTaiKhoan.setMatKhau(passwordEncoder.encode(request.getMatKhau()));
        // newTaiKhoan.setTrangThai(true); // Không cần vì đã có @PrePersist trong Entity
        newTaiKhoan.setVaiTro(vaiTro);
        newTaiKhoan.setUser(savedUser);
        TaiKhoan savedTaiKhoan = taiKhoanRepository.save(newTaiKhoan);

        return convertToUserResponse(savedTaiKhoan);
    }

    @Transactional
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        TaiKhoan taiKhoan = taiKhoanRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        user.setHoTen(request.getHoTen());
        user.setEmail(request.getEmail());
        user.setSdt(request.getSdt());
        user.setNgaySinh(request.getNgaySinh());
        userRepository.save(user);

        VaiTro vaiTro = vaiTroRepository.findByTenVaiTro(request.getTenVaiTro())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        taiKhoan.setVaiTro(vaiTro);

        TaiKhoan updatedTaiKhoan = taiKhoanRepository.save(taiKhoan);

        return convertToUserResponse(updatedTaiKhoan);
    }

    @Transactional
    public void updateUserStatus(String username, boolean status) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByTenDangNhap(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        taiKhoan.setTrangThai(status);
        taiKhoanRepository.save(taiKhoan);
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        taiKhoanRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }
}