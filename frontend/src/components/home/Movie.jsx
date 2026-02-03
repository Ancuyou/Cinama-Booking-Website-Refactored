import React from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Info, Clock, Star, Film, Play, CalendarCheck } from "lucide-react";
import {useToast} from "../common/Toast.jsx";

const Movie = ({ movie, onClick = () => {} }) => {
    const navigate = useNavigate()
    const [showModal, setShowModal] = React.useState(false);
    const {showError, showSuccess} = useToast();

    const handleBookTicket = (e) => {
        e?.stopPropagation();
        navigate(`/booking/${movie.maPhim || movie.id}`);
    };

    // Hiển thị độ tuổi
    const ratingBadge = (tuoi) => {
        if (!tuoi) return { color: "bg-secondary", text: "P" };
        if (tuoi >= 18) return { color: "bg-danger", text: "18+" };
        if (tuoi >= 16) return { color: "bg-warning", text: "16+" };
        if (tuoi >= 13) return { color: "bg-primary", text: "13+" };
        return { color: "bg-success", text: "P" };
    };
    const badge = ratingBadge(movie.tuoi);

    // ✅ Lấy danh sách thể loại (có thể nhiều)
    const theLoaiText =
        movie.listTheLoai && movie.listTheLoai.length > 0
            ? movie.listTheLoai.map((t) => t.tenTheLoai).join(", ")
            : "Không rõ";

    const danhGiaText = () => {
        let avgRating = 0;
        if (movie.danhGiaPhims && movie.danhGiaPhims.length > 0) {
            movie.danhGiaPhims.map((d) => {
                avgRating += d.rating;
            })
            avgRating = avgRating / movie.danhGiaPhims.length;
            return `${avgRating.toFixed(1)}/5`;
        }
        return "Chưa có đánh giá";
    }

    const handleTrailer = (e) => {
        e.stopPropagation();
        console.log("hello")
        const url = movie.trailerURL || movie.trailerurl || movie.trailerUrl;
        if (url) setShowModal(true);
        else showError("Phim này chưa có trailer.");
    };

    return (
        <div className="movie-card-wrapper d-flex justify-content-center">
            <div
                className="card movie-card shadow-sm border-0"
                onClick={handleBookTicket}
                style={{ cursor: 'pointer' }}
            >
                {/* Poster */}
                <div className="poster-wrapper position-relative">
                    <img
                        src={movie.hinhAnh || movie.img}
                        alt={movie.tenPhim || movie.title}
                        className="poster-img"
                    />
                    <span className={`badge ${badge.color} age-badge`}>{badge.text}</span>
                    <div className="d-flex align-items-center rating-badge">
                        <Star size={14} className="me-1 text-warning" fill="#ffc107" stroke="#ffc107" />
                        <span>
                {danhGiaText()}
              </span>
                    </div>
                </div>

                {/* Nội dung */}
                <div className="card-body d-flex flex-column justify-content-between">
                    <h5
                        className="movie-title fw-bold text-truncate mb-2 mt-0"
                        title={movie.tenPhim || movie.title}
                    >
                        {movie.tenPhim || movie.title}
                    </h5>

                    {/* --- Thông tin chi tiết --- */}
                    <div className="movie-info text-muted small mb-3">
                        {/* Thể loại */}
                        <div className="d-flex align-items-center mb-1">
                            <Film size={14} className="me-1 text-danger" />
                            <span>{theLoaiText}</span>
                        </div>

                        {/* Thời lượng */}
                        <div className="d-flex align-items-center mb-1">
                            <Clock size={14} className="me-1 text-info" />
                            <span>{movie.thoiLuong ? `${movie.thoiLuong} phút` : "Đang cập nhật"}</span>
                        </div>

                        <div className="d-flex align-items-center mb-1">
                            <CalendarCheck size={14} className="me-1 text-warning" />
                            <span>
                        {movie.ngayKhoiChieu ? `${new Date(movie.ngayKhoiChieu).toLocaleDateString('vi-VN')}` : "Đang cập nhật"}
                  </span>
                        </div>
                    </div>

                    {/* --- Nút thao tác --- */}
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-book flex-fill"
                            onClick={handleBookTicket}
                        >
                            <Ticket size={16} className="me-1" />
                            Đặt vé
                        </button>
                        <button
                            className="btn btn-detail flex-fill d-flex justify-content-center align-items-center"
                            onClick={handleTrailer}
                        >
                            <Play size={16} className="me-1" />
                            Xem trailer
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div
                    className="modal fade show"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered modal-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Trailer: {movie.tenPhim}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <div className="ratio ratio-16x9">
                                    <iframe width="560" height="315"
                                            src={
                                                movie.trailerURL?.replace("watch?v=", "embed/") + "&autoplay=1" ||
                                                "https://www.youtube.com/embed/dQw4w9WgXcQ"
                                            }
                                            title="Trailer"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS nội tuyến */}
            <style>{`
        .movie-card {
          width: 100%;
          max-width: 300px;
          border-radius: 14px;
          background: #1e2128;
          color: #fff;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .movie-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }

        .poster-wrapper {
          width: 100%;
          height: 360px;
          overflow: hidden;
          border-top-left-radius: 14px;
          border-top-right-radius: 14px;
          background: #2b2f38;
        }

        .poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .movie-card:hover .poster-img {
          transform: scale(1.05);
        }

        .age-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 0.8rem;
          padding: 6px 10px;
          border-radius: 6px;
        }
        
        .rating-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.6);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            color: #fff;
            }

        .movie-title {
          font-size: 1rem;
          color: #fff;
          line-height: 1.3;
        }

        .movie-info span {
          color: #bbb;
        }

        .btn-book {
          background-color: #ff4b2b;
          border: none;
          color: white;
          font-weight: 500;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .btn-book:hover {
          background-color: #ff6b47;
        }

        .btn-detail {
          border: 1px solid #ff4b2b;
          color: #ff4b2b;
          font-weight: 500;
          border-radius: 8px;
          background: transparent;
          transition: all 0.2s ease;
        }

        .btn-detail:hover {
          background-color: #ff4b2b;
          color: #fff;
        }
      `}</style>
        </div>
    );
};

export default Movie;
