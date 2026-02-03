package com.example.MovieTicker.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhimStatisticResponse {
    private String tenPhim;
    private Long soLuongSuatChieu;
    private Long soLuongVeDaBan;
    private Double tongDoanhThu;
}
