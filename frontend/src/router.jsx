import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

// --- Import các trang (Pages) ---
import Home from "./page/Home";
import Login from "./page/Login";
import Register from "./page/Register";
import Admin from "./page/Admin";
import ForgotPassword from "./page/ForgotPassword";
import ResetPassword from "./page/ResetPassword";
import BookingPage from "./page/BookingPage";
import TicketsPage from "./page/TicketsPage";
import Movies from "./page/Movies";
import About from "./page/About";
import Blog from "./page/Blogs";
import MyReviews from "./page/MyReviews.jsx";

// --- Import các thành phần đặc biệt (Components) ---
import InvoiceDetail from "./components/ticket/InvoiceDetail";
import PaymentReturn from "./components/payment/PaymentReturn";
import VNPayRedirect from "./components/payment/VNPayRedirect";
import MoMoRedirect from "./components/payment/MoMoRedirect";

// --- Import Layout và "Người Gác Cổng" (Guards) ---
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import AdminRoute from "./components/common/AdminRoute";
import PublicRoute from "./components/common/PublicRoute"; // Giả sử bạn đã tạo file này

import Dashboard from "./components/admin/Dashboard";
import MovieManagement from "./components/admin/MovieManagement";
import CategoryManager from "./components/admin/CategoryManager";
import RoomManager from "./components/admin/RoomManager";
import ScheduleManager from "./components/admin/ScheduleManager";
import SeatManager from "./components/admin/SeatManager";
import UserManager from "./components/admin/UserManager";
import RevenueManager from "./components/admin/RevenueManager";
import SettingsManager from "./components/admin/SettingsManager";
import ServiceManager from "./components/admin/ServiceManager";
import MovieDetail from "./components/admin/MovieDetail";
import PromotionManager from "./components/admin/PromotionManager.jsx";
import ReviewManager from "./components/admin/ReviewManager";
import InvoiceManager from "./components/admin/InvoiceManager";
import TicketManager from "./components/admin/TicketManager";
import InvoiceDetailAdmin from "./components/admin/InvoiceDetailAdmin";
import TicketDetailAdmin from "./components/admin/TicketDetailAdmin";
import SeatTypeManager from "./components/admin/SeatTypeManager.jsx";
import Profile from "./page/Profile";

/**
 * Component Layout chính cho các trang người dùng
 * Bao gồm Header và Footer chung, nội dung trang sẽ được hiển thị qua <Outlet />
 */
const MainLayout = () => (
  <>
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

const Router = () => (
  <BrowserRouter>
    <Routes>
      {/* --- Tuyến đường có Layout chung (Header & Footer) --- */}
      <Route element={<MainLayout />}>
        <Route path="/booking/:movieId" element={<BookingPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/invoice/:invoiceId" element={<InvoiceDetail />} />
        <Route path="/payment/return" element={<PaymentReturn />} />
        <Route path="/payment/result" element={<PaymentReturn />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-reviews" element={<MyReviews />} />
        {/* Bạn có thể thêm các trang người dùng khác vào đây */}
      </Route>

      {/* --- Tuyến đường cho người chưa đăng nhập --- */}
      <Route path="/movies" element={<Movies />} />
      <Route path="/about" element={<About />} />
      <Route path="/blogs" element={<Blog />} />

      {/* Các trang này thường không cần Header/Footer đầy đủ */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* --- Tuyến đường được bảo vệ cho Admin --- */}
      {/* Trang Admin có layout riêng bên trong nó */}
      <Route element={<AdminRoute />}>
        {/* Tất cả các route con của Admin sẽ nằm trong đây */}
        <Route path="/admin" element={<Admin />}>
          {/* Navigate tự động từ /admin sang /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="film" element={<MovieManagement />} />
          <Route path="category" element={<CategoryManager />} />
          <Route path="room" element={<RoomManager />} />
          <Route path="schedule" element={<ScheduleManager />} />
          <Route path="seat" element={<SeatManager />} />
          <Route path="seattype" element={<SeatTypeManager />} />
          <Route path="user" element={<UserManager />} />
          <Route path="revenue" element={<RevenueManager />} />
          <Route path="invoices" element={<InvoiceManager />} />
          <Route path="invoices/:maHD" element={<InvoiceDetailAdmin />} />
          <Route path="tickets" element={<TicketManager />} />
          <Route path="tickets/:maVe" element={<TicketDetailAdmin />} />
          <Route path="settings" element={<SettingsManager />} />
          <Route path="service" element={<ServiceManager />} />
          <Route path="promotion" element={<PromotionManager />} />
          <Route path="review" element={<ReviewManager />} />
          <Route path="rooms/:roomId/seats" element={<SeatManager />} />
          <Route path="film/:movieId" element={<MovieDetail />} />
        </Route>
      </Route>

      {/* --- Tuyến đường xử lý Redirect không cần giao diện --- */}
      <Route path="/" element={<Home />} />
      <Route path="/api/payment/return" element={<VNPayRedirect />} />
      <Route path="/vnpay_return" element={<VNPayRedirect />} />
      <Route path="/api/payment/momo/return" element={<MoMoRedirect />} />
      <Route path="/momo_return" element={<MoMoRedirect />} />
    </Routes>
  </BrowserRouter>
);

export default Router;
