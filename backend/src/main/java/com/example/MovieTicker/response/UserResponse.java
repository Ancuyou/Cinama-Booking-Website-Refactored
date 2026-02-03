package com.example.MovieTicker.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class UserResponse {
    private Long maUser;
    private String hoTen;
    private String email;
    private String sdt;
    private LocalDate ngaySinh;
    private String tenDangNhap;
    private String tenVaiTro;
    private boolean trangThai;
}
