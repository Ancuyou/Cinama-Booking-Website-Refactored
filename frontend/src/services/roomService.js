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
class RoomService {
  // Lấy danh sách phòng chiếu phân trang
  async getRoomsPaginated(page = 1) {
    try {
      const response = await apiClient.get(`/phongchieu/pageable?page=${page}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Lấy tất cả phòng chiếu
  async getAllRooms() {
    try {
      const response = await apiClient.get("/phongchieu");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Lấy phòng chiếu theo ID
  async getRoomById(roomId) {
    try {
      const response = await apiClient.get(`/phongchieu/${roomId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Tạo phòng chiếu mới
  async createRoom(roomData) {
    try {
      const response = await apiClient.post("/phongchieu", roomData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Cập nhật phòng chiếu
  async updateRoom(roomId, roomData) {
    try {
      const response = await apiClient.put(`/phongchieu/${roomId}`, roomData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Xóa phòng chiếu
  async deleteRoom(roomId) {
    try {
      const response = await apiClient.delete(`/phongchieu/${roomId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Lấy ghế của một phòng
  async getRoomSeats(roomId) {
    try {
      const response = await apiClient.get(`/phongchieu/${roomId}/ghe`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  async getAllSeats() {
      try {
          const response = await apiClient.get(`/ghe`);
          return handleApiResponse(response);
      } catch (error) {
          return handleError(error);
      }
  }
}

export default new RoomService();
