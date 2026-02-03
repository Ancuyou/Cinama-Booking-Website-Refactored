import React, { useState } from "react";
import Movie from "./Movie";

const MovieScreen = ({ movies = [], onMovieClick }) => {
    // ✅ Đảm bảo luôn là mảng, tránh lỗi "movies.slice is not a function"
    const safeMovies = Array.isArray(movies) ? movies : [];

    const [currentPage, setCurrentPage] = useState(0);
    const moviesPerPage = 4; // 4 phim x 2 dòng = 8 phim mỗi trang

    const totalPages = Math.max(1, Math.ceil(safeMovies.length / moviesPerPage));
    const startIndex = currentPage * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    const currentMovies = safeMovies.slice(startIndex, endIndex);

    const nextPage = () => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
    };

    const prevPage = () => {
        setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    };

    const goToPage = (pageIndex) => {
        setCurrentPage(pageIndex);
    };

    return (
        <div className="bg-dark min-vh-100 py-5">
            <div className="container-fluid">
                {/* Header */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <h1 className="text-white display-4 fw-bold mb-0">
                                <i className="fas fa-film me-3 text-danger"></i>
                                Danh Sách Phim
                            </h1>

                            <div className="d-flex align-items-center gap-3">
                <span className="text-muted">
                  Trang {currentPage + 1} / {totalPages}
                </span>

                                <div className="btn-group" role="group">
                                    <button
                                        className="btn btn-outline-light"
                                        onClick={prevPage}
                                        disabled={totalPages <= 1}
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <button
                                        className="btn btn-outline-light"
                                        onClick={nextPage}
                                        disabled={totalPages <= 1}
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thống kê phim */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-info bg-gradient" role="alert">
                            <i className="fas fa-info-circle me-2"></i>
                            Hiển thị {currentMovies.length} phim trong tổng số{" "}
                            {safeMovies.length} phim
                        </div>
                    </div>
                </div>

                {/* Grid phim */}
                <div className="row">
                    {currentMovies.length > 0 ? (
                        currentMovies.map((movie) => (
                            <Movie
                                key={movie.maPhim || movie.id || idx}
                                movie={movie}
                                onClick={onMovieClick}
                            />
                        ))
                    ) : (
                        <div className="text-center text-secondary fs-5">
                            Không có phim nào để hiển thị
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="row mt-5">
                        <div className="col-12">
                            <nav aria-label="Phân trang phim">
                                <ul className="pagination justify-content-center pagination-lg">
                                    {/* Nút Trước */}
                                    <li
                                        className={`page-item ${
                                            currentPage === 0 ? "disabled" : ""
                                        }`}
                                    >
                                        <button
                                            className="page-link bg-dark text-white border-secondary"
                                            onClick={prevPage}
                                        >
                                            <i className="fas fa-angle-left"></i> Trước
                                        </button>
                                    </li>

                                    {/* Số trang */}
                                    {Array.from({ length: totalPages }, (_, index) => (
                                        <li
                                            key={index}
                                            className={`page-item ${
                                                currentPage === index ? "active" : ""
                                            }`}
                                        >
                                            <button
                                                className={`page-link ${
                                                    currentPage === index
                                                        ? "bg-danger border-danger"
                                                        : "bg-dark text-white border-secondary"
                                                }`}
                                                onClick={() => goToPage(index)}
                                            >
                                                {index + 1}
                                            </button>
                                        </li>
                                    ))}

                                    {/* Nút Sau */}
                                    <li
                                        className={`page-item ${
                                            currentPage === totalPages - 1 ? "disabled" : ""
                                        }`}
                                    >
                                        <button
                                            className="page-link bg-dark text-white border-secondary"
                                            onClick={nextPage}
                                        >
                                            Sau <i className="fas fa-angle-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Pagination nhỏ cho mobile */}
                <div className="row mt-3 d-md-none">
                    <div className="col-12 text-center">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                className={`btn btn-sm rounded-circle mx-1 ${
                                    currentPage === index ? "btn-danger" : "btn-outline-secondary"
                                }`}
                                style={{ width: "40px", height: "40px" }}
                                onClick={() => goToPage(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gợi ý */}
                <div className="row mt-5">
                    <div className="col-12 text-center">
                        <p className="text-muted">
                            <i className="fas fa-star text-warning me-2"></i>
                            Nhấp vào bất kỳ phim nào để xem chi tiết và đặt vé
                        </p>
                    </div>
                </div>
            </div>

            {/* CSS nội tuyến */}
            <style>{`
        .min-vh-100 {
          min-height: 100vh;
        }

        .pagination .page-link:hover {
          background-color: #dc3545 !important;
          border-color: #dc3545 !important;
          color: white !important;
        }

        .alert-info {
          background: linear-gradient(45deg, #17a2b8, #138496);
          border: none;
          color: white;
        }
      `}</style>
        </div>
    );
};

export default MovieScreen;
