package com.example.MovieTicker.service;

import com.example.MovieTicker.entity.CauHinhHeThong;
import com.example.MovieTicker.entity.Ghe;
import com.example.MovieTicker.entity.LoaiGhe;
import com.example.MovieTicker.entity.PhongChieu;
import com.example.MovieTicker.repository.SettingRepository;
import com.example.MovieTicker.request.SettingRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CaiDatHeThongService {

    @Autowired
    SettingRepository settingRepository;

    public void deleteById(String s) {
        Optional<CauHinhHeThong> heThong = settingRepository.findById(s.trim());
        if (heThong.isPresent()) {
            settingRepository.deleteById(s.trim());
        }
        else throw new RuntimeException("Không tìm thấy cấu hình này trong hệ thống");
    }

    public List<CauHinhHeThong> findAll() {
        return settingRepository.findAll();
    }

    public CauHinhHeThong updateSettings(SettingRequest request) {
        Optional<CauHinhHeThong> optHeThong = settingRepository.findById(request.getMaCauHinh());
        if (optHeThong.isPresent()) {
            CauHinhHeThong heThong = optHeThong.get();
            heThong.setLoai(request.getLoai());
            heThong.setGiaTri(request.getGiaTri());
            heThong.setTenCauHinh(request.getTenCauHinh());
            return settingRepository.save(heThong);
        }
        else throw new RuntimeException("Không tìm thấy cấu hình này trong hệ thống");
    }

    public CauHinhHeThong createSettings(SettingRequest request) {
        int nextNum = settingRepository.findMaxSliderNumber() == null ? 1 : settingRepository.findMaxSliderNumber() + 1;
        CauHinhHeThong heThong = new CauHinhHeThong();
        heThong.setMaCauHinh("SLIDER_" + nextNum);
        heThong.setLoai(request.getLoai());
        heThong.setGiaTri(request.getGiaTri());
        heThong.setTenCauHinh(request.getTenCauHinh());
        return settingRepository.save(heThong);
    }

    public List<CauHinhHeThong> findPhimByLoai(String loai) {
        return settingRepository.findByLoai(loai);
    }

    public List<CauHinhHeThong> findKhuyenMaiByLoai() {
        return settingRepository.findKhuyenMaiByLoai();
    }

    public CauHinhHeThong findById(String id) {
        return settingRepository.findById(id).get();
    }
}
