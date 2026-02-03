package com.example.MovieTicker.request;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SettingRequest {
    private String maCauHinh;
    private String tenCauHinh;
    private String giaTri;
    private String loai;
}
