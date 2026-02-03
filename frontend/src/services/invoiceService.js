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
const invoiceService = {
    getAllInvoice: async (NgayBD, NgayKT) => {
        try {
            const response = await apiClient.get("/payment?NgayBD=" + NgayBD + "&NgayKT=" + NgayKT);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    getAllInvoiceStatus: async (NgayBD, NgayKT) => {
        try {
            const response = await apiClient.get("/payment/status?NgayBD=" + NgayBD + "&NgayKT=" + NgayKT);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },

    getAllPhimInvoice: async (NgayBD, NgayKT) => {
        try {
            const response = await apiClient.get(`/payment/phim?NgayBD=` + NgayBD + `&NgayKT=` + NgayKT);
            return handleApiResponse(response);
        } catch (error) {
            return handleError(error);
        }
    },
};

export default invoiceService;
