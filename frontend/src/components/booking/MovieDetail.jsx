import React, { useState, useEffect } from 'react';
import movieService from '../../services/movieService';
import scheduleService from '../../services/scheduleService';
import MovieReviews from '../home/MovieReview';

const MovieDetail = ({ movieId, onShowtimeSelect, onMovieSelect }) => {
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (movieId) {
      fetchMovieData();
    }
  }, [movieId]);

  useEffect(() => {
    if (movie && movie.listSuatChieu) {
      // Lọc chỉ hiển thị các suất chiếu hợp lệ (sau hiện tại + 15 phút)
      const now = new Date();
      const validTime = new Date(now.getTime() + 15 * 60000); // Thêm 15 phút
      
      const validShowtimes = movie.listSuatChieu.filter(showtime => {
        const showtimeDate = new Date(showtime.thoiGianBatDau);
        return showtimeDate > validTime;
      });
      
      setShowtimes(validShowtimes);
    }
  }, [movie]);

  const fetchMovieData = async () => {
    setLoading(true);
    const result = await movieService.getMovieById(movieId);
    if (result.success) {
      setMovie(result.data);
      // Lọc suất chiếu hợp lệ ngay khi fetch
      if (result.data.listSuatChieu) {
        const now = new Date();
        const validTime = new Date(now.getTime() + 15 * 60000); // Thêm 15 phút
        
        const validShowtimes = result.data.listSuatChieu.filter(showtime => {
          const showtimeDate = new Date(showtime.thoiGianBatDau);
          return showtimeDate > validTime;
        });
        
        setShowtimes(validShowtimes);
      }
    }
    setLoading(false);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="alert alert-warning text-center">
        Không tìm thấy thông tin phim
      </div>
    );
  }

  return (
    <div className="movie-detail">
      <div className="row">
        {/* Movie Poster */}
        <div className="col-md-4">
          <div className="movie-poster">
            <img 
              src={movie.hinhAnh || '/images/default-movie.jpg'} 
              alt={movie.tenPhim}
              className="img-fluid rounded shadow"
              style={{ width: '100%', height: '500px', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Movie Info */}
        <div className="col-md-8">
          <div className="movie-info">
            <h1 className="movie-title text-primary mb-3">{movie.tenPhim}</h1>
            
            <div className="movie-meta mb-4">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Thể loại:</strong> {
                    movie.listTheLoai && movie.listTheLoai.length > 0 
                      ? movie.listTheLoai.map(tl => tl.tenTheLoai).join(', ')
                      : 'Chưa cập nhật'
                  }</p>
                  <p><strong>Thời lượng:</strong> {formatDuration(movie.thoiLuong)}</p>
                  <p><strong>Ngày khởi chiếu:</strong> {new Date(movie.ngayKhoiChieu).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Độ tuổi:</strong> {movie.tuoi}+</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Đạo diễn:</strong> {movie.daoDien || 'Chưa cập nhật'}</p>
                  <p><strong>Diễn viên:</strong> {movie.dienVien || 'Chưa cập nhật'}</p>
                  <p><strong>Trạng thái:</strong> <span className="badge bg-success">{movie.trangThai}</span></p>
                </div>
              </div>
            </div>

            <div className="movie-description mb-4">
              <h5>Mô tả</h5>
              <p className="text-muted">{movie.moTa || 'Chưa có mô tả'}</p>
            </div>

            {/* Trailer */}
            {movie.trailerURL && (
              <div className="movie-trailer mb-4">
                <h5>Trailer</h5>
                <div className="ratio ratio-16x9">
                  <iframe
                    src={movie.trailerURL}
                    title={`${movie.tenPhim} Trailer`}
                    allowFullScreen
                    className="rounded"
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Showtime Selection */}
      <div className="showtime-section mt-5">
        <h3 className="text-primary mb-4">Danh sách suất chiếu</h3>

        {/* Showtime List */}
        <div className="showtime-list">
          {showtimes.length === 0  ? (
            <div className="alert alert-info">
              Hiện tại chưa có suất chiếu nào cho phim này
            </div>
          ) : (
            <div className="row">
              {showtimes.map((showtime) => (
                <div key={showtime.maSuatChieu} className="col-md-3 col-sm-4 col-6 mb-3">
                  <div className="card h-100 showtime-card">
                    <div className="card-body text-center">
                      <h6 className="card-title text-primary">
                        {formatTime(showtime.thoiGianBatDau)}
                      </h6>
                      <p className="card-text small text-muted mb-2">
                        {formatDate(showtime.thoiGianBatDau)}
                      </p>
                      <p className="card-text small text-muted mb-2">
                        {showtime.phongChieu?.tenPhong}
                      </p>
                      <p className="card-text small text-success mb-3">
                        Giá: {showtime.donGiaCoSo?.toLocaleString('vi-VN')}đ
                      </p>
                      
                      <div className="seat-info mb-3">
                        <small className="text-info">
                          {showtime.phongChieu?.soLuongGhe || 0} ghế
                        </small>
                      </div>

                      <button
                        className="btn btn-primary btn-sm w-100"
                        onClick={() => {
                          console.log('Showtime selected:', showtime);
                          onMovieSelect(movie);
                          onShowtimeSelect(showtime);
                        }}
                      >
                        Chọn suất
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Movie Reviews Section */}
      {movie && (
        <div className="container mt-5">
          <div className="row">
            <div className="col-12">
              <MovieReviews maPhim={movie.maPhim} tenPhim={movie.tenPhim} />
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .showtime-card {
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        
        .showtime-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .movie-poster img {
          transition: transform 0.3s;
        }

        .movie-poster:hover img {
          transform: scale(1.05);
        }

        .date-selection .btn {
          min-width: 80px;
        }
      `}</style>
    </div>
  );
};

export default MovieDetail;