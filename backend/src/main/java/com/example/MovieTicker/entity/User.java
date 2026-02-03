package com.example.MovieTicker.entity;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.validation.constraints.Email;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long maUser;

    @Column(nullable = false)
    private String hoTen;

    @Email
    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String sdt;

    @Column(nullable = false)
    private LocalDate ngaySinh;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TaiKhoan> taiKhoan;

    @Override
    public String toString() {
        return "User{" +
                "maUser=" + maUser +
                ", hoTen='" + hoTen + '\'' +
                ", email='" + email + '\'' +
                ", sdt='" + sdt + '\'' +
                ", ngaySinh=" + ngaySinh +
                '}'; // KHÔNG include taiKhoan
    }
}