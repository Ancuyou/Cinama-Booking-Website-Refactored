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

const ticketService = {
  // Đặt vé theo API mới
  bookTicket: async (bookingData) => {
    try {
      const response = await apiClient.post("/ve", bookingData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Lấy chi tiết hóa đơn
  getInvoiceDetail: async (maHD) => {
    try {
      const response = await apiClient.get(`/payment/detail/${maHD}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Tạo thanh toán VNPay
  createVNPayPayment: async (paymentData) => {
    try {
      const response = await apiClient.post(
        "/payment/vn_pay/create",
        paymentData
      );
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Tạo thanh toán MoMo
  createMoMoPayment: async (paymentData) => {
    try {
      const response = await apiClient.post(
        "/payment/momo/create",
        paymentData
      );
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Kiểm tra trạng thái thanh toán
  checkPaymentStatus: async (orderId) => {
    try {
      const response = await apiClient.get(`/payment/status/${orderId}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Hủy hóa đơn
  cancelInvoice: async (maHD) => {
    try {
      const response = await apiClient.post(`/payment/cancel/${maHD}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getMyInvoices: async () => {
    try {
      const response = await apiClient.get("/payment/my-invoices");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Lấy danh sách hóa đơn của user
  getUserInvoices: async () => {
    try {
      const response = await apiClient.get("/payment/all");
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Alias for getUserInvoices để tương thích
  getUserTickets: async () => {
    return ticketService.getUserInvoices();
  },
};

export default ticketService;
