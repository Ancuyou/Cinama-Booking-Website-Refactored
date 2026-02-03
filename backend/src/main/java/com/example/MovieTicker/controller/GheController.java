package com.example.MovieTicker.controller;

import com.example.MovieTicker.entity.Ghe;
import com.example.MovieTicker.request.GheRequest;
import com.example.MovieTicker.response.ApiResponse;
import com.example.MovieTicker.response.GheResponse;
import com.example.MovieTicker.service.GheService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/ghe")
public class GheController {
    @Autowired
    private GheService gheService;

    @PostMapping()
    public ApiResponse<?> createGhe(@RequestBody GheRequest request) {
        try {
            Ghe newGhe = gheService.createGhe(request);
            return ApiResponse.<Ghe>builder()
                    .code(HttpStatus.OK.value())
                    .message("Cập nhật ghế thành công")
                    .data(newGhe)
                    .build();
        } catch (Error error) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.NOT_FOUND.value())
                    .message("Có lỗi xảy ra")
                    .data(error.getMessage())
                    .build();
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateGhe(@PathVariable String id, @RequestBody GheRequest request) {
        Ghe updatedGhe = gheService.updateGhe(id, request);
        if (updatedGhe != null) {
            return ApiResponse.<Ghe>builder()
                    .code(HttpStatus.OK.value())
                    .message("Cập nhật ghế thành công")
                    .data(updatedGhe)
                    .build();
        } else {
            return ApiResponse.builder()
                    .code(HttpStatus.NOT_FOUND.value())
                    .message("Không tìm thấy ghế với mã: " + id)
                    .build();
        }
    }  

    @GetMapping("/booking/{maSuatChieu}")
    public ApiResponse<?> getBooking(@PathVariable String maSuatChieu) {
        List<Ghe> bookedSeats = gheService.getBooking(maSuatChieu);
       try {
            return ApiResponse.<List<Ghe>>builder()
                    .code(HttpStatus.OK.value())
                    .message("Lấy danh sách ghế đã đặt thành công")
                    .data(bookedSeats)
                    .build();
        } catch (Exception e) {
            return ApiResponse.builder()
                    .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Đã xảy ra lỗi khi lấy danh sách ghế đã đặt: " + e.getMessage())
                    .build();
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteGhe(@PathVariable String id) {
        try {
            gheService.deleteGhe(id);
            return ApiResponse.<String>builder()
                    .code(HttpStatus.OK.value())
                    .message("Xóa ghế thành công")
                    .data(null)
                    .build();
        }
        catch (Error e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.OK.value())
                    .message("Xóa ghế thất bại")
                    .data(e.getMessage())
                    .build();
        }
    }

    @GetMapping()
    public ApiResponse<?> getAllGhe() {
        try {
            List<GheResponse> listGhe = gheService.findAll();
            return ApiResponse.<List<GheResponse>>builder()
                    .code(HttpStatus.OK.value())
                    .message("Thành công")
                    .data(listGhe)
                    .build();
        }
        catch (Error e) {
            return ApiResponse.<String>builder()
                    .code(HttpStatus.OK.value())
                    .message("Đã có lỗi xảy ra")
                    .data(e.getMessage())
                    .build();
        }
    }

}