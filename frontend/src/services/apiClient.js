import axios from "axios";
import { API_CONFIG } from "./config";
import authService from "./authService";
import { useAuth } from "../context/AuthContext";

// Tạo một public instance của axios
const publicApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
// Tạo một instance của axios
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Danh sách các API không yêu cầu xác thực (public APIs)
const PUBLIC_APIS = [
  "/phim", // Lấy danh sách phim
  "/phim/", // Lấy chi tiết phim
  "/suatchieu", // Lấy danh sách suất chiếu
  "/suatchieu/", // Lấy chi tiết suất chiếu
  "/ve", // API đặt vé (cho guest)
  "/ghe", // API liên quan đến ghế
  "/ghe/booking/", // API lấy ghế đã đặt
  "/loaighe", // API lấy loại ghế
  "/dichvudikem", // API lấy dịch vụ đi kèm
  "/dichvudikem/", // API chi tiết dịch vụ
  // '/khuyenmai',        // API khuyến mãi
  // '/khuyenmai/validate',// API kiểm tra khuyến mãi
  // '/khuyenmai/code',   // API lấy thông tin khuyến mãi theo mã
  "/payment/vn_pay/create", // API tạo thanh toán VNPay
  "/payment/vn_pay", // API VNPay
  "/payment/status", // API kiểm tra trạng thái thanh toán
  "/payment/detail", // API lấy chi tiết hóa đơn
];

// Kiểm tra xem một URL có thuộc danh sách API công khai không
const isPublicApi = (url) => {
  return PUBLIC_APIS.some((api) => url.includes(api));
};

// Interceptor 1: "Người gác cổng" - Chỉ thêm token vào request khi cần thiết
apiClient.interceptors.request.use(
  (config) => {
    // Kiểm tra xem request hiện tại có thuộc vào public API không
    const isPublicRequest = isPublicApi(config.url);

    // Chỉ thêm token nếu có token trong localStorage (người dùng đã đăng nhập)
    const token = localStorage.getItem("accessToken");

    // Thêm token vào header nếu:
    // 1. Người dùng đã đăng nhập (có token) và
    // 2. API yêu cầu xác thực (không phải public API)
    //    hoặc là API public nhưng đang dùng phương thức POST/PUT/DELETE
    if (
      token &&
      (!isPublicRequest || (isPublicRequest && config.method !== "get"))
    ) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("Token sent:", config.headers["Authorization"]);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor 2: "Bác sĩ" - Xử lý khi có lỗi trả về, đặc biệt là lỗi 401
apiClient.interceptors.response.use(
  (response) => {
    // Trả về response nếu không có lỗi
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Chỉ xử lý lỗi 401 (Unauthenticated) và request này chưa được thử lại
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu là đã thử lại 1 lần để tránh lặp vô hạn

      try {
        // Kiểm tra URL của request gốc, nếu nó là request không yêu cầu xác thực thì không redirect
        const isPublicRequest = isPublicApi(originalRequest.url);

        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // Nếu không có refresh token và không phải public request, chuyển về trang login
          if (!isPublicRequest) {
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }

        // Gọi API để lấy cặp token mới
        const rs = await authService.refreshToken({ token: refreshToken });

        if (rs.success) {
          const { accessToken, refreshToken: newRefreshToken } = rs.data;

          // Lưu lại token mới
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Cập nhật lại header cho apiClient và request gốc
          apiClient.defaults.headers.common["Authorization"] =
            "Bearer " + accessToken;
          originalRequest.headers["Authorization"] = "Bearer " + accessToken;

          // Gọi lại request ban đầu đã bị lỗi với token mới
          return apiClient(originalRequest);
        } else {
          // Nếu refresh token cũng thất bại (hết hạn, không hợp lệ)
          localStorage.clear();

          // Chỉ chuyển hướng nếu không phải API công khai
          if (!isPublicRequest) {
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }
      } catch (_error) {
        localStorage.clear();

        // Chỉ chuyển hướng nếu không phải API công khai
        if (!isPublicRequest) {
          window.location.href = "/login";
        }
        return Promise.reject(_error);
      }
    }

    // Với các lỗi khác (403, 500, ...) thì trả về lỗi đó
    return Promise.reject(error);
  }
);

export { publicApiClient };
export default apiClient;
