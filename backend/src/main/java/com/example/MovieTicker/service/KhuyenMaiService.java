package com.example.MovieTicker.service;

import com.example.MovieTicker.entity.CauHinhHeThong;
import com.example.MovieTicker.entity.KhuyenMai;
import com.example.MovieTicker.repository.KhuyenMaiRepository;
import com.example.MovieTicker.repository.SettingRepository;
import com.example.MovieTicker.request.KhuyenMaiRequest;
import com.example.MovieTicker.response.HoaDonSatisticResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class KhuyenMaiService {
    
    @Autowired
    private KhuyenMaiRepository khuyenMaiRepository;
    @Autowired
    private SettingRepository settingRepository;

    public List<KhuyenMai> getAllKhuyenMai() {
        return khuyenMaiRepository.findAll();
    }
    
    public List<KhuyenMai> getValidPromotions() {
        return khuyenMaiRepository.findValidPromotions(LocalDate.now());
    }
    
    public Optional<KhuyenMai> getKhuyenMaiById(String id) {
        return khuyenMaiRepository.findById(id);
    }
    
    public List<KhuyenMai> searchKhuyenMai(String keyword) {
        return khuyenMaiRepository.findByKeyword(keyword);
    }

    public Page<KhuyenMai> searchKhuyenMaiPageable(String keyword, Pageable pageable) {
        return khuyenMaiRepository.findKhuyenMaisByTenKmContainingIgnoreCaseAndMaCodeContainingIgnoreCase(keyword, keyword, pageable);
    }
    
    public KhuyenMai createKhuyenMai(KhuyenMaiRequest request) {
        if (request.getNgayKetThuc().isBefore(request.getNgayBatDau())) {
            throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        Optional<KhuyenMai> existingKm = khuyenMaiRepository.findByMaCode(request.getMaCode());
        if (existingKm.isPresent()) {
            throw new RuntimeException("Mã khuyến mãi đã tồn tại");
        }

        KhuyenMai khuyenMai = KhuyenMai.builder()
                .tenKm(request.getTenKm())
                .maCode(request.getMaCode())
                .soLuong(request.getSoLuong())
                .trangThai(request.isTrangThai())
                .moTa(request.getMoTa())
                .giaTri(request.getGiaTri())
                .ngayBatDau(request.getNgayBatDau())
                .ngayKetThuc(request.getNgayKetThuc())
                .urlHinh(request.getUrlHinh())
                .build();
        
        return khuyenMaiRepository.save(khuyenMai);
    }
    
    public KhuyenMai updateKhuyenMai(String id, KhuyenMaiRequest request) {
        Optional<KhuyenMai> optionalKhuyenMai = khuyenMaiRepository.findById(id);
        if (optionalKhuyenMai.isPresent()) {
            if (request.getNgayKetThuc().isBefore(request.getNgayBatDau())) {
                throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu");
            }
            KhuyenMai khuyenMai = optionalKhuyenMai.get();
            khuyenMai.setTenKm(request.getTenKm());
            khuyenMai.setMoTa(request.getMoTa());
            khuyenMai.setGiaTri(request.getGiaTri());
            khuyenMai.setNgayBatDau(request.getNgayBatDau());
            khuyenMai.setNgayKetThuc(request.getNgayKetThuc());
            khuyenMai.setUrlHinh(request.getUrlHinh());
            khuyenMai.setSoLuong(request.getSoLuong());
            khuyenMai.setTrangThai(request.isTrangThai());
            khuyenMai.setMaCode(request.getMaCode());
            
            return khuyenMaiRepository.save(khuyenMai);
        }
        return null;
    }
    
    public boolean deleteKhuyenMai(String id) {
        if (khuyenMaiRepository.existsById(id)) {
            List<CauHinhHeThong> sliders = settingRepository.findByLoai("Khuyến mãi");
            for (CauHinhHeThong slider : sliders) {
                String tenCauHinh = slider.getTenCauHinh();
                String[] parts = tenCauHinh.split("-");
                String ma = parts[parts.length - 1].trim();
                if (ma.equals(id)) {
                    settingRepository.deleteById(slider.getMaCauHinh());
                }
            }
            khuyenMaiRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Page<KhuyenMai> getKhuyenMaiPage(Pageable pageable) {
        return khuyenMaiRepository.findAll(pageable);
    }

    public Optional<KhuyenMai> getKhuyenMaiByCode(String maCode) {
        return khuyenMaiRepository.findByMaCode(maCode);
    }

    public KhuyenMai getKhuyenMaiByCodeValidate(String code) {
        Optional<KhuyenMai> khuyenMai = getKhuyenMaiByCode(code);
        String username = com.example.MovieTicker.util.SecurityUtil.getCurrentUsername();
        if(username == null || "anonymousUser".equals(username)) {
            throw new RuntimeException("Người dùng chưa đăng nhập để sử dụng khuyến mãi");
        }
        LocalDate today = LocalDate.now();
        if(khuyenMai.isPresent()) {
            KhuyenMai km = khuyenMai.get();
            if(km.getSoLuong() <= 0) {
                throw new RuntimeException("Khuyến mãi đã hết lượt sử dụng");
            }
            if(km.isTrangThai()) {
                if(km.getNgayBatDau().compareTo(today) <= 0 && km.getNgayKetThuc().compareTo(today) >= 0) {
                    return km;
                } else {
                    throw new RuntimeException("Khuyến mãi đã hết hạn hoặc chưa đến ngày áp dụng");
                }
            } else {
                throw new RuntimeException("Khuyến mãi đã bị vô hiệu hóa");
            }
        }
        return khuyenMai.orElse(null);
    }


}