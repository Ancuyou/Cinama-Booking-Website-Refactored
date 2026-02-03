import apiClient from "./apiClient";

const handleApiResponse = (response) => ({
  success: true,
  data: response.data.data,
  message: response.data.message,
});

const handleError = (error) => ({
  success: false,
  message: error.response?.data?.message || "Lỗi kết nối server",
});

const reviewService = {
  // Lấy tất cả đánh giá phim
  getAllReviews: async () => {
    try {
      const response = await apiClient.get("/danhgiaphim");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Lấy đánh giá theo ID
  getReviewById: async (id) => {
    try {
      const response = await apiClient.get(`/danhgiaphim/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Lấy đánh giá theo mã phim
  getReviewsByMovieId: async (maPhim) => {
    try {
      const response = await apiClient.get(`/danhgiaphim/phim/${maPhim}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Lấy đánh giá phân trang với tìm kiếm
  getReviewsPaginated: async (page = 1, search = '') => {
    try {
      let url = `/danhgiaphim/paginated?page=${page}`;
      if (search && search.trim() !== '') {
        url += `&tenPhim=${encodeURIComponent(search.trim())}`;
      }
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Tạo đánh giá mới
  createReview: async (reviewData) => {
    try {
      const response = await apiClient.post("/danhgiaphim", reviewData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Cập nhật đánh giá
  updateReview: async (id, reviewData) => {
    try {
      const response = await apiClient.put(`/danhgiaphim/${id}`, reviewData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getMyReviews: async () => {
    try {
      const response = await apiClient.get("/danhgiaphim/myreviews");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Xóa đánh giá
  deleteReview: async (id) => {
    try {
      const response = await apiClient.delete(`/danhgiaphim/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default reviewService;
