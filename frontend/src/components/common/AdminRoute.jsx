// src/components/common/AdminRoute.jsx

import { useAuth } from "../../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const { user, loading } = useAuth();

  // Nếu đang trong quá trình kiểm tra token, hiển thị một màn hình chờ
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Sau khi kiểm tra xong, mới áp dụng logic phân quyền
  if (user && user.roles.includes("ROLE_ADMIN")) {
    return <Outlet />;
  }
  return <Navigate to="/login" replace />;
};

export default AdminRoute;
