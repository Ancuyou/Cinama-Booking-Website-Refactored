package com.example.MovieTicker.response;

import com.example.MovieTicker.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HoaDonSatisticResponse {
    private String maHD;
    private LocalDateTime ngayLap;
    private String trangThai;
    private Double tongTien;
    private Long soLuongVe;
    private LocalDateTime thoiGianBatDau;
    private String tenPhim;
    private String tenPhong;
}
