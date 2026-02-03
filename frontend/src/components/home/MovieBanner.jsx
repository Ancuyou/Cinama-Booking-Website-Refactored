import React, { useState, useEffect } from "react";
import { Star, Play, Clock, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {movieService} from "../../services/index.js";
import {useToast} from "../common/Toast.jsx";

const Banner = ({ movies = []}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const navigate = useNavigate();
    const [SliderMovies, setSliderMovies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const {showError, showSuccess} = useToast()
    const [selectedMovie, setSelectedMovie] = useState(null);

    const safeMovies = Array.isArray(movies) ? movies : [];

    const avgRating = (ratings) => {
        if (!ratings || ratings.length === 0) return 0;
        const total = ratings.reduce((sum, r) => sum + r.rating, 0);
        return (total / ratings.length).toFixed(1);
    };

    useEffect(() => {
        const fetchSliderMovies = async () => {
            const result = await Promise.all(
                safeMovies.map(async (item) => {
                    const match = item.tenCauHinh.match(/[0-9a-fA-F-]{36}/);
                    const id = match ? match[0] : null;
                    const movie = await movieService.getMovieById(id);
                    const ratings = movie?.data?.danhGiaPhims || [];
                    return {
                        id: item.maCauHinh,
                        maPhim: movie?.data?.maPhim,
                        hinhAnh: item.giaTri,
                        tenPhim: movie?.data?.tenPhim,
                        thoiLuong: movie?.data?.thoiLuong,
                        moTa: movie?.data?.moTa,
                        trailerURL: movie?.data?.trailerURL,
                        rating: avgRating(ratings),
                        nam: movie?.data?.nam,
                        theLoai: movie?.data?.listTheLoai,
                        ngayKhoiChieu: movie?.data?.ngayKhoiChieu,
                        trangThai: movie?.data?.trangThai,
                    };
                })
            );
            setSliderMovies(result);
        };
        fetchSliderMovies();
    }, [safeMovies]);

    useEffect(() => {
        console.log("fetchSliderMovies", SliderMovies);
    }, [SliderMovies]);



    // Auto slide 4s
    useEffect(() => {
        setCurrentIndex(0);
    }, [SliderMovies.length]);

    // Auto slide 4s (based on slides length)
    useEffect(() => {
        if (!isAutoPlay || SliderMovies.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % SliderMovies.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [isAutoPlay, currentIndex, SliderMovies.length]);

    const handlePrev = () => {
        if (SliderMovies.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + SliderMovies.length) % SliderMovies.length);
        setIsAutoPlay(false);
        setTimeout(() => setIsAutoPlay(true), 6000);
    };

    const handleNext = () => {
        if (SliderMovies.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % SliderMovies.length);
        setIsAutoPlay(false);
        setTimeout(() => setIsAutoPlay(true), 6000);
    };

    const goToSlide = (index) => {
        if (SliderMovies.length === 0) return;
        setCurrentIndex(index);
        setIsAutoPlay(false);
        setTimeout(() => setIsAutoPlay(true), 6000);
    };

    const movie = SliderMovies[currentIndex];
    if (!movie) return null;

    const handleBooking = () => {
        navigate(`/booking/${movie.maPhim || movie.id}`);
    };

    const handleTrailer = () => {
        const url = movie.trailerURL || movie.trailerurl || movie.trailerUrl || movie.trailerUrl;
        setSelectedMovie(movie);
        console.log(movie);
        if (url) setShowModal(true);
        else showError("Phim này chưa có trailer.");
    };

    const handleCloseModal = () => {
        setShowModal(false)
    }

    return (
        <section className="movie-banner">
            {/* Background with gradient overlay */}
            <div className="banner-wrapper">
                <div
                    className="banner-bg"
                    key={currentIndex}
                    style={{
                        backgroundImage: `url(${movie.hinhAnh})`,
                    }}
                />
                <div className="banner-gradient" />
            </div>

            {/* Content Container */}
            <div className="banner-content-wrapper">
                <div className="container">
                    <div className="row align-items-center h-100">
                        <div className="col-lg-7">
                            <div className="banner-content">
                                {/* Badge */}
                                <div className="mb-3">
                  <span className="movie-badge">
                    <span className="badge-dot"></span>
                      {movie.trangThai.toString().toUpperCase()}
                  </span>
                                </div>

                                {/* Title with animation */}
                                <h1 className="movie-title">{movie.tenPhim || "Tên phim"}</h1>

                                {/* Movie Info */}
                                <div className="movie-meta">
                                    <div className="meta-item">
                                        <Star size={18} fill="#ffc107" stroke="#ffc107" />
                                        <span>
                        {
                            (movie.rating > 0) ? (
                                <>
                                    {movie.rating} / 5
                                </>
                            ) : (
                                "Chưa có đánh giá"
                            )
                        }
                    </span>
                                    </div>
                                    <div className="meta-divider"></div>
                                    <div className="meta-item">
                                        <Clock size={18} />
                                        <span>{movie.thoiLuong || "120"} phút</span>
                                    </div>
                                    <div className="meta-divider"></div>
                                    <div className="meta-item">
                                        <Calendar size={18} />
                                        <span>{new Date(movie.ngayKhoiChieu).toLocaleDateString("vi-VN") || new Date().getFullYear()}</span>
                                    </div>
                                </div>

                                {/* Genre Tags */}
                                {movie.theLoai && (
                                    <div className="genre-tags" style={{
                                        cursor: 'default'
                                    }}>
                                        {movie?.theLoai?.slice(0, 3).map((genre, idx) => (
                                            <span key={genre.maTheLoai || idx} className="genre-tag">
                            {genre.tenTheLoai.trim()}
                          </span>
                                        ))}

                                    </div>
                                )}

                                {/* Description */}
                                <p className="movie-description">
                                    {movie.moTa?.length > 200
                                        ? movie.moTa.slice(0, 200) + "..."
                                        : movie.moTa || "Một bộ phim đầy cảm xúc và hấp dẫn, mang đến trải nghiệm điện ảnh tuyệt vời cho khán giả."}
                                </p>

                                {/* Action Buttons */}
                                <div className="banner-actions">
                                    <button className="btn-primary-action" onClick={handleBooking}>
                                        <Play size={20} fill="white" />
                                        <span>Đặt vé ngay</span>
                                    </button>
                                    <button className="btn-secondary-action" onClick={handleTrailer}>
                                        <Play size={20} />
                                        <span>Xem trailer</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <button className="banner-nav banner-nav-left" onClick={handlePrev} aria-label="Previous">
                <ChevronLeft size={32} />
            </button>
            <button className="banner-nav banner-nav-right" onClick={handleNext} aria-label="Next">
                <ChevronRight size={32} />
            </button>

            {/* Indicators */}
            <div className="banner-indicators">
                {SliderMovies.map((_, idx) => (
                    <button
                        key={idx}
                        className={`indicator ${idx === currentIndex ? "active" : ""}`}
                        onClick={() => goToSlide(idx)}
                        aria-label={`Slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Modal for Trailer can be implemented here} */}
            {showModal ? (
                <div
                    className="modal fade show"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={handleCloseModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered modal-xl"
                        onClick={(e) => e.stopPropagation()} // tránh click đóng khi bấm trong modal
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Trailer: {selectedMovie.tenPhim}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body p-0">
                                <div className="ratio ratio-16x9">
                                    {/*<iframe width="560" height="315"*/}
                                    {/*        src="https://www.youtube.com/embed/4Fhs9-B9IHo?si=ruqFtIo4MsLQL9t3&autoplay=1"*/}
                                    {/*        title="YouTube video player" frameBorder="0"*/}
                                    {/*        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"*/}
                                    {/*        referrerPolicy="strict-origin-when-cross-origin"*/}
                                    {/*        allowFullScreen></iframe>*/}
                                    <iframe width="560" height="315"
                                            src={
                                                selectedMovie.trailerURL?.replace("watch?v=", "embed/") + "&autoplay=1" ||
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
            ) : null
            }
            <style>{`
        .movie-banner {
          position: relative;
          height: 600px;
          width: 100%;
          overflow: hidden;
          background: #000;
        }

        /* Background Wrapper */
        .banner-wrapper {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .banner-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center top;
          background-repeat: no-repeat;
          animation: zoomIn 5s ease-out forwards;
          transform-origin: center;
        }

        .banner-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.95) 0%,
            rgba(0, 0, 0, 0.8) 40%,
            rgba(0, 0, 0, 0.4) 70%,
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 1;
        }
        
        .movie-banner:hover .banner-gradient {
          opacity: 1;
        }

      

        /* Content Wrapper */
        .banner-content-wrapper {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 40px 0;
        }

        .banner-content {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .movie-banner:hover .banner-content {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Movie Badge */
        .movie-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(220, 38, 38, 0.9);
          backdrop-filter: blur(10px);
          color: white;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 1px;
          border-radius: 30px;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        /* Movie Title */
        .movie-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: white;
          margin: 20px 0;
          line-height: 1.2;
          text-shadow: 2px 2px 20px rgba(0, 0, 0, 0.8);
          letter-spacing: -1px;
        }

        /* Movie Meta */
        .movie-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 15px;
          font-weight: 500;
        }

        .meta-item svg {
          color: #ffc107;
        }

        .meta-divider {
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
        }

        /* Genre Tags */
        .genre-tags {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .genre-tag {
          padding: 6px 16px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        /* Description */
        .movie-description {
          color: rgba(255, 255, 255, 0.85);
          font-size: 16px;
          line-height: 1.7;
          margin-bottom: 30px;
          max-width: 600px;
          text-shadow: 1px 1px 10px rgba(0, 0, 0, 0.5);
        }

        /* Action Buttons */
        .banner-actions {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .btn-primary-action {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
        }

        .btn-primary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(220, 38, 38, 0.6);
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
        }

        .btn-secondary-action {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary-action:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        /* Navigation Arrows */
        .banner-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }

        .banner-nav:hover {
          background: rgba(220, 38, 38, 0.9);
          transform: translateY(-50%) scale(1.1);
        }

        .banner-nav-left {
          left: 30px;
        }

        .banner-nav-right {
          right: 30px;
        }

        /* Indicators */
        .banner-indicators {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 3;
        }

        .indicator {
          width: 40px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .indicator:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .indicator.active {
          background: #dc2626;
          width: 50px;
        }

        /* Responsive Design */
        @media (max-width: 992px) {
          .movie-banner {
            height: 500px;
          }

          .movie-title {
            font-size: 2.5rem;
          }

          .banner-gradient {
            background: linear-gradient(
              to top,
              rgba(0, 0, 0, 0.95) 0%,
              rgba(0, 0, 0, 0.7) 50%,
              transparent 100%
            );
          }

          .banner-content-wrapper {
            align-items: flex-end;
          }
        }

        @media (max-width: 768px) {
          .movie-banner {
            height: 450px;
          }

          .movie-title {
            font-size: 2rem;
          }

          .banner-nav {
            width: 44px;
            height: 44px;
          }

          .banner-nav-left {
            left: 15px;
          }

          .banner-nav-right {
            right: 15px;
          }

          .btn-primary-action,
          .btn-secondary-action {
            padding: 12px 24px;
            font-size: 14px;
          }
        }
      `}</style>
        </section>
    );
};

export default Banner;
