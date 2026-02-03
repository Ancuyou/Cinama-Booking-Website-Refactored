import apiClient from "./apiClient";

const handleApiResponse = (response) => ({
  success: true,
  data: response.data.data,
  message: response.data.message,
});
const handleError = (error) => ({
  success: false,
  data: [],
  message: error.response?.data?.message || "Lỗi kết nối server",
});

class CategoryService {
  // Lấy danh sách thể loại
  async getAllCategoriesPaginable(page = 1) {
    try {
      const response = await apiClient.get(`/theloai/pageable?page=${page}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

    async getAllCategories() {
        try {
            const response = await apiClient.get(`/theloai`);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    }

  // Lấy chi tiết thể loại theo ID
  async getCategoryById(categoryId) {
    try {
      const response = await apiClient.get(`/theloai/${categoryId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Thêm thể loại mới
  async createCategory(categoryData) {
    try {
      const response = await apiClient.post("/theloai", categoryData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Cập nhật thể loại
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await apiClient.put(
        `/theloai/${categoryId}`,
        categoryData
      );
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Xóa thể loại
  async deleteCategory(categoryId) {
    try {
      const response = await apiClient.delete(`/theloai/${categoryId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
}

export default new CategoryService();
