import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import profileService from "../services/profileService";
import { useToast } from "../components/common/Toast.jsx";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profileData, setProfileData] = useState({
    hoTen: "",
    email: "",
    sdt: "",
    ngaySinh: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const result = await profileService.getMyInfo();
      if (result.success) {
        const userData = result.data;
        setProfileData({
          hoTen: userData.hoTen || "",
          email: userData.email || "",
          sdt: userData.sdt || "",
          ngaySinh: userData.ngaySinh || "",
        });
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
      setErrorMessage("Có lỗi xảy ra khi tải thông tin người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.hoTen.trim()) {
      newErrors.hoTen = "Vui lòng nhập họ tên";
    }
    if (!profileData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!profileData.sdt.trim()) {
      newErrors.sdt = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10}$/.test(profileData.sdt)) {
      newErrors.sdt = "Số điện thoại không hợp lệ (10 chữ số)";
    }
    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ";
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    return newErrors;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const newErrors = validateProfile();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      const result = await profileService.updateMyInfo(profileData);
      if (result.success) {
        showSuccess("Cập nhật thông tin thành công!");
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError("Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const newErrors = validatePassword();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      const result = await profileService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      if (result.success) {
        showSuccess("Đổi mật khẩu thành công!");
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError("Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileData.email) {
    return (
      <div
        className="d-flex flex-column min-vh-100"
        style={{ background: "#181a20" }}
      >
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="text-center">
            <div
              className="spinner-border text-danger mb-3"
              style={{ width: "3rem", height: "3rem" }}
            ></div>
            <h5 className="text-white">Đang tải thông tin...</h5>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ background: "#fff", overflowX: "hidden" }}
    >
      {/* Page Banner */}
      <div
        className="profile-banner position-relative"
        style={{
          background: "#0D6FFD",
          padding: "30px 0",
          marginBottom: "40px",
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 className="mb-2 fw-bold text-white">
                <i className="bi bi-person-circle me-3"></i>
                Quản lý tài khoản cá nhân
              </h2>
              <p className="mb-0 text-white opacity-75">
                Xem và chỉnh sửa thông tin tài khoản của bạn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow-1 pb-5">
        <div className="container">
          <div className="row g-4">
            {/* Sidebar */}
            <div className="col-lg-3">
              {/* User Card */}
              <div
                className="card border-0 shadow-lg mb-4"
                style={{ background: "#fff", borderRadius: "12px" }}
              >
                <div className="card-body text-center p-4">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: "100px",
                      height: "100px",
                      background: "#ff4b2b",
                      fontSize: "2.5rem",
                    }}
                  >
                    <i className="bi bi-person text-white"></i>
                  </div>
                  <h5 className="mb-1 fw-bold text-black">
                    {user?.username || "User"}
                  </h5>
                  <p className="text-muted small mb-0">{profileData.email}</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div
                className="card border-0 shadow-lg"
                style={{ background: "#1f2029", borderRadius: "12px" }}
              >
                <div className="list-group list-group-flush">
                  <button
                    className={`list-group-item list-group-item-action d-flex align-items-center ${
                      activeTab === "info" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("info")}
                    style={
                      activeTab === "info"
                        ? {
                            background: "#ff4b2b",
                            color: "white",
                            border: "none",
                            borderRadius: "0",
                          }
                        : {
                            background: "#fff",
                            color: "#a0a0a0",
                            border: "none",
                          }
                    }
                  >
                    <i className="bi bi-person-lines-fill me-3"></i>
                    <span className="fw-semibold">Thông tin cá nhân</span>
                  </button>
                  <button
                    className={`list-group-item list-group-item-action d-flex align-items-center ${
                      activeTab === "security" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("security")}
                    style={
                      activeTab === "security"
                        ? {
                            background: "#ff4b2b",
                            color: "white",
                            border: "none",
                            borderRadius: "0",
                          }
                        : {
                            background: "#fff",
                            color: "#a0a0a0",
                            border: "none",
                          }
                    }
                  >
                    <i className="bi bi-shield-lock-fill me-3"></i>
                    <span className="fw-semibold">Bảo mật</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="col-lg-9">
              {activeTab === "info" && (
                <div
                  className="card border-0 shadow-lg"
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div
                    className="card-header py-4"
                    style={{
                      background: "#ff4b2b",
                      borderBottom: "1px solid rgba(255, 75, 43, 0.2)",
                      borderRadius: "12px 12px 0 0",
                    }}
                  >
                    <h5 className="mb-0 fw-bold" style={{ color: "#fff" }}>
                      <i className="bi bi-pencil-square me-2"></i>
                      Thông tin cá nhân
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <form onSubmit={handleUpdateProfile}>
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="form-label text-black fw-semibold">
                            Họ và tên{" "}
                            <span style={{ color: "#ff4b2b" }}>*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              errors.hoTen ? "is-invalid" : ""
                            }`}
                            name="hoTen"
                            value={profileData.hoTen}
                            onChange={handleProfileChange}
                            placeholder="Nhập họ tên"
                            style={{
                              background: "#fff",
                              border: "1px solid #2d2d35",
                              color: "black",
                              padding: "12px",
                              borderRadius: "8px",
                            }}
                          />
                          {errors.hoTen && (
                            <div className="invalid-feedback">
                              {errors.hoTen}
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-black fw-semibold">
                            Email <span style={{ color: "#ff4b2b" }}>*</span>
                          </label>
                          <input
                            type="email"
                            className={`form-control ${
                              errors.email ? "is-invalid" : ""
                            }`}
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            placeholder="Nhập email"
                            style={{
                              background: "#fff",
                              border: "1px solid #2d2d35",
                              color: "black",
                              padding: "12px",
                              borderRadius: "8px",
                            }}
                          />
                          {errors.email && (
                            <div className="invalid-feedback">
                              {errors.email}
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-black fw-semibold">
                            Số điện thoại{" "}
                            <span style={{ color: "#ff4b2b" }}>*</span>
                          </label>
                          <input
                            type="tel"
                            className={`form-control ${
                              errors.sdt ? "is-invalid" : ""
                            }`}
                            name="sdt"
                            value={profileData.sdt}
                            onChange={handleProfileChange}
                            placeholder="Nhập số điện thoại"
                            style={{
                              background: "#fff",
                              border: "1px solid #2d2d35",
                              color: "black",
                              padding: "12px",
                              borderRadius: "8px",
                            }}
                          />
                          {errors.sdt && (
                            <div className="invalid-feedback">{errors.sdt}</div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label text-black fw-semibold">
                            Ngày sinh
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            name="ngaySinh"
                            value={profileData.ngaySinh}
                            onChange={handleProfileChange}
                            style={{
                              background: "#fff",
                              border: "1px solid #2d2d35",
                              color: "black",
                              padding: "12px",
                              borderRadius: "8px",
                            }}
                          />
                        </div>
                      </div>

                      <div className="d-flex justify-content-end gap-3 mt-5">
                        <button
                          type="button"
                          className="btn px-4 py-2"
                          onClick={() => navigate("/")}
                          style={{
                            background: "transparent",
                            border: "1px solid #2d2d35",
                            color: "black",
                            borderRadius: "8px",
                          }}
                        >
                          <i className="bi bi-x-circle me-2"></i>
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="btn px-4 py-2"
                          disabled={loading}
                          style={{
                            background: "#ff4b2b",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            boxShadow: "0 4px 15px rgba(255, 75, 43, 0.4)",
                          }}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              Lưu thay đổi
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div
                  className="card border-0 shadow-lg"
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div
                    className="card-header py-4"
                    style={{
                      background: "#ff4b2b",
                      borderBottom: "1px solid rgba(255, 75, 43, 0.2)",
                      borderRadius: "12px 12px 0 0",
                    }}
                  >
                    <h5 className="mb-0 fw-bold" style={{ color: "#fff" }}>
                      <i className="bi bi-shield-lock me-2"></i>
                      Bảo mật tài khoản
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    {!showPasswordForm ? (
                      <div>
                        <div
                          className="d-flex align-items-start p-4 mb-4"
                          style={{
                            background: "#fff",
                            borderRadius: "12px",
                            border: "1px solid #ccc",
                          }}
                        >
                          <div className="flex-shrink-0">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "60px",
                                height: "60px",
                                background: "rgba(255, 75, 43, 0.1)",
                                color: "#ff4b2b",
                              }}
                            >
                              <i
                                className="bi bi-key-fill"
                                style={{ fontSize: "1.5rem" }}
                              ></i>
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-4">
                            <h6 className="mb-2 text-black fw-bold">
                              Mật khẩu
                            </h6>
                            <p className="text-black mb-3">
                              Đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn
                            </p>
                            <button
                              className="btn btn-sm px-4"
                              onClick={() => setShowPasswordForm(true)}
                              style={{
                                background: "#ff4b2b",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                              }}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              Đổi mật khẩu
                            </button>
                          </div>
                        </div>

                        <div
                          className="d-flex align-items-start p-4"
                          style={{
                            background: "#fff",
                            borderRadius: "12px",
                            border: "1px solid #ccc",
                          }}
                        >
                          <div className="flex-shrink-0">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: "60px",
                                height: "60px",
                                background: "rgba(40, 199, 111, 0.1)",
                                color: "#28c76f",
                              }}
                            >
                              <i
                                className="bi bi-shield-check"
                                style={{ fontSize: "1.5rem" }}
                              ></i>
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-4">
                            <h6 className="mb-2 text-black fw-bold">
                              Tài khoản đã xác thực
                            </h6>
                            <p className="text-black mb-3">
                              Tài khoản của bạn đã được xác thực và bảo mật
                            </p>
                            <span
                              className="badge px-3 py-2"
                              style={{
                                background: "rgba(40, 199, 111, 0.2)",
                                color: "#28c76f",
                                borderRadius: "8px",
                              }}
                            >
                              <i className="bi bi-check-circle me-2"></i>
                              Đang hoạt động
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword}>
                        <div className="mb-4">
                          <label className="form-label text-black fw-semibold">
                            Mật khẩu hiện tại{" "}
                            <span style={{ color: "#ff4b2b" }}>*</span>
                          </label>
                          <input
                            type="password"
                            className={`form-control ${
                              errors.oldPassword ? "is-invalid" : ""
                            }`}
                            name="oldPassword"
                            value={passwordData.oldPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập mật khẩu hiện tại"
                            style={{
                              background: "#fff",
                              border: "1px solid #2d2d35",
                              color: "black",
                              padding: "12px",
                              borderRadius: "8px",
                            }}
                          />
                          {errors.oldPassword && (
                            <div className="invalid-feedback">
                              {errors.oldPassword}
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="form-label text-black fw-semibold">
                            Mật khẩu mới{" "}
                            <span style={{ color: "#ff4b2b" }}>*</span>
                          </label>
                          <input
                            type="password"
                            className={`form-control ${
                              errors.newPassword ? "is-invalid" : ""
                            }`}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập mật khẩu mới"
                            style={{
                              background: "#fff",
                              border: "1px solid #2d2d35",
                              color: "black",
                              padding: "12px",
                              borderRadius: "8px",
                            }}
                          />
                          {errors.newPassword && (
                            <div className="invalid-feedback">
                              {errors.newPassword}
                            </div>
                          )}
                          <small className="text-muted d-block mt-2">
                            Mật khẩu phải có ít nhất 6 ký tự
                          </small>
                        </div>

                        <div className="mb-4">
                          <label className="form-label text-black fw-semibold">
                            Xác nhận mật khẩu mới{" "}
                            <span style={{ color: "#ff4b2b" }}>*</span>
                          </label>
                          <input
                            type="password"
                            className={`form-control ${
                              errors.confirmPassword ? "is-invalid" : ""
                            }`}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Nhập lại mật khẩu mới"
                            style={{
                              background: "#fff",
                              border: "1px solid #2d2d35",
                              color: "black",
                              padding: "12px",
                              borderRadius: "8px",
                            }}
                          />
                          {errors.confirmPassword && (
                            <div className="invalid-feedback">
                              {errors.confirmPassword}
                            </div>
                          )}
                        </div>

                        <div className="d-flex justify-content-end gap-3 mt-5">
                          <button
                            type="button"
                            className="btn px-4 py-2"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordData({
                                oldPassword: "",
                                newPassword: "",
                                confirmPassword: "",
                              });
                              setErrors({});
                            }}
                            style={{
                              background: "transparent",
                              border: "1px solid #2d2d35",
                              color: "black",
                              borderRadius: "8px",
                            }}
                          >
                            <i className="bi bi-x-circle me-2"></i>
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="btn px-4 py-2"
                            disabled={loading}
                            style={{
                              background: "#ff4b2b",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              boxShadow: "0 4px 15px rgba(255, 75, 43, 0.4)",
                            }}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check-circle me-2"></i>
                                Đổi mật khẩu
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .form-control:focus {
          background: #fff !important;
          border-color: #ff4b2b !important;
          box-shadow: 0 0 0 0.2rem rgba(255, 75, 43, 0.25) !important;
          color: #121010ff !important;
        }

        .form-control::placeholder {
          color: #6c757d;
        }

        .btn:hover {
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }

        .list-group-item {
          transition: all 0.3s ease;
        }

        .list-group-item:hover:not(.active) {
          background: #ff4b2b !important;
          color: white !important;
        }

        .card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
