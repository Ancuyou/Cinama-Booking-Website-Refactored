import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Login.css";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy email từ trang Register gửi qua
  const email = location.state?.email;

  if (!email) {
    // Nếu không có email, quay về trang đăng ký
    navigate("/register");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Vui lòng nhập mã OTP gồm 6 chữ số.");
      return;
    }

    try {
      const result = await authService.verifyOtp({ email, otp });
      if (result.success) {
        setSuccess(
          "Xác thực thành công! Tài khoản của bạn đã được tạo. Đang chuyển đến trang đăng nhập..."
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(result.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const handleResendOtp = async () => {
    try {
      await authService.resendOtp({ email });
      setSuccess("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (err) {
      setError("Không thể gửi lại mã OTP lúc này.");
    }
  };

  return (
    <div className="login-container d-flex justify-content-center align-items-center">
      <div className="login-form-container p-4 p-sm-5">
        <h2 className="text-center mb-4">Xác Thực OTP</h2>
        <p className="text-center text-muted mb-4">
          Một mã OTP đã được gửi đến email: <strong>{email}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {!success && (
            <>
              <div className="form-group mb-3">
                <label htmlFor="otp">Mã OTP</label>
                <input
                  type="text"
                  className="form-control"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã OTP gồm 6 chữ số"
                  maxLength="6"
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-3">
                Xác nhận
              </button>
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={handleResendOtp}
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
