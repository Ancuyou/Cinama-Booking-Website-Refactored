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
const promotionService = {
  // Lấy tất cả khuyến mãi
  getAllPromotions: async () => {
    try {
      const response = await apiClient.get("/khuyenmai");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

    getAllPromotionsPageable: async (page = 1) => {
        try {
            const response = await apiClient.get(`/khuyenmai/pageable?page=${page}`);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

  // Lấy khuyến mãi theo ID
  getPromotionById: async (id) => {
    try {
      const response = await apiClient.get(`/khuyenmai/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Tạo khuyến mãi mới
  createPromotion: async (promotionData) => {
    try {
      const response = await apiClient.post("/khuyenmai", promotionData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Cập nhật khuyến mãi
  updatePromotion: async (id, promotionData) => {
    try {
      const response = await apiClient.put(`/khuyenmai/${id}`, promotionData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Xóa khuyến mãi
  deletePromotion: async (id) => {
    try {
      const response = await apiClient.delete(`/khuyenmai/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async searchPromotions(keyword, page = 1) {
        try {
            const response = await apiClient.get(
                `/khuyenmai/search?keyword=${encodeURIComponent(keyword)}&page=${page}`
            );
            return handleApiResponse(response);
        } catch (error) {
            console.error("Lỗi kết nối API searchMovies:", error);
            return handleError(error);
        }
    },
  // Kiểm tra mã khuyến mãi
  validatePromotion: async (code) => {
    try {
      const response = await apiClient.get(`/khuyenmai/validate/code/${code}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getPromotionDetail: async (code) => {
    try {
      const response = await apiClient.get(`/khuyenmai/code/${code}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default promotionService;
