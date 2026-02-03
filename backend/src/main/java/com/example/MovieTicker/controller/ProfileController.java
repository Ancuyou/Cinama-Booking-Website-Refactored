// Tạo file mới trong: src/main/java/com/example/MovieTicker/controller/ProfileController.java
package com.example.MovieTicker.controller;

import com.example.MovieTicker.entity.User;
import com.example.MovieTicker.request.ChangePasswordRequest;
import com.example.MovieTicker.request.ChangeUsernameRequest;
import com.example.MovieTicker.request.ProfileUpdateRequest;
import com.example.MovieTicker.response.ApiResponse;
import com.example.MovieTicker.response.AuthenticateResponse;
import com.example.MovieTicker.service.AuthenticateService;
import com.example.MovieTicker.service.TaiKhoanService;
import com.example.MovieTicker.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;
    private final TaiKhoanService taiKhoanService;
    private final AuthenticateService authenticateService;

    @GetMapping("/me")
    public ApiResponse<User> getMyInfo() {
        return ApiResponse.<User>builder()
                .data(userService.getMyInfo())
                .build();
    }

    @PutMapping("/me")
    public ApiResponse<User> updateMyInfo(@RequestBody ProfileUpdateRequest request) {
        return ApiResponse.<User>builder()
                .data(userService.updateMyInfo(request))
                .build();
    }

    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@RequestBody ChangePasswordRequest request) {
        taiKhoanService.changePassword(request);
        return ApiResponse.<String>builder()
                .message("Change password successfully.")
                .build();
    }

    @PutMapping("/username")
    public ResponseEntity<AuthenticateResponse> changeUsername(@RequestBody @Valid ChangeUsernameRequest request) {
        AuthenticateResponse response = authenticateService.changeUsername(request);
        return ResponseEntity.ok(response);
    }
}
