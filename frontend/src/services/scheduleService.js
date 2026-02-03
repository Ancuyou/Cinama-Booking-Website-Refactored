
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

class ScheduleService {
  // Lấy danh sách suất chiếu có phân trang
  async getSchedulesPaginated(page = 1) {
    try {
      const response = await apiClient.get(`/suatchieu/pageable?page=${page}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Lấy tất cả suất chiếu
  async getAllSchedules() {
    try {
      const response = await apiClient.get("/suatchieu");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Lấy suất chiếu theo ID
  async getScheduleById(scheduleId) {
    try {
      const response = await apiClient.get(`/suatchieu/${scheduleId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Tạo suất chiếu mới
  async createSchedule(scheduleData) {
    try {
      const response = await apiClient.post("/suatchieu", scheduleData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Cập nhật suất chiếu
  async updateSchedule(scheduleId, scheduleData) {
    try {
      const response = await apiClient.put(
        `/suatchieu/${scheduleId}`,
        scheduleData
      );
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Xóa suất chiếu
  async deleteSchedule(scheduleId) {
    try {
      const response = await apiClient.delete(`/suatchieu/${scheduleId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Lấy danh sách phim cho form tạo suất chiếu
  async getMoviesForSchedule() {
    try {
      const response = await apiClient.get("/phim");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
}

export default new ScheduleService();
