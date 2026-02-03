package com.example.MovieTicker.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.MovieTicker.request.TicketBookingRequest;
import com.example.MovieTicker.response.ApiResponse;
import com.example.MovieTicker.response.HoaDonResponse;
import com.example.MovieTicker.service.VeService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/ve")
public class VeController {
    @Autowired
    private VeService veService;

    @PostMapping
    public ApiResponse<HoaDonResponse> booking(@RequestBody TicketBookingRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) 
        throws IOException
    {
        HoaDonResponse result = veService.createTickets(request, httpRequest, httpResponse);

        return ApiResponse.<HoaDonResponse>builder()
                .code(200)
                .message("Đặt vé thành công - Đang xử lý")
                .data(result)
                .build();
        
    }

    @GetMapping("/search")
    public ApiResponse<?> searchVe(
            @RequestParam(required = false) String tenKhachHang,
            @RequestParam(required = false) String tenPhim,
            @RequestParam(required = false) Integer nam,
            @RequestParam(required = false) Integer thang,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String maHoaDon,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            if (page < 1) page = 1;
            if (size < 1) size = 10;
            
            Map<String, Object> result = veService.searchVe(
                tenKhachHang, tenPhim, nam, thang, trangThai, maHoaDon, page, size
            );
            
            return new ApiResponse<>(
                    HttpStatus.OK.value(),
                    "Tìm kiếm vé thành công",
                    result
            );
        } catch (Exception e) {
            return new ApiResponse<>(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Lỗi khi tìm kiếm vé: " + e.getMessage(),
                    null
            );
        }
    }
    
}
