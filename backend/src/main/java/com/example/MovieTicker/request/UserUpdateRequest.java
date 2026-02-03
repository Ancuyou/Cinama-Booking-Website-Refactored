package com.example.MovieTicker.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UserUpdateRequest {
    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String sdt;

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate ngaySinh;

    private String tenVaiTro; // "USER" hoặc "ADMIN"
}
