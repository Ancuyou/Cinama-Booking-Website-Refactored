import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import "./Auth.css";
import Footer from "../components/Layout/Footer.jsx";
import Header from "../components/Layout/Header.jsx"; // Import file CSS mới

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const result = await authService.forgotPassword(email);
    setLoading(false);
    if (result.success) {
      setMessage(
        "Yêu cầu đã được gửi. Vui lòng kiểm tra email để đặt lại mật khẩu."
      );
    } else {
      setError(result.message || "Đã có lỗi xảy ra.");
    }
  };

  return (
      <div>
          <Header />
          <div className="auth-container">
              <div className="auth-card">
                  <h2 className="text-center">Quên Mật Khẩu</h2>
                  <p className="text-center text-muted mb-4">
                      Nhập email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại
                      mật khẩu.
                  </p>

                  {message && <div className="alert alert-success">{message}</div>}
                  {error && <div className="alert alert-danger">{error}</div>}

                  <form onSubmit={handleSubmit}>
                      <div className="form-group mb-4">
                          <label className="form-label" htmlFor="email">
                              Địa chỉ email
                          </label>
                          <input
                              type="email"
                              id="email"
                              className="form-control"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                          />
                      </div>

                      <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={loading}
                      >
                          {loading ? "Đang gửi..." : "Gửi liên kết"}
                      </button>
                  </form>
                  <div className="text-center mt-4">
                      <Link to="/login" className="auth-link">
                          Quay lại Đăng nhập
                      </Link>
                  </div>
              </div>
          </div>
          <Footer />
      </div>
  );
};

export default ForgotPassword;
