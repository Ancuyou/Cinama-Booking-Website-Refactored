import React, { useEffect, useState } from 'react';
import reviewService from '../services/reviewService';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchReviews = async () => {
      const result = await reviewService.getMyReviews();
      if (result.success) {
        setReviews(result.data);
        processTopMovies(result.data);
      } else {
        setError(result.message);
      }
      setLoading(false);
    };

    fetchReviews();
  }, []);

  const processTopMovies = (reviewsData) => {
    const movieMap = {};
    reviewsData.forEach(review => {
      const { maPhim, tenPhim, rating } = review;
      if (!movieMap[maPhim]) {
        movieMap[maPhim] = { tenPhim, ratings: [], count: 0 };
      }
      movieMap[maPhim].ratings.push(rating);
      movieMap[maPhim].count += 1;
    });

    const moviesWithAvg = Object.keys(movieMap).map(maPhim => {
      const { tenPhim, ratings, count } = movieMap[maPhim];
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / count;
      return { maPhim, tenPhim, avgRating: parseFloat(avgRating.toFixed(1)), count };
    });

    moviesWithAvg.sort((a, b) => b.avgRating - a.avgRating);
    setTopMovies(moviesWithAvg.slice(0, 3));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="bi bi-star-fill text-warning"></i>);
    }
    if (hasHalfStar) {
      stars.push(<i key="half" className="bi bi-star-half text-warning"></i>);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="bi bi-star text-warning"></i>);
    }
    return stars;
  };

  // Filter and search logic
  const getFilteredReviews = () => {
    let filtered = [...reviews];

    // Search by movie name
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.tenPhim.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by rating
    if (filterRating !== 'all') {
      const ratingNum = parseInt(filterRating);
      filtered = filtered.filter(review => {
        const rating = Math.floor(review.rating);
        return rating === ratingNum;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return filtered;
  };

  // Pagination logic
  const filteredReviews = getFilteredReviews();
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRating]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          <i className="bi bi-chevron-left"></i>
        </button>
      </li>
    );

    // First page
    if (startPage > 1) {
      pages.push(
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
        </li>
      );
      if (startPage > 2) {
        pages.push(<li key="dots1" className="page-item disabled"><span className="page-link">...</span></li>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
        </li>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<li key="dots2" className="page-item disabled"><span className="page-link">...</span></li>);
      }
      pages.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
        </li>
      );
    }

    // Next button
    pages.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </li>
    );

    return (
      <nav aria-label="Page navigation">
        <ul className="pagination justify-content-center mb-0">
          {pages}
        </ul>
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
        <div className="bg-primary text-white py-4 mb-4">
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <h2 className="mb-0">
                            <i className="bi bi-film me-2"></i>
                            Lịch sử đánh giá của tôi
                        </h2>
                        <p className="mb-0 opacity-75">
                            Quản lý và xem thông tin lịch sử đánh giá
                        </p>
                    </div>
                </div>
            </div>
        </div>

      {topMovies.length > 0 && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-primary text-white">
                <h2 className="h4 mb-0">
                  <i className="bi bi-trophy-fill me-2"></i>
                  Top 3 Phim yêu thích nhất
                </h2>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {topMovies.map((movie, index) => (
                    <div key={movie.maPhim} className="col-md-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body text-center">
                          <div className="mb-3">
                            {index === 0 && <i className="bi bi-trophy-fill text-warning fs-1"></i>}
                            {index === 1 && <i className="bi bi-award-fill text-secondary fs-1"></i>}
                            {index === 2 && <i className="bi bi-award text-danger fs-1"></i>}
                          </div>
                          <h5 className="card-title text-truncate" title={movie.tenPhim}>
                            {movie.tenPhim}
                          </h5>
                          <div className="mb-2">
                            {renderStars(movie.avgRating)}
                          </div>
                          <p className="card-text mb-1">
                            <strong className="text-primary fs-4">{movie.avgRating}</strong>
                            <span className="text-muted"> / 5.0</span>
                          </p>
                          <p className="card-text text-muted small">
                            <i className="bi bi-chat-left-text me-1"></i>
                            {movie.count} đánh giá
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-success text-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <h2 className="h4 mb-0">
                  <i className="bi bi-list-stars me-2"></i>
                  Tất cả đánh giá ({filteredReviews.length})
                </h2>
              </div>
            </div>
            
            {/* Search and Filter Section */}
            <div className="card-body bg-light border-bottom">
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm theo tên phim..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                  >
                    <option value="all">Tất cả đánh giá</option>
                    <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                    <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                    <option value="3">⭐⭐⭐ (3 sao)</option>
                    <option value="2">⭐⭐ (2 sao)</option>
                    <option value="1">⭐ (1 sao)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
                  <p>{searchTerm || filterRating !== 'all' ? 'Không tìm thấy đánh giá phù hợp' : 'Bạn chưa có đánh giá nào'}</p>
                </div>
              ) : (
                <>
                  <div className="list-group list-group-flush">
                    {currentReviews.map((review, index) => {
                      const globalIndex = indexOfFirstItem + index + 1;
                      return (
                        <div key={review.id} className="list-group-item list-group-item-action">
                          <div className="d-flex w-100 justify-content-between align-items-start">
                            <div className="d-flex align-items-start flex-grow-1">
                              <div className="me-3">
                                <span className="badge bg-primary rounded-circle" style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                  {globalIndex}
                                </span>
                              </div>
                              <div className="flex-grow-1">
                                <h5 className="mb-2">
                                  <i className="bi bi-film me-2 text-primary"></i>
                                  {review.tenPhim}
                                </h5>
                                <div className="mb-2">
                                  {renderStars(review.rating)}
                                  <span className="ms-2 fw-bold text-primary">{review.rating.toFixed(1)}</span>
                                </div>
                                {review.comment && (
                                  <p className="mb-2 text-secondary">
                                    <i className="bi bi-chat-quote me-1"></i>
                                    {review.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                            <small className="text-muted text-nowrap ms-3">
                              <i className="bi bi-calendar3 me-1"></i>
                              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="card-footer bg-white">
                      <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <div className="text-muted small mb-2 mb-md-0">
                          Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredReviews.length)} trong tổng số {filteredReviews.length} đánh giá
                        </div>
                        {renderPagination()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyReviews;