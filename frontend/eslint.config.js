import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Play, Ticket, Film, Clock, Calendar } from 'lucide-react';

const MovieHome = () => {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch movies from Spring Boot API
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:8080/api/movies');
        setMovies(response.data);
        setIsLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách phim. Vui lòng thử lại sau.');
        setIsLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="text-center text-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white d-flex flex-column">
      {/* Navigation */}
      <nav className="navbar navbar-dark bg-primary fixed-top">
        <div className="container-fluid">
          <div className="navbar-brand d-flex align-items-center">
            <Film className="me-2" size={28} />
            <span className="fw-bold fs-4">CinemaVN</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-light btn-sm">Đăng nhập</button>
            <button className="btn btn-light btn-sm">Đăng ký</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {movies.length > 0 && (
        <div 
          className="position-relative"
          style={{
            height: '70vh',
            background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${movies[0].backdrop})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: '56px' // Adjust for fixed navbar
          }}
        >
          <div className="container h-100 d-flex align-items-center">
            <div className="row w-100">
              <div className="col-lg-8 col-md-10">
                <h1 className="display-3 fw-bold mb-4">{movies[0].title}</h1>
                <div className="d-flex align-items-center mb-4 gap-3">
                  <span className="badge bg-primary">{movies[0].genre}</span>
                  <div className="d-flex align-items-center">
                    <Star className="text-warning me-1" size={20} fill="currentColor" />
                    <span>{movies[0].rating}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <Clock className="me-1" size={20} />
                    <span>{movies[0].duration} phút</span>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <button className="btn btn-primary btn-lg">
                    <Ticket className="me-2" size={20} />
                    Đặt vé - {formatVND(movies[0].price)}
                  </button>
                  <button className="btn btn-outline-light btn-lg">
                    <Play className="me-2" size={20} />
                    Trailer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking */}
      <div className="py-4 bg-primary">
        <div className="container">
          <div className="bg-white rounded p-4 text-dark">
            <h4 className="text-center mb-4 text-primary">🎬 Đặt vé nhanh</h4>
            <div className="row g-3">
              <div className="col-lg-3 col-md-6">
                <select className="form-select">
                  <option>Chọn phim</option>
                  {movies.map(movie => (
                    <option key={movie.id}>{movie.title}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-3 col-md-6">
                <select className="form-select">
                  <option>Chọn rạp</option>
                  <option>CGV Vincom</option>
                  <option>Lotte Cinema</option>
                  <option>Galaxy Cinema</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <input type="date" className="form-control" />
              </div>
              <div className="col-lg-2 col-md-6">
                <select className="form-select">
                  <option>Giờ chiếu</option>
                  <option>10:00</option>
                  <option>13:30</option>
                  <option>17:00</option>
                  <option>20:30</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-12">
                <button className="btn btn-primary w-100">
                  <Ticket className="me-1" size={18} />
                  Đặt vé
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="py-5 bg-dark flex-grow-1">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-2">🎭 Phim Đang Chiếu</h2>
            <p className="text-muted">Những bộ phim hot nhất hiện tại</p>
          </div>
          <div className="row g-4">
            {movies.map(movie => (
              <div key={movie.id} className="col-lg-4 col-md-6 col-sm-12">
                <div 
                  className={`card bg-secondary h-100 border-0 shadow-sm movie-card ${
                    selectedMovie?.id === movie.id ? 'border-primary border-3' : ''
                  }`}
                  style={{ transition: 'transform 0.3s' }}
                  onClick={() => setSelectedMovie(movie)}
                >
                  <div className="position-relative overflow-hidden">
                    <img 
                      src={movie.poster} 
                      className="card-img-top"
                      alt={movie.title}
                      style={{ height: '350px', objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 end-0 m-2">
                      <span className="badge bg-warning text-dark fw-bold">
                        <Star size={14} fill="currentColor" />
                        {movie.rating}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title text-white">{movie.title}</h5>
                    <p className="text-muted small mb-2">
                      <span className="me-2">{movie.genre}</span>
                      <Clock size={14} className="me-1" />
                      {movie.duration}p
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-primary fw-bold fs-6">{formatVND(movie.price)}</span>
                      <button className="btn btn-primary btn-sm">
                        <Ticket size={16} className="me-1" />
                        Đặt vé
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedMovie(null)}
        >
          <div 
            className="bg-secondary rounded p-4"
            style={{ maxWidth: '600px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="text-white mb-0">{selectedMovie.title}</h4>
              <button 
                className="btn-close btn-close-white" 
                onClick={() => setSelectedMovie(null)}
              ></button>
            </div>
            <img 
              src={selectedMovie.poster} 
              alt={selectedMovie.title}
              className="img-fluid rounded mb-3"
              style={{ maxHeight: '250px', objectFit: 'cover', width: '100%' }}
            />
            <div className="d-flex align-items-center mb-3 gap-3">
              <span className="badge bg-primary">{selectedMovie.genre}</span>
              <div className="d-flex align-items-center text-white">
                <Star className="text-warning me-1" size={16} fill="currentColor" />
                <span>{selectedMovie.rating}</span>
              </div>
              <div className="d-flex align-items-center text-white">
                <Clock className="me-1" size={16} />
                <span>{selectedMovie.duration} phút</span>
              </div>
            </div>
            <p className="text-primary fw-bold fs-5 mb-3">{formatVND(selectedMovie.price)}</p>
            <div className="d-flex gap-2">
              <button className="btn btn-primary flex-fill">
                <Ticket className="me-1" size={18} />
                Đặt vé ngay
              </button>
              <button className="btn btn-outline-light">
                <Play size={18} />
                Trailer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-primary py-4 text-center mt-auto">
        <div className="container">
          <div className="d-flex align-items-center justify-content-center mb-2">
            <Film className="me-2" size={24} />
            <h5 className="mb-0">CinemaVN</h5>
          </div>
          <p className="mb-0 opacity-75">Hệ thống rạp chiếu phim hàng đầu Việt Nam</p>
          <small className="opacity-50">© 2025 CinemaVN. Hotline: 1900 123 456</small>
        </div>
      </footer>
    </div>
  );
};

export default MovieHome;