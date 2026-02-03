package com.example.MovieTicker.repository;

import com.example.MovieTicker.entity.TaiKhoan;
import com.example.MovieTicker.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan,String> {
    Optional<TaiKhoan> findByUser_HoTenOrUser_Sdt(String hoTen, String sdt);
    Optional<TaiKhoan> findByUser(User user);
    Optional<TaiKhoan> findByTenDangNhap(@Param("tenDangNhap") String tenDangNhap);
    boolean existsByTenDangNhap(String tenDangNhap);

    @Query("SELECT tk FROM TaiKhoan tk WHERE tk.user.maUser = :userId")
    Optional<TaiKhoan> findByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TaiKhoan tk WHERE tk.user.maUser = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Query("SELECT tk FROM TaiKhoan tk JOIN tk.user u WHERE " +
            "(:keyword IS NULL OR u.hoTen LIKE %:keyword% OR u.email LIKE %:keyword% OR tk.tenDangNhap LIKE %:keyword%) AND " +
            "(:role IS NULL OR :role = 'all' OR tk.vaiTro.tenVaiTro = :role) AND " +
            "(:status IS NULL OR tk.trangThai = :status)")
    Page<TaiKhoan> searchUsers(
            @Param("keyword") String keyword,
            @Param("role") String role,
            @Param("status") Boolean status,
            Pageable pageable
    );
}
