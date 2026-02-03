import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Thêm useNavigate
import authService from "../services/authService";
import Header from "../components/Layout/Header.jsx";
import Footer from "../components/Layout/Footer.jsx"; // Thêm authService

const Register = () => {
  const [formData, setFormData] = useState({
    tenDangNhap: "",
    matKhau: "",
    hoTen: "",
    email: "",
    sdt: "",
    ngaySinh: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (formData.matKhau && e.target.value !== formData.matKhau) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Thêm validation cơ bản
    for (const key in formData) {
      if (!formData[key]) {
        setError("Vui lòng điền đầy đủ thông tin.");
        return;
      }
    }
    if (passwordError) return;
    if (formData.matKhau !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    const result = await authService.register(formData);
    setLoading(false);

    if (result.success) {
      setShowOtpModal(true); // Hiển thị modal OTP
    } else {
      setError(result.message || "Đã có lỗi xảy ra.");
    }
  };

  // Component Modal OTP
  const OtpModal = ({ email, onLoginRedirect }) => {
    const [otp, setOtp] = useState("");
    const [modalError, setModalError] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60);

    useEffect(() => {
      if (resendCooldown > 0) {
        const timer = setTimeout(
          () => setResendCooldown(resendCooldown - 1),
          1000
        );
        return () => clearTimeout(timer);
      }
    }, [resendCooldown]);

    const handleVerify = async () => {
      if (!otp) {
        setModalError("Vui lòng nhập mã OTP.");
        return;
      }
      setModalLoading(true);
      const result = await authService.verifyOtp({ email, otp });
      setModalLoading(false);

      if (result.success) {
        alert("Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.");
        onLoginRedirect(); // Gọi hàm chuyển hướng
      } else {
        setModalError(result.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
      }
    };

    const handleResend = async () => {
      setResendCooldown(60);
      await authService.resendOtp({ email });
    };

    return (
      <div
        className="modal show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xác thực OTP</h5>
            </div>
            <div className="modal-body">
              <p>
                Một mã OTP đã được gửi đến email: <strong>{email}</strong>
              </p>
              <input
                type="text"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập mã OTP"
              />
              {modalError && (
                <div className="text-danger mt-2">{modalError}</div>
              )}
            </div>
            <div className="modal-footer justify-content-between">
              {" "}
              {/* Thêm class để căn chỉnh */}
              {/* NÚT HỦY BỎ MỚI */}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onLoginRedirect} // Gọi hàm chuyển hướng về trang login
              >
                Hủy bỏ
              </button>
              <div className="d-flex gap-2">
                {" "}
                {/* Nhóm 2 nút cũ lại */}
                <button
                  className="btn btn-secondary"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  Gửi lại OTP {resendCooldown > 0 ? `(${resendCooldown}s)` : ""}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleVerify}
                  disabled={modalLoading}
                >
                  {modalLoading ? "Đang xác thực..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
      <div>
          <Header />
          <div className="auth-container">
              <div className="auth-card">
                  <h2 className="text-center">Đăng Ký</h2>
                  <form onSubmit={handleSubmit} noValidate>
                      {error && <div className="alert alert-danger">{error}</div>}

                      <div className="row">
                          <div className="col-md-6 mb-3">
                              <label className="form-label">Tên đăng nhập</label>
                              <input
                                  type="text"
                                  name="tenDangNhap"
                                  className="form-control"
                                  onChange={handleChange}
                                  required
                              />
                          </div>
                          <div className="col-md-6 mb-3">
                              <label className="form-label">Họ và tên</label>
                              <input
                                  type="text"
                                  name="hoTen"
                                  className="form-control"
                                  onChange={handleChange}
                                  required
                              />
                          </div>
                      </div>

                      <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                              type="email"
                              name="email"
                              className="form-control"
                              onChange={handleChange}
                              required
                          />
                      </div>

                      <div className="row">
                          <div className="col-md-6 mb-3">
                              <label className="form-label">Số điện thoại</label>
                              <input
                                  type="text"
                                  name="sdt"
                                  className="form-control"
                                  onChange={handleChange}
                                  required
                              />
                          </div>
                          <div className="col-md-6 mb-3">
                              <label className="form-label">Ngày sinh</label>
                              <input
                                  type="date"
                                  name="ngaySinh"
                                  className="form-control"
                                  onChange={handleChange}
                                  required
                              />
                          </div>
                      </div>

                      <div className="mb-3">
                          <label className="form-label">Mật khẩu</label>
                          <input
                              type="password"
                              name="matKhau"
                              className="form-control"
                              onChange={handleChange}
                              required
                          />
                      </div>
                      <div className="mb-4">
                          <label className="form-label">Xác nhận mật khẩu</label>
                          <input
                              type="password"
                              name="confirmPassword"
                              className={`form-control ${passwordError ? "is-invalid" : ""}`}
                              value={confirmPassword}
                              onChange={handleConfirmPasswordChange}
                              required
                          />
                          {passwordError && (
                              <div className="invalid-feedback">{passwordError}</div>
                          )}
                      </div>

                      <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={loading}
                      >
                          {loading ? "Đang xử lý..." : "Đăng Ký"}
                      </button>
                      <div className="text-center mt-3">
                          <span className="text-muted">Đã có tài khoản? </span>
                          <Link to="/login" className="auth-link">
                              Đăng nhập ngay
                          </Link>
                      </div>
                  </form>
              </div>
          </div>
          {showOtpModal && (
              <OtpModal
                  email={formData.email}
                  onLoginRedirect={() => navigate("/login")}
              />
          )}
            <Footer />
      </div>
  );
};

export default Register;
