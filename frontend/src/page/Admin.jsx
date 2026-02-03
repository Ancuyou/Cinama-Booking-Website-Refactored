import React from "react";
import Sidebar from "../components/admin/Sidebar";
import ToastProvider from "../components/common/Toast";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";

const Admin = () => {
  const { user, logOut } = useAuth();
  const handleLogout = async () => {
    try {
      // Luôn gọi API để vô hiệu hóa token trên server trước
      await authService.logout();
    } catch (error) {
      console.error(
        "Logout API call failed, but proceeding with client-side logout.",
        error
      );
    } finally {
      logOut(); // Xóa state và localStorage
      // Điều này buộc trình duyệt phải tải lại trang hoàn toàn, đảm bảo state được reset 100%
      window.location.href = "/login";
    }
  };
  return (
    <ToastProvider>
      <div className="admin-layout">
        <div className="admin-sidebar">
          <Sidebar />
        </div>
        <div className="admin-content">
          <div className="admin-header bg-light shadow-sm border-bottom">
            <div className="d-flex justify-content-between align-items-center px-4 py-3">
              <h1 className="mb-0 h4 text-primary">
                Admin Panel - CineTickets
              </h1>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <i className="bi bi-person-fill text-white"></i>
                  </div>
                  <span className="text-muted">Xin chào, Admin</span>
                </div>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Đăng xuất
                </button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};

export default Admin;
