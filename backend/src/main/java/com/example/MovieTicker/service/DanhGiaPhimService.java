package com.example.MovieTicker.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.MovieTicker.entity.DanhGiaPhim;
import com.example.MovieTicker.entity.Phim;
import com.example.MovieTicker.entity.TaiKhoan;
import com.example.MovieTicker.entity.User;
import com.example.MovieTicker.repository.DanhGiaPhimRepository;
import com.example.MovieTicker.repository.PhimRepository;
import com.example.MovieTicker.repository.TaiKhoanRepository;
import com.example.MovieTicker.request.DanhGiaPhimRequest;
import com.example.MovieTicker.response.DanhGiaPhimResponse;

@Service
public class DanhGiaPhimService {

    @Autowired
    private DanhGiaPhimRepository danhGiaPhimRepository;

    @Autowired
    private PhimRepository phimRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getName())) {
            String username = authentication.getName();
            TaiKhoan taiKhoan = taiKhoanRepository.findById(username).orElse(null);
            if (taiKhoan != null) {
                return taiKhoan.getUser();
            }
        }
        return null;
    }
    
    public DanhGiaPhimResponse saveDanhGiaPhim(DanhGiaPhimRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Bạn cần đăng nhập để đánh giá phim");
        }

        Phim phim = phimRepository.findById(request.getMaPhim())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với mã: " + request.getMaPhim()));

        DanhGiaPhim entity = DanhGiaPhim.builder()
                .rating(request.getRating())
                .comment(request.getComment())
                .user(currentUser)
                .phim(phim)
                .build();

        entity = danhGiaPhimRepository.save(entity);
        return convertToResponse(entity);
    }

   
    public List<DanhGiaPhimResponse> getDanhGiaByPhimId(String maPhim) {
        List<DanhGiaPhim> danhGiaPhims = danhGiaPhimRepository.findByPhimMaPhim(maPhim);
        return danhGiaPhims.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }


    public List<DanhGiaPhimResponse> getAllDanhGiaPhim() {
        List<DanhGiaPhim> danhGiaPhims = danhGiaPhimRepository.findAll();
        return danhGiaPhims.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }


    public DanhGiaPhimResponse getDanhGiaPhimById(String id) {
        DanhGiaPhim entity = danhGiaPhimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá với ID: " + id));
        return convertToResponse(entity);
    }


    public DanhGiaPhimResponse updateDanhGia(String id, DanhGiaPhimRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Bạn cần đăng nhập để cập nhật đánh giá");
        }

        DanhGiaPhim danhGia = danhGiaPhimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá với ID: " + id));

        if (!danhGia.getUser().getMaUser().equals(currentUser.getMaUser())) {
            throw new RuntimeException("Bạn không có quyền cập nhật đánh giá này");
        }

        danhGia.setRating(request.getRating());
        danhGia.setComment(request.getComment());

        danhGia = danhGiaPhimRepository.save(danhGia);
        return convertToResponse(danhGia);
    }

    public void deleteDanhGiaPhim(String id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Bạn cần đăng nhập để xóa đánh giá");
        }

        DanhGiaPhim danhGia = danhGiaPhimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá với ID: " + id));

       
        if (!danhGia.getUser().getMaUser().equals(currentUser.getMaUser())) {
            throw new RuntimeException("Bạn không có quyền xóa đánh giá này");
        }

        danhGiaPhimRepository.delete(danhGia);
    }

    public List<DanhGiaPhimResponse> getDanhGiaByMyUser() {
        User user = null;
        String username = com.example.MovieTicker.util.SecurityUtil.getCurrentUsername();
        if (username != null && !"anonymousUser".equals(username)) {
            TaiKhoan taiKhoan = taiKhoanRepository.findById(username).orElse(null);
            if (taiKhoan != null) {
                user = taiKhoan.getUser();
            }
        }
        if (user != null) {
            List<DanhGiaPhim> danhGiaPhims = danhGiaPhimRepository.findByUserMaUser(user.getMaUser());
            return danhGiaPhims.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        }

        return Collections.emptyList();
    }

   
    public Page<DanhGiaPhimResponse> getDanhGiaPhimPaginated(String tenPhim, int page, int size, String sortBy, String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<DanhGiaPhim> danhGiaPage = danhGiaPhimRepository.findByPhimTenPhimContaining(tenPhim, pageable);
        
        return danhGiaPage.map(this::convertToResponse);
    }

    private DanhGiaPhimResponse convertToResponse(DanhGiaPhim danhGia) {
        List<TaiKhoan> taiKhoans = danhGia.getUser().getTaiKhoan();
        String userName = taiKhoans.isEmpty() ? "Unknown" : taiKhoans.get(0).getTenDangNhap();
        return DanhGiaPhimResponse.builder()
                .id(danhGia.getId())
                .rating(danhGia.getRating())
                .comment(danhGia.getComment())
                .fullName(danhGia.getUser().getHoTen())
                .userName(userName)
                .userEmail(danhGia.getUser().getEmail())
                .maPhim(danhGia.getPhim().getMaPhim())
                .tenPhim(danhGia.getPhim().getTenPhim())
                .createdAt(danhGia.getCreatedAt())
                .build();
    }

    public Double getAvgRatingByPhimMaPhim(String maPhim) {
        List<DanhGiaPhim> danhGiaPhims = danhGiaPhimRepository.findByPhimMaPhim(maPhim);
        if (danhGiaPhims.isEmpty()) {
            throw new RuntimeException("Không có đánh giá nào cho phim với mã: " + maPhim);
        }
        return danhGiaPhims.stream()
                .mapToDouble(DanhGiaPhim::getRating)
                .average()
                .orElse(0.0);
    }
}
