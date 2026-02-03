import React, { useState, useEffect } from 'react';
import reviewService from '../../services/reviewService';
import { useToast } from '../common/Toast';
import { useAuth } from '../../context/AuthContext';

const MovieReviews = ({ maPhim, tenPhim }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [formData, setFormData] = useState({
        rating: 5,
        comment: '',
        maPhim: maPhim
    });
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0]
    });

    const { showSuccess, showError } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (maPhim) {
            fetchReviews();
        }
    }, [maPhim]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const result = await reviewService.getReviewsByMovieId(maPhim);
            if (result.success) {
                setReviews(result.data || []);
                calculateStats(result.data || []);
            } else {
                setReviews([]);
                calculateStats([]);
            }
        } catch (error) {
            console.error('Lỗi khi tải đánh giá:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (reviewsData) => {
        if (reviewsData.length === 0) {
            setStats({
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: [0, 0, 0, 0, 0]
            });
            return;
        }

        const totalRating = reviewsData.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / reviewsData.length;

        const distribution = [0, 0, 0, 0, 0];
        reviewsData.forEach(r => {
            const index = Math.floor(r.rating) - 1;
            if (index >= 0 && index < 5) {
                distribution[index]++;
            }
        });

        setStats({
            averageRating: avgRating,
            totalReviews: reviewsData.length,
            ratingDistribution: distribution
        });
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!user) {
            showError('Vui lòng đăng nhập để đánh giá!');
            return;
        }

        try {
            let result;
            if (editingReview) {
                result = await reviewService.updateReview(editingReview.id, formData);
                if (result.success) {
                    showSuccess('Cập nhật đánh giá thành công!');
                }
            } else {
                result = await reviewService.createReview({ ...formData, maPhim });
                if (result.success) {
                    showSuccess('Thêm đánh giá thành công!');
                }
            }

            if (result.success) {
                setShowReviewForm(false);
                setEditingReview(null);
                setFormData({ rating: 5, comment: '', maPhim });
                fetchReviews();
            } else {
                showError(result.message || 'Có lỗi xảy ra!');
            }
        } catch (error) {
            console.error('Lỗi khi gửi đánh giá:', error);
            showError('Có lỗi xảy ra khi gửi đánh giá!');
        }
    };

    const handleEditReview = (review) => {
        // Kiểm tra quyền sở hữu
        if (!user || user.username !== review.userName) {
            showError('Bạn không có quyền chỉnh sửa đánh giá này!');
            return;
        }

        setEditingReview(review);
        setFormData({
            rating: review.rating,
            comment: review.comment,
            maPhim: maPhim
        });
        setShowReviewForm(true);
    };

    const handleDeleteReview = async (id, review) => {
        // Kiểm tra quyền sở hữu
        if (!user || user.username !== review.userName) {
            showError('Bạn không có quyền xóa đánh giá này!');
            return;
        }

        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

        try {
            const result = await reviewService.deleteReview(id);
            if (result.success) {
                showSuccess('Xóa đánh giá thành công!');
                fetchReviews();
            } else {
                showError(result.message || 'Không thể xóa đánh giá!');
            }
        } catch (error) {
            console.error('Lỗi khi xóa đánh giá:', error);
            showError('Có lỗi xảy ra khi xóa đánh giá!');
        }
    };

    const renderStars = (rating, interactive = false, onChange = null) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const filled = i <= Math.floor(rating);
            const halfFilled = !filled && i - 0.5 <= rating;

            stars.push(
                <i
                    key={i}
                    className={`bi bi-star${filled ? '-fill' : halfFilled ? '-half' : ''} ${
                        interactive ? 'cursor-pointer' : ''
                    }`}
                    style={{
                        color: filled || halfFilled ? '#ffc107' : '#ddd',
                        fontSize: interactive ? '1.5rem' : '1rem',
                        cursor: interactive ? 'pointer' : 'default'
                    }}
                    onClick={() => interactive && onChange && onChange(i)}
                ></i>
            );
        }
        return stars;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    return (
        <div className="movie-reviews">
            {/* Rating Statistics */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-4 text-center border-end">
                            <h1 className="display-3 mb-0 text-primary">
                                {stats.averageRating.toFixed(1)}
                            </h1>
                            <div className="mb-2">
                                {renderStars(stats.averageRating)}
                            </div>
                            <p className="text-muted mb-0">
                                {stats.totalReviews} đánh giá
                            </p>
                        </div>
                        <div className="col-md-8">
                            <h6 className="mb-3">Phân bố đánh giá</h6>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <div key={star} className="d-flex align-items-center mb-2">
                  <span className="me-2" style={{ width: '60px' }}>
                    {star} <i className="bi bi-star-fill" style={{ color: '#ffc107' }}></i>
                  </span>
                                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                        <div
                                            className="progress-bar bg-warning"
                                            style={{
                                                width: `${stats.totalReviews > 0
                                                    ? (stats.ratingDistribution[star - 1] / stats.totalReviews) * 100
                                                    : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="ms-2 text-muted" style={{ width: '40px' }}>
                    {stats.ratingDistribution[star - 1]}
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Write Review Button */}
            {user && (
                <div className="mb-4">
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setShowReviewForm(!showReviewForm);
                            setEditingReview(null);
                            setFormData({ rating: 5, comment: '', maPhim });
                        }}
                    >
                        <i className="bi bi-pencil-square me-2"></i>
                        {showReviewForm ? 'Hủy' : 'Viết đánh giá'}
                    </button>
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">
                            {editingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}
                        </h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-3">
                                <label className="form-label">Đánh giá của bạn</label>
                                <div className="mb-2">
                                    {renderStars(formData.rating, true, (rating) =>
                                        setFormData({ ...formData, rating })
                                    )}
                                    <span className="ms-3 text-muted">
                    {formData.rating.toFixed(1)} / 5.0
                  </span>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Nhận xét</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    value={formData.comment}
                                    onChange={(e) =>
                                        setFormData({ ...formData, comment: e.target.value })
                                    }
                                    placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                                    required
                                ></textarea>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary">
                                    <i className="bi bi-send me-2"></i>
                                    {editingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setShowReviewForm(false);
                                        setEditingReview(null);
                                        setFormData({ rating: 5, comment: '', maPhim });
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
                <h5 className="mb-4">
                    Tất cả đánh giá ({stats.totalReviews})
                </h5>

                {reviews.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-chat-left-text text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mt-3">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="card border-0 shadow-sm mb-3">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <div className="d-flex align-items-center mb-1">
                                            <div
                                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                                style={{ width: '40px', height: '40px' }}
                                            >
                                                {review.fullName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h6 className="mb-0">{review.fullName}</h6>
                                                <small className="text-muted">
                                                    {formatDate(review.createdAt)}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="badge bg-warning text-dark">
                                            {review.rating.toFixed(1)} <i className="bi bi-star-fill"></i>
                                        </div>
                                        {user && user.username === review.userName && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => handleEditReview(review)}
                                                    title="Chỉnh sửa đánh giá"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteReview(review.id, review)}
                                                    title="Xóa đánh giá"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="mb-2">
                                    {renderStars(review.rating)}
                                </div>
                                <p className="mb-0">{review.comment}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx="true">{`
        .cursor-pointer {
          cursor: pointer;
        }

        .cursor-pointer:hover {
          transform: scale(1.1);
          transition: transform 0.2s;
        }

        .progress {
          background-color: #f0f0f0;
        }

        .badge {
          font-size: 0.9rem;
        }
      `}</style>
        </div>
    );
};

export default MovieReviews;
