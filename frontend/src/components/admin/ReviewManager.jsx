import React, { useState, useEffect } from 'react';
import reviewService from '../../services/reviewService';
import { useToast } from '../common/Toast';

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allReviews, setAllReviews] = useState([]); // Để tính thống kê

  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState(''); // Query thực tế để gửi API

  useEffect(() => {
    fetchReviews();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    // Fetch all reviews for statistics
    fetchAllReviewsForStats();
  }, []);

  const fetchAllReviewsForStats = async () => {
    try {
      const result = await reviewService.getAllReviews();
      if (result.success) {
        setAllReviews(result.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const result = await reviewService.getReviewsPaginated(currentPage, searchQuery);
      if (result.success) {
        console.log('Fetched reviews:', result.data);
        setReviews(result.data.currentReview || []);
        setTotalPages(result.data.totalPages || 1);
      } else {
        setReviews([]);
        setTotalPages(1);
        showError(result.message || 'Không thể tải danh sách đánh giá');
      }
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
      setReviews([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      const result = await reviewService.deleteReview(id);
      if (result.success) {
        showSuccess('Xóa đánh giá thành công!');
        fetchReviews();
        fetchAllReviewsForStats(); // Cập nhật lại thống kê
      } else {
        showError(result.message || 'Không thể xóa đánh giá!');
      }
    } catch (error) {
      console.error('Lỗi khi xóa đánh giá:', error);
      showError('Có lỗi xảy ra khi xóa đánh giá!');
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value); // Set query để trigger useEffect
    console.log('Searching for:', value);
    setCurrentPage(1); // Reset về trang 1 khi search
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi bi-star${i <= rating ? '-fill' : ''}`}
          style={{ color: i <= rating ? '#ffc107' : '#ddd' }}
        ></i>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Filter chỉ theo rating (search đã xử lý ở backend)
  const filteredReviews = reviews.filter((review) => {
    const matchesRating = 
      filterRating === 'all' || 
      Math.floor(review.rating) === parseInt(filterRating);

    return matchesRating;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="review-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <i className="bi bi-chat-left-text me-2"></i>
          Quản lý đánh giá phim
        </h4>
        <button className="btn btn-primary" onClick={fetchReviews}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm theo phim, người dùng, nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchTerm);
                    }
                  }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSearch(searchTerm)}
                  title="Tìm kiếm"
                >
                  <i className="bi bi-search me-1"></i>
                  Tìm
                </button>
                {searchTerm && (
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                      handleSearch('');
                    }}
                    title="Xóa tìm kiếm"
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
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-primary mb-0">{allReviews.length}</h3>
              <p className="text-muted mb-0">Tổng đánh giá</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-success mb-0">
                {allReviews.filter(r => r.rating >= 4).length}
              </h3>
              <p className="text-muted mb-0">Đánh giá tốt (≥4⭐)</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-warning mb-0">
                {allReviews.filter(r => r.rating >= 3 && r.rating < 4).length}
              </h3>
              <p className="text-muted mb-0">Trung bình (3-4⭐)</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h3 className="text-danger mb-0">
                {allReviews.filter(r => r.rating < 3).length}
              </h3>
              <p className="text-muted mb-0">Kém (&lt;3⭐)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">Không tìm thấy đánh giá nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '20%' }}>Phim</th>
                    <th style={{ width: '15%' }}>Người đánh giá</th>
                    <th style={{ width: '10%' }}>Đánh giá</th>
                    <th style={{ width: '35%' }}>Nhận xét</th>
                    <th style={{ width: '10%' }}>Ngày tạo</th>
                    <th style={{ width: '10%' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <strong>{review.tenPhim}</strong>
                      </td>
                      <td>
                        <div>
                          <div className="fw-semibold">{review.fullName}</div>
                          <small className="text-muted">{review.userEmail}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-warning text-dark me-2">
                            {review.rating.toFixed(1)}
                          </span>
                          <div>{renderStars(Math.floor(review.rating))}</div>
                        </div>
                      </td>
                      <td>
                        <div 
                          className="text-truncate" 
                          style={{ maxWidth: '300px' }}
                          title={review.comment}
                        >
                          {review.comment}
                        </div>
                      </td>
                      <td>
                        <small>{formatDate(review.createdAt)}</small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteReview(review.id)}
                          title="Xóa đánh giá"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  Trang {currentPage} / {totalPages}
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    
                    {/* Hiển thị các số trang */}
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Chỉ hiện 5 trang: current-2, current-1, current, current+1, current+2
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <li
                            key={page}
                            className={`page-item ${currentPage === page ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <li key={page} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }
                      return null;
                    })}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .table-hover tbody tr:hover {
          background-color: #f8f9fa;
        }

        .badge {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default ReviewManager;
