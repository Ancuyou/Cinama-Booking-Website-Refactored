package com.example.MovieTicker.controller;

import com.example.MovieTicker.entity.Phim;
import com.example.MovieTicker.entity.TaiKhoan;
import com.example.MovieTicker.entity.User;
import com.example.MovieTicker.request.PhimRequest;
import com.example.MovieTicker.request.UserRequest;
import com.example.MovieTicker.request.UserUpdateRequest;
import com.example.MovieTicker.response.ApiResponse;
import com.example.MovieTicker.response.UserResponse;
import com.example.MovieTicker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    UserService userService;

    @GetMapping
    public ApiResponse<Page<UserResponse>> searchUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "all") String role,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        // Chuyển đổi status từ string sang boolean để service xử lý
        Boolean statusBoolean = status.equals("all") ? null : status.equals("active");

        Page<UserResponse> users = userService.searchUsers(keyword, role, statusBoolean, pageable);

        return ApiResponse.<Page<UserResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy danh sách người dùng thành công.")
                .data(users)
                .build();
    }

    /**
     * API tạo một người dùng mới.
     */
    @PostMapping
    public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserRequest request) {
        UserResponse createdUser = userService.createUser(request);
        return ApiResponse.<UserResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Tạo người dùng thành công.")
                .data(createdUser)
                .build();
    }

    /**
     * API cập nhật thông tin của một người dùng dựa trên ID.
     */
    @PutMapping("/{id}")
    public ApiResponse<UserResponse> updateUser(@PathVariable Long id, @RequestBody @Valid UserUpdateRequest request) {
        UserResponse updatedUser = userService.updateUser(id, request);
        return ApiResponse.<UserResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Cập nhật người dùng thành công.")
                .data(updatedUser)
                .build();
    }

    /**
     * API xóa một người dùng dựa trên ID.
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Xóa người dùng thành công.")
                .build();
    }

    /**
     * API cập nhật trạng thái (khóa/mở khóa) của một tài khoản.
     */
    @PutMapping("/{username}/status")
    public ApiResponse<Void> updateUserStatus(@PathVariable String username, @RequestParam boolean status) {
        userService.updateUserStatus(username, status);
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Cập nhật trạng thái thành công.")
                .build();
    }

    // Helper method để convert TaiKhoan sang UserResponse
    private UserResponse convertToUserResponse(TaiKhoan taiKhoan) {
        User user = taiKhoan.getUser();
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
}
