import apiClient from "./apiClient";

const handleApiResponse = (response) => ({
  success: true,
  data: response.data.data,
  message: response.data.message,
});

const handleError = (error) => ({
  success: false,
  data: null,
  message: error.response?.data?.message || "Lỗi kết nối server",
});

class ProfileService {
  // Lấy thông tin user hiện tại
  async getMyInfo() {
    try {
      const response = await apiClient.get("/profile/me");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Cập nhật thông tin profile
  async updateMyInfo(profileData) {
    try {
      const response = await apiClient.put("/profile/me", profileData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Đổi mật khẩu
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(
        "/profile/change-password",
        passwordData
      );
      return {
        success: true,
        message: response.data.message || "Đổi mật khẩu thành công",
      };
    } catch (error) {
      return handleError(error);
    }
  }
}

export default new ProfileService();
