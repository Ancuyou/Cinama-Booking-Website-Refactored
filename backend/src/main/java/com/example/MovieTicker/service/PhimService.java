package com.example.MovieTicker.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.example.MovieTicker.entity.CauHinhHeThong;
import com.example.MovieTicker.repository.SettingRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.MovieTicker.entity.Phim;
import com.example.MovieTicker.entity.TheLoaiPhim;
import com.example.MovieTicker.repository.PhimRepository;
import com.example.MovieTicker.request.PhimRequest;

@Service
public class PhimService {

    @Autowired
    private PhimRepository phimRepository;

    @Autowired
    private TheLoaiPhimService theLoaiPhimService;
    @Autowired
    private SettingRepository settingRepository;

    public void saveTheLoai(List<TheLoaiPhim> theLoaiPhimList, String[] tenTheLoai) {
        if (tenTheLoai != null) {
            for (String ten : tenTheLoai) {
                if (!theLoaiPhimService.existsByTenTheLoai(ten.trim())) {
                    throw new RuntimeException("Thể loại phim với tên '" + ten.trim() + "' không tồn tại");
                }
                Optional<TheLoaiPhim> theLoaiPhim = theLoaiPhimService.findByTenPhim(ten.trim());
                theLoaiPhim.ifPresent(theLoaiPhimList::add);
            }
        }
    }

    public Phim createPhim(PhimRequest request) {
        try {
        if (phimRepository.existsByTenPhim(request.getTenPhim())) {
            throw new RuntimeException("Phim với tên '" + request.getTenPhim() + "' đã tồn tại");
        }
        List<TheLoaiPhim> theLoaiPhimList = new ArrayList<>();
        Phim phim = Phim.builder()
                .tenPhim(request.getTenPhim())
                .moTa(request.getMoTa())
                .daoDien(request.getDaoDien())
                .dienVien(request.getDienVien())
                .thoiLuong(request.getThoiLuong())
                .ngayKhoiChieu(request.getNgayKhoiChieu())
                .hinhAnh(request.getHinhAnh())
                .trailerURL(request.getTrailerURL())
                .tuoi(request.getTuoi())
                .trangThai(request.getTrangThai())
                .listTheLoai(theLoaiPhimList)
                .build();

            saveTheLoai(theLoaiPhimList, request.getTheLoai());
            phim.setListTheLoai(theLoaiPhimList);
            return phimRepository.save(phim);
        } catch (Exception e) {
            System.out.println("Lỗi khi tạo phim: " + e.getMessage());
            throw new RuntimeException("Lỗi khi tạo phim: " + e.getMessage());
        }
    }

    public List<Phim> getAllPhim() {
        return phimRepository.findAll();
    }

    public Phim getPhimById(String maPhim) {
        return phimRepository.findById(maPhim)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với mã: " + maPhim));
    }

    public Phim getPhimByTen(String tenPhim) {
        return phimRepository.findByTenPhim(tenPhim)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với tên: " + tenPhim));
    }

    public Phim updatePhim(String maPhim, PhimRequest request) {
        Phim existingPhim = getPhimById(maPhim);
        
        if (!existingPhim.getTenPhim().equals(request.getTenPhim()) && 
            phimRepository.existsByTenPhim(request.getTenPhim())) {
            throw new RuntimeException("Phim với tên '" + request.getTenPhim() + "' đã tồn tại");
        }
        List<TheLoaiPhim> theLoaiPhimList = new ArrayList<>();
        String[] tenTheLoai = request.getTheLoai();
        if (tenTheLoai != null) {
            for (String ten : tenTheLoai) {
                if (!theLoaiPhimService.existsByTenTheLoai(ten)) {
                    throw new RuntimeException("Thể loại phim với tên '" + ten + "' không tồn tại");
                }
                Optional<TheLoaiPhim> theLoaiPhim = theLoaiPhimService.findByTenPhim(ten);
                theLoaiPhim.ifPresent(theLoaiPhimList::add);
            }
        }

        existingPhim.setTenPhim(request.getTenPhim());
        existingPhim.setMoTa(request.getMoTa());
        existingPhim.setDaoDien(request.getDaoDien());
        existingPhim.setDienVien(request.getDienVien());
        existingPhim.setThoiLuong(request.getThoiLuong());
        existingPhim.setNgayKhoiChieu(request.getNgayKhoiChieu());
        existingPhim.setHinhAnh(request.getHinhAnh());
        existingPhim.setTrailerURL(request.getTrailerURL());
        existingPhim.setTuoi(request.getTuoi());
        existingPhim.setTrangThai(request.getTrangThai());
        existingPhim.setListTheLoai(theLoaiPhimList);

        return phimRepository.save(existingPhim);
    }

    public void deletePhim(String maPhim) {
        Phim phim = getPhimById(maPhim);
        List<CauHinhHeThong> sliders = settingRepository.findByLoai("Phim");
        for (CauHinhHeThong slider : sliders) {
            int firstDash = slider.getTenCauHinh().indexOf('-');
            String ma = slider.getTenCauHinh().substring(firstDash + 1).trim();
            if (ma.equals(phim.getMaPhim())) {
                throw new RuntimeException("Không thể xóa phim này vì nó đang được sử dụng trong slider của hệ thống");
            }
        }
        phimRepository.delete(phim);
    }

    public Page<Phim> searchPhimByTen(String keyword, Pageable pageable) {
        return phimRepository.findByKeyword(keyword, pageable);
    }

    
    public boolean existsByTenPhim(String tenPhim) {
        return phimRepository.existsByTenPhim(tenPhim);
    }

    public Page<Phim> getPhimPage(Pageable pageable) {
        return phimRepository.findAll(pageable);
    }

    public List<Phim> getPhimByTrangThai(String trangThai) {
    return phimRepository.findByTrangThai(trangThai);
    }

    public List<Phim> getPhimDangChieu() {
        return phimRepository.findPhimDangChieu();
    }

    public List<Phim> getPhimSapChieu() {
        return phimRepository.findPhimSapChieu();
    }

    private LocalDate parseToLocalDate(Cell cell, DataFormatter formatter) {
        if (cell == null) return null;

        try {
            // Trường hợp Excel lưu dưới dạng "date" thật
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }

            // Trường hợp là chuỗi
            String raw = formatter.formatCellValue(cell).trim();

            // Thử các định dạng phổ biến
            DateTimeFormatter[] patterns = new DateTimeFormatter[]{
                    DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                    DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                    DateTimeFormatter.ofPattern("d/M/yyyy")
            };

            for (DateTimeFormatter p : patterns) {
                try {
                    return LocalDate.parse(raw, p);
                } catch (Exception ignored) {}
            }
            return null;
        } catch (Exception e) {
            System.out.println("Lỗi khi chuyển đổi ngày tháng: " + e.getMessage());
            return null;
        }
    }


    public void uploadPhimFromExcel(MultipartFile file) {
        // Logic to upload image file
        try (InputStream inputStream = file.getInputStream();
            Workbook workbook = new XSSFWorkbook(inputStream)) {
            // Process the Excel file using Apache POI
            // For example, read rows and create Phim entities
            Sheet sheet = workbook.getSheetAt(0);
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // Đọc giá trị từ Excel
                String tenPhim = formatter.formatCellValue(row.getCell(0));
                String moTa = formatter.formatCellValue(row.getCell(1));
                String daoDien = formatter.formatCellValue(row.getCell(2));
                String dienVien = formatter.formatCellValue(row.getCell(3));

                String thoiLuongStr = formatter.formatCellValue(row.getCell(4));
                int thoiLuong = thoiLuongStr.isEmpty() ? 0 : Integer.parseInt(thoiLuongStr);

                LocalDate ngayKhoiChieu = parseToLocalDate(row.getCell(5), formatter);
                String hinhAnh = formatter.formatCellValue(row.getCell(6));
                String trailerURL = formatter.formatCellValue(row.getCell(7));

                String tuoiStr = formatter.formatCellValue(row.getCell(8));
                int tuoi = tuoiStr.isEmpty() ? 0 : Integer.parseInt(tuoiStr);

                String trangThai = formatter.formatCellValue(row.getCell(9));
                String theLoaiStr = formatter.formatCellValue(row.getCell(10));
                String[] theLoai = theLoaiStr.split(",");

                // Tạo request
                PhimRequest request = new PhimRequest();
                request.setTenPhim(tenPhim);
                request.setMoTa(moTa);
                request.setDaoDien(daoDien);
                request.setDienVien(dienVien);
                request.setThoiLuong(thoiLuong);
                request.setNgayKhoiChieu(ngayKhoiChieu);
                request.setHinhAnh(hinhAnh);
                request.setTrailerURL(trailerURL);
                request.setTuoi(tuoi);
                request.setTrangThai(trangThai);
                request.setTheLoai(theLoai);

                createPhim(request);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            System.out.println("Lỗi khi tải lên phim từ file Excel: " + e.getMessage());
            throw new RuntimeException("Lỗi khi tải lên phim từ file Excel: " + e.getMessage());
        }

        // This is a placeholder implementation
        System.out.println("Uploading file: " + file.getOriginalFilename());
    }

}