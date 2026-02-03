import apiClient from './apiClient';

const handleApiResponse = (response) => ({
  success: true,
  code : response.data.code,
  data: response.data.data,
  message: response.data.message,
});

const handleError = (error) => ({
  success: false,
  message: error.response?.data?.message || 'Lỗi kết nối server',
});

const paymentService = {
  // Search invoices with optional params
  searchInvoices: async (params = {}) => {
    try {
      const query = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

      const url = `/payment/search${query ? `?${query}` : ''}`;
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Search tickets with optional params
  searchTickets: async (params = {}) => {
    try {
      const query = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

      const url = `/ve/search${query ? `?${query}` : ''}`;
      const response = await apiClient.get(url);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get invoice detail by id
  getInvoiceDetail: async (maHD) => {
    try {
      const response = await apiClient.get(`/payment/detail/${maHD}`);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Hoàn tiền VNPay
  refundVNPay: async (refundData) => {
    try {
      const response = await apiClient.post('/payment/vn_pay/refund', refundData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Hoàn tiền MoMo
  refundMoMo: async (refundData) => {
    try {
      const response = await apiClient.post('/payment/momo/refund', refundData);
      return handleApiResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default paymentService;
