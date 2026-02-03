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

const serviceService = {
  // Lấy danh sách dịch vụ đi kèm
  getAllServices: async () => {
    try {
      const response = await apiClient.get("/dichvudikem");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

    getServicesPaginated: async (page = 1) => {
        try {
            const response = await apiClient.get(`/dichvudikem/pageable?page=${page}`);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Tạo dịch vụ đi kèm mới
    createService: async (serviceData) => {
        try {
            const response = await apiClient.post("/dichvudikem", serviceData);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Cập nhật dịch vụ đi kèm
    updateService: async (maDichVu, serviceData) => {
        try {
            const response = await apiClient.put(`/dichvudikem/${maDichVu}`, serviceData);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    // Xóa dịch vụ đi kèm
    deleteService: async (maDichVu) => {
        try {
            const response = await apiClient.delete(`/dichvudikem/${maDichVu}`);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    //Tra cứu dịch vụ
    searchServices: async (tenDv, danhMuc, page = 1) => {
        try {
            const response = await apiClient.get(`/dichvudikem/search?search?Ten=${encodeURIComponent(tenDv)}&Danhmuc=${encodeURIComponent(danhMuc)}&page=${page}`);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

  // Lấy dịch vụ theo danh mục
  getServicesByCategory: async (category = 'all') => {
    try {
      const response = await apiClient.get(`/dichvudikem/category/${category}`);
      // Some endpoints may wrap data differently; reuse handleApiResponse
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Lấy chi tiết dịch vụ
  getServiceById: async (maDichVu) => {
    try {
      const response = await apiClient.get(`/dichvudikem/${maDichVu}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default serviceService;
