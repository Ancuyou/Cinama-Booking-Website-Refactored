// Service API cho xác thực người dùng
import { API_CONFIG } from "./config";
import apiClient, { publicApiClient } from "./apiClient"; // Import apiClient

const handleApiResponse = (response) => {
  // Axios response có data nằm trong response.data
  return {
    success: true,
    data: response.data.data,
    message: response.data.message,
  };
};

const handleError = (error) => {
  const resp = error.response?.data;
  let message =
    resp?.message || error.message || "Không thể kết nối đến máy chủ.";

  // Ưu tiên lấy thông báo cụ thể từ resp.data (hoặc resp.errors nếu có)
  const details = resp?.data ?? resp?.errors;
  if (details) {
    if (typeof details === "string") {
      message = details;
    } else if (Array.isArray(details) && details.length) {
      const first = details[0];
      message =
        first?.message ||
        first?.msg ||
        first?.error ||
        (typeof first === "string" ? first : message);
    } else if (typeof details === "object") {
      const firstKey = Object.keys(details)[0];
      const firstVal = details[firstKey];
      if (Array.isArray(firstVal) && firstVal.length) {
        message =
          firstVal[0]?.message ||
          firstVal[0]?.msg ||
          (typeof firstVal[0] === "string" ? firstVal[0] : message);
      } else if (typeof firstVal === "string") {
        message = firstVal;
      }
    }
  }

  return { success: false, data: [], message };
};

// --- CÁC HÀM KHÔNG CẦN TOKEN ---
const login = async (credentials) => {
  try {
    // Dùng axios thay cho fetch
    const response = await apiClient.post("/auth/login", credentials);
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

const register = async (userData) => {
  try {
    const response = await publicApiClient.post("/auth/register", userData);
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

const resetPassword = async (data) => {
  try {
    const payload = { otp: data.token, newPassword: data.newPassword };
    const response = await apiClient.post("/auth/reset-password", payload);
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// --- HÀM ĐẶC BIỆT ĐỂ REFRESH TOKEN ---
const refreshToken = async (data) => {
  try {
    // Dùng fetch để tránh vòng lặp vô hạn nếu API refresh cũng trả về 401
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (response.ok) {
      return { success: true, data: result.data };
    }
    return { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: "Refresh token failed." };
  }
};

const logout = async () => {
  try {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // Gửi cả hai token lên server để vô hiệu hóa hoàn toàn phiên đăng nhập
    if (accessToken && refreshToken) {
      await apiClient.post("/auth/logout", { accessToken, refreshToken });
    }
    // Xử lý logout ở client sẽ nằm trong AuthContext
    return { success: true };
  } catch (error) {
    // Kể cả khi lỗi, vẫn nên xóa token ở client
    console.error(
      "Logout API failed, but logging out client-side anyway.",
      error
    );
    return { success: true };
  }
};
const verifyOtp = async (data) => {
  try {
    const response = await publicApiClient.post("/auth/verify-otp", data);
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

const resendOtp = async (data) => {
  try {
    const response = await publicApiClient.post("/auth/resend-otp", data);
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

const loginWithGoogle = async (tokenData) => {
  try {
    const response = await publicApiClient.post("/auth/google", tokenData);
    return handleApiResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export default {
  login,
  register,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  verifyOtp,
  resendOtp,
  loginWithGoogle,
};
