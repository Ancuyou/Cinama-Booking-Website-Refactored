import React from "react";
import Movie from "./Movie";

const MovieSlider = ({ movies = [], title, onMovieClick }) => {
    const safeMovies = Array.isArray(movies) ? movies : [];

    return (
        <div className="movie-slider-container py-4">
            {/* Tiêu đề khu vực */}
            {title && (
                <h3
                    className="text-center mb-4"
                    style={{ fontWeight: 700 }}
                >
                    {title}
                </h3>
            )}

            {/* Danh sách phim hiển thị theo hàng */}
            <div className="movie-grid">
                {safeMovies.length > 0 ? (
                    safeMovies.slice(0, 4).map((movie, idx) => (
                        <Movie
                            key={movie.maPhim || movie.id || idx}
                            movie={movie}
                            onClick={onMovieClick}
                        />
                    ))
                ) : (
                    <div className="text-center text-secondary fs-5 w-100">
                        Không có phim nào để hiển thị
                    </div>
                )}
            </div>

            {/* CSS inline */}
            <style>{`
        .movie-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.5rem;
        }

        /* Responsive cho từng kích thước màn hình */
        @media (min-width: 1200px) {
          .movie-grid > div {
            flex: 0 0 calc(25% - 1.5rem); /* 4 card / hàng */
          }
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .movie-grid > div {
            flex: 0 0 calc(33.333% - 1.5rem); /* 3 card */
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .movie-grid > div {
            flex: 0 0 calc(50% - 1.5rem); /* 2 card */
          }
        }

        @media (max-width: 767px) {
          .movie-grid > div {
            flex: 0 0 100%; /* 1 card */
          }
        }
      `}</style>
        </div>
    );
};

export default MovieSlider;
