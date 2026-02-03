package com.example.MovieTicker.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.Getter;

import java.time.LocalDate;

@Data
public class RegistrationRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, message = "Tên đăng nhập phải có ít nhất 4 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Tên đăng nhập chỉ có thể chứa chữ cái, số và các ký tự đặc biệt . _ -")
    private String tenDangNhap;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String matKhau;

    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String sdt;

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate ngaySinh;
}
