package com.example.MovieTicker.repository;

import com.example.MovieTicker.entity.CauHinhHeThong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SettingRepository extends JpaRepository<CauHinhHeThong, String> {
    @Query("SELECT MAX(CAST(SUBSTRING(c.maCauHinh, 8) AS int)) FROM CauHinhHeThong c WHERE c.maCauHinh LIKE 'SLIDER%'")
    Integer findMaxSliderNumber();


    @Query("SELECT c FROM CauHinhHeThong c WHERE c.maCauHinh LIKE 'SLIDER%' AND c.loai = :loai" )
    List<CauHinhHeThong> findByLoai(String loai);

    @Query("SELECT c FROM CauHinhHeThong c WHERE c.maCauHinh LIKE 'SLIDER%' AND c.loai != 'Phim'" )
    List<CauHinhHeThong> findKhuyenMaiByLoai();

    Optional<CauHinhHeThong> findByMaCauHinh(String s);
}
