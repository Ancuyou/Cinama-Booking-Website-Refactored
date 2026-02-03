package com.example.MovieTicker.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UserRequest {
    // Thông tin User
    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;
    @NotBlank(message = "Số điện thoại không được để trống")
    private String sdt;
    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate ngaySinh;

    // Thông tin TaiKhoan
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String tenDangNhap;
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String matKhau;
    private String tenVaiTro; // "USER" hoặc "ADMIN"
}
