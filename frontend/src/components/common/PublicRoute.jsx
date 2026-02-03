// File: src/components/common/PublicRoute.jsx (Đã sửa lỗi)
import { useAuth } from "../../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

/**
 * PublicRoute Guard:
 * - Nếu người dùng đã đăng nhập, chuyển hướng họ ra khỏi các trang công khai (login, register).
 * - Nếu là ADMIN, chuyển hướng tới '/admin'.
 * - Nếu là USER, chuyển hướng tới '/'.
 * - Nếu người dùng chưa đăng nhập, cho phép họ truy cập trang (render <Outlet />).
 */
const PublicRoute = () => {
  const { user } = useAuth();
  
  console.log('PublicRoute - Checking user:', user);

  if (user) {
    // Kiểm tra vai trò của người dùng đã đăng nhập
    const isAdmin = user.roles.includes("ROLE_ADMIN");

    // Nếu là admin, chuyển hướng đến trang admin. Nếu không, về trang chủ.
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  // Nếu không có user (chưa đăng nhập), cho phép render component con (Login, Register)
  return <Outlet />;
};

export default PublicRoute;
