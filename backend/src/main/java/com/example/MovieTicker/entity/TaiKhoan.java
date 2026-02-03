package com.example.MovieTicker.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "TaiKhoan")
@ToString(exclude = "user")
public class TaiKhoan {
    @Id
    private String tenDangNhap;
    
    private String MatKhau;

    @ManyToOne
    @JoinColumn(name = "maUser", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "vaiTroID", nullable = false)
    @JsonIgnore
    private VaiTro vaiTro;
    @Column(columnDefinition = "TINYINT(1)")
    private boolean trangThai; // true = active, false = inactive/locked
    @PrePersist
    protected void onCreate() {
        this.trangThai = true; // Mặc định là active khi tạo mới
    }
}
