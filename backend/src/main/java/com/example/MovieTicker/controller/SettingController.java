package com.example.MovieTicker.controller;

import com.beust.ah.A;
import com.example.MovieTicker.entity.CauHinhHeThong;
import com.example.MovieTicker.entity.PhongChieu;
import com.example.MovieTicker.request.PhongChieuRequest;
import com.example.MovieTicker.request.SettingRequest;
import com.example.MovieTicker.response.ApiResponse;
import com.example.MovieTicker.service.CaiDatHeThongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/setting")
public class SettingController {

    @Autowired
    CaiDatHeThongService caiDatHeThongService;

    @GetMapping
    public ApiResponse<?> getListSetting() {
        return ApiResponse.<List<CauHinhHeThong>>builder()
                .code(200)
                .message("Lấy danh sách cài đặt thành công")
                .data(caiDatHeThongService.findAll())
                .build();
    }

    @PostMapping
    public ApiResponse<?> createCaiDat(@RequestBody SettingRequest request) {
        try {
            CauHinhHeThong heThong = caiDatHeThongService.createSettings(request);
            return ApiResponse.<CauHinhHeThong>builder()
                    .code(HttpStatus.CREATED.value())
                    .message("Tạo banner quảng cáo thành công")
                    .data(heThong)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.CREATED.value())
                    .message("Đã xảy ra lỗi")
                    .data(e.getMessage())
                    .build();
        }
    }

    @PutMapping
    public ApiResponse<?> updateCaiDat(@RequestBody SettingRequest request) {
        try {
            CauHinhHeThong heThong = caiDatHeThongService.updateSettings(request);
            return ApiResponse.<CauHinhHeThong>builder()
                    .code(HttpStatus.CREATED.value())
                    .message("Cập nhật cài đặt thành công")
                    .data(heThong)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.CREATED.value())
                    .message("Đã xảy ra lỗi")
                    .data(e.getMessage())
                    .build();
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteCaiDat(@PathVariable String id) {
        try {
            if (!(id.startsWith("SLIDER_"))) {
                throw new RuntimeException("Không thể xóa cài đặt hệ thống này");
            }
            caiDatHeThongService.deleteById(id);
            return ApiResponse.<CauHinhHeThong>builder()
                    .code(HttpStatus.CREATED.value())
                    .message("Xóa thành công")
                    .data(null)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.CREATED.value())
                    .message("Đã xảy ra lỗi")
                    .data(e.getMessage())
                    .build();
        }
    }

    @GetMapping("/phim")
    public ApiResponse<?> getPhimSlider() {
        try {
            List<CauHinhHeThong> phim = caiDatHeThongService.findPhimByLoai("Phim");
            return ApiResponse.<List<CauHinhHeThong>>builder()
                    .code(HttpStatus.OK.value())
                    .message("Lấy danh sách slider phim thành công")
                    .data(phim)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Đã xảy ra lỗi")
                    .data(e.getMessage())
                    .build();
        }
    }

    @GetMapping("/khuyenmai")
    public ApiResponse<?> getKhuyenMaiSlider() {
        try {
            List<CauHinhHeThong> phim = caiDatHeThongService.findKhuyenMaiByLoai();
            return ApiResponse.<List<CauHinhHeThong>>builder()
                    .code(HttpStatus.OK.value())
                    .message("Lấy danh sách slider khuyến mãi thành công")
                    .data(phim)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Đã xảy ra lỗi")
                    .data(e.getMessage())
                    .build();
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getSettingById(@PathVariable String id) {
        try {
            CauHinhHeThong cauHinhHeThong = caiDatHeThongService.findById(id);
            return ApiResponse.<CauHinhHeThong>builder()
                    .code(HttpStatus.OK.value())
                    .message("Lấy cài đặt hệ thống thành công")
                    .data(cauHinhHeThong)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.BAD_REQUEST.value())
                    .message("Đã xảy ra lỗi")
                    .data(e.getMessage())
                    .build();
        }
    }
}

