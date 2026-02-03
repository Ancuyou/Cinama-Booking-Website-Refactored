package com.example.MovieTicker.service;

import com.example.MovieTicker.entity.Ghe;
import com.example.MovieTicker.entity.LoaiGhe;
import com.example.MovieTicker.entity.PhongChieu;
import com.example.MovieTicker.entity.Ve;
import com.example.MovieTicker.enums.TicketStatus;
import com.example.MovieTicker.repository.GheRepository;
import com.example.MovieTicker.repository.LoaiGheRepository;
import com.example.MovieTicker.repository.PhongChieuRepository;
import com.example.MovieTicker.repository.VeRepository;
import com.example.MovieTicker.request.GheRequest;

import com.example.MovieTicker.response.GheResponse;
import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GheService {
    @Autowired
    private GheRepository gheRepository;

    @Autowired
    private LoaiGheRepository loaiGheRepository;
    
    @Autowired
    private PhongChieuRepository phongChieuRepository;

    @Autowired
    private VeRepository veRepository;

//    @PostConstruct
//    public void seedGhe() {
//        int soHang = 10;
//        int soCot = 10;

//        List<LoaiGhe> loaiGheList = loaiGheRepository.findAll();
//        for (int i = 0; i < soHang; i++) {
//            char hang = (char) ('A' + i);
//            for (int j = 1; j <= soCot; j++) {
//                String tenGhe = String.format("%c%02d", hang, j);
//                LoaiGhe loaiGhe;
//                Optional<PhongChieu> phongChieu = phongChieuRepository.findById("13cf121b-7d10-459e-8e3c-19971969a677");
//                if (phongChieu.isEmpty()) {
//                    throw new RuntimeException("Không tìm thấy phòng chiếu P3 (phòng VIP)");
//                }
//                if (i < 4) {
//                    loaiGhe = loaiGheRepository.findByTenLoaiGhe("Thường");
//                } else if (i < 8) {
//                    loaiGhe = loaiGheRepository.findByTenLoaiGhe("VIP");
//                } else {
//                    loaiGhe = loaiGheRepository.findByTenLoaiGhe("Couple");
//                }
//                if (loaiGhe == null) {
//                    throw new RuntimeException("Loại ghế không tồn tại");
//                }
//                if (!gheRepository.existsByTenGheAndPhongChieu(tenGhe, phongChieu.get())) {
//                    Ghe ghe = Ghe.builder()
//                            .tenGhe(tenGhe)
//                            .loaiGhe(loaiGhe)
//                            .phongChieu(phongChieu.get())
//                            .build();
//                    gheRepository.save(ghe);
//                }
//            }
//        }
//    }

//    @PostConstruct
//    public void seedGhePhongVip() {
//        Optional<PhongChieu> phongChieuOpt = phongChieuRepository.findById("7aeb44eb-5345-4a5a-b466-624f35938f97");
//        if (phongChieuOpt.isEmpty()) {
//            throw new RuntimeException("Không tìm thấy phòng chiếu P3 (phòng VIP)");
//        }

//        PhongChieu phongChieu = phongChieuOpt.get();

//        LoaiGhe loaiVip = loaiGheRepository.findByTenLoaiGhe("VIP");
//        LoaiGhe loaiCouple = loaiGheRepository.findByTenLoaiGhe("Couple");

//        if (loaiVip == null || loaiCouple == null) {
//            throw new RuntimeException("Chưa có loại ghế VIP hoặc Couple trong DB!");
//        }

//        // 🪑 Hàng A–C: ghế VIP, 8 cột mỗi hàng
//        for (int i = 0; i < 3; i++) {
//            char hang = (char) ('A' + i);
//            for (int j = 1; j <= 8; j++) {
//                String tenGhe = String.format("%c%02d", hang, j);
//                if (!gheRepository.existsByTenGheAndPhongChieu(tenGhe, phongChieu)) {
//                    Ghe ghe = Ghe.builder()
//                            .tenGhe(tenGhe)
//                            .loaiGhe(loaiVip)
//                            .phongChieu(phongChieu)
//                            .build();
//                    gheRepository.save(ghe);
//                }
//            }
//        }

//        // 💑 Hàng D–E: ghế Couple, 4 cột mỗi hàng
//        for (int i = 3; i < 5; i++) {
//            char hang = (char) ('A' + i);
//            for (int j = 1; j <= 4; j++) {
//                String tenGhe = String.format("%c%02d", hang, j);
//                if (!gheRepository.existsByTenGheAndPhongChieu(tenGhe, phongChieu)) {
//                    Ghe ghe = Ghe.builder()
//                            .tenGhe(tenGhe)
//                            .loaiGhe(loaiCouple)
//                            .phongChieu(phongChieu)
//                            .build();
//                    gheRepository.save(ghe);
//                }
//            }
//        }

//        System.out.println("✅ Đã seed ghế cho phòng VIP " + phongChieu.getTenPhong());
//    }

    public Ghe updateGhe(String id, GheRequest request) {
        Optional<Ghe> gheOptional = gheRepository.findById(id);
        
        if (gheOptional.isEmpty()) {
            return null;
        }
        
        Ghe ghe = gheOptional.get();
        
        if (request.getTenGhe() != null) {
            ghe.setTenGhe(request.getTenGhe());
        }
        
        if (request.getMaPhongChieu() != null) {
            Optional<PhongChieu> phongChieuOptional = phongChieuRepository.findById(request.getMaPhongChieu());
            phongChieuOptional.ifPresent(ghe::setPhongChieu);
        }
        
        if (request.getMaLoaiGhe() != null) {
            Optional<LoaiGhe> loaiGheOptional = loaiGheRepository.findById(request.getMaLoaiGhe());
            loaiGheOptional.ifPresent(ghe::setLoaiGhe);
        }
        
        return gheRepository.save(ghe);
    }

    public List<Ghe> getBooking(String maSuatChieu) {
        List<Ve> allTickets = veRepository.findBySuatChieuMaSuatChieu(maSuatChieu);
        allTickets.forEach(ve -> {
            System.out.println("Ve ID: " + ve.getMaVe() + ", Ghe: " + ve.getGhe().getTenGhe() + ", Trang Thai: " + ve.getTrangThai());
        });
        return allTickets.stream()
                .filter(ve -> TicketStatus.PAID.getCode().equals(ve.getTrangThai()) ||
                    TicketStatus.PROCESSING.getCode().equals(ve.getTrangThai()))
                .map(Ve::getGhe)
                .collect(Collectors.toList());
    }

    public Ghe createGhe(GheRequest request) {
        LoaiGhe loaiGhe = loaiGheRepository.findById(request.getMaLoaiGhe())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại ghế"));
        PhongChieu phongChieu = phongChieuRepository.findById(request.getMaPhongChieu())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chiếu"));

        Ghe ghe = new Ghe();
        ghe.setTenGhe(request.getTenGhe());
        ghe.setLoaiGhe(loaiGhe);
        ghe.setPhongChieu(phongChieu);

        return gheRepository.save(ghe);
    }


    public void deleteGhe(String s) {
        Ghe ghe = gheRepository.findById(s)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ghế"));
        if (veRepository.existsTicketForSeatAndFutureShowtime(s, LocalDateTime.now()))
            throw new RuntimeException("Đã có lịch đặt ghế");
        gheRepository.deleteById(s);
    }

    public List<Ghe> findAllByPhongChieu(PhongChieu phongChieu) {
        return gheRepository.findAllByPhongChieu(phongChieu);
    }

    public List<GheResponse> findAll() {
        return gheRepository.findGheByLoaiGheAndPhongChieu();
    }
}
