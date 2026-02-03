
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
class SeatService {
    // Lấy tất cả loại ghế (không truyền roomId)
  async getAllSeatTypes() {
    try {
      const response = await apiClient.get("/loaighe?phong=null");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

    // Lấy loại ghế theo phòng (nếu cần)
    async getSeatTypesByRoom(roomId) {
            try {
                const response = await apiClient.get(`/loaighe?phong=${roomId}`);
                return handleApiResponse(response);
            } catch (error) {
                return handleError(error);
            }
        }

    // Lấy thông tin loại ghế theo ID
  async getSeatTypeById(seatTypeId) {
    try {
      const response = await apiClient.get(`/loaighe/${seatTypeId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Tạo loại ghế mới
  async createSeatType(seatTypeData) {
    try {
      const response = await apiClient.post("/loaighe", seatTypeData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Cập nhật loại ghế
  async updateSeatType(seatTypeId, seatTypeData) {
    try {
      const response = await apiClient.put(
        `/loaighe/${seatTypeId}`,
        seatTypeData
      );
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Xóa loại ghế
  async deleteSeatType(seatTypeId) {
    try {
      const response = await apiClient.delete(`/loaighe/${seatTypeId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Lấy ghế đã đặt cho suất chiếu
  async getBookedSeats(maSuatChieu) {
    try {
      const response = await apiClient.get(`/ghe/booking/${maSuatChieu}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // Cập nhật ghế
  async updateSeat(seatId, seatData) {
    try {
      const response = await apiClient.put(`/ghe/${seatId}`, seatData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }

  async createSeat(seatData) {
    try {
      const response = await apiClient.post(`/ghe`,seatData);
      return handleApiResponse(response);
    }  catch (error) {
        return handleError(error);
    }
  }

  async deleteSeat(seatId) {
      try {
          const response = await apiClient.delete(`/ghe/${seatId}`);
          return handleApiResponse(response);
      } catch (error) {
          return handleError(error);
      }
  }
}

export default new SeatService();
