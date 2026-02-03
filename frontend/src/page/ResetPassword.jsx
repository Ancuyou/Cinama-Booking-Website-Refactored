import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Auth.css"; // Import file CSS mới

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    const result = await authService.resetPassword({
      token,
      newPassword: password,
    });
    setLoading(false);

    if (result.success) {
      setMessage(
        "Mật khẩu đã được đặt lại thành công! Đang chuyển hướng đến trang đăng nhập..."
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      setError(result.message || "Token không hợp lệ hoặc đã hết hạn.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="text-center">Đặt Lại Mật Khẩu</h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label" htmlFor="password">
                Mật khẩu mới
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-4">
              <label className="form-label" htmlFor="confirmPassword">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
