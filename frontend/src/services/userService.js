import apiClient from "./apiClient";

// Hàm xử lý response chung để đơn giản hóa logic trong component
const handleResponse = (response) => {
  if (response && response.data) {
    // Backend trả về cấu trúc ApiResponse chuẩn
    if (response.data.code === 200 || response.data.code === 201) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }
    // Xử lý các lỗi nghiệp vụ do backend trả về (ví dụ: email đã tồn tại)
    return {
      success: false,
      message: response.data.message || "Có lỗi xảy ra",
    };
  }
  // Xử lý lỗi mạng hoặc server không phản hồi
  return { success: false, message: "Không thể kết nối đến máy chủ." };
};

// Hàm xử lý lỗi khi API call thất bại (ví dụ: lỗi 4xx, 5xx)
const handleApiError = (error) => {
  if (error.response && error.response.data) {
    return {
      success: false,
      message: error.response.data.message || "Lỗi không xác định từ máy chủ.",
    };
  }
  return { success: false, message: error.message || "Lỗi kết nối mạng." };
};

const userService = {
  /**
   * Tìm kiếm, lọc và phân trang người dùng
   * @param {object} params - { page, size, keyword, role, status }
   */
  searchUsers: async (params) => {
    try {
      const response = await apiClient.get("/users", { params });
      return handleResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Tạo người dùng mới
   * @param {object} userData - Dữ liệu người dùng từ form
   */
  createUser: async (userData) => {
    try {
      const response = await apiClient.post("/users", userData);
      return handleResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Cập nhật thông tin người dùng
   * @param {number} userId - ID của người dùng
   * @param {object} userData - Dữ liệu cập nhật từ form
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return handleResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Xóa vĩnh viễn một người dùng
   * @param {number} userId - ID của người dùng cần xóa
   */
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return handleResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Cập nhật trạng thái (khóa/mở khóa) tài khoản
   * @param {string} username - Tên đăng nhập của tài khoản
   * @param {boolean} status - Trạng thái mới (true: active, false: inactive)
   */
  updateUserStatus: async (username, status) => {
    try {
      const response = await apiClient.put(`/users/${username}/status`, null, {
        params: { status },
      });
      return handleResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export default userService;
