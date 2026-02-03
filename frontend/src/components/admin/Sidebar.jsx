import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from "../../services/authService.js";
import {useAuth} from "../../context/AuthContext.jsx";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logOut } = useAuth();
    // Lấy phần sau 'admin' trong pathname
    const activeMenu = location.pathname.split('/')[2];
    const isActive = (id) => activeMenu && activeMenu.startsWith(id);

    const systemItems = [
        { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
        { id: 'settings', icon: 'bi-gear-wide', label: 'Cài đặt hệ thống' },
    ];

    const cinemaItems = [
        { id: 'room', icon: 'bi-house', label: 'Phòng chiếu' },
        { id: 'seattype', icon: 'bi-ticket-perforated', label: 'Loại ghế' },
    ];

    const movieItems = [
        { id: 'film', icon: 'bi-film', label: 'Phim' },
        { id: 'category', icon: 'bi-tags', label: 'Thể loại' },
        { id: 'schedule', icon: 'bi-calendar3', label: 'Suất chiếu' },
        { id: 'review', icon: 'bi-chat-left-text', label: 'Đánh giá phim' },
    ];

    const revenueItems = [
        { id: 'revenue', icon: 'bi-currency-dollar', label: 'Doanh thu' },
        { id: 'invoices', icon: 'bi-receipt', label: 'Hóa đơn' },
        { id: 'tickets', icon: 'bi-ticket', label: 'Vé' },
    ]

    const otherItems = [
        {id: 'user', icon: 'bi-people', label: 'Người dùng'},
        {id: 'service', icon: 'bi-basket', label: 'Dịch vụ khác'},
        {id: 'promotion', icon: 'bi-gift', label: 'Khuyến mãi'},
    ];

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
        <div className="bg-dark text-white d-flex flex-column h-100 p-0">
            {/* Header */}
            <div className="p-4 border-bottom border-secondary">
                <div className="text-center">
                    <img
                        src="/images/cinema_logo.png"
                        alt="CineTickets"
                        style={{ height: '40px' }}
                        className="mb-2"
                    />
                    <h4 className="text-warning fw-bold mb-0">CineTickets</h4>
                    <small className="text-muted">Admin Panel</small>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-grow-1 p-3">
                {/* System Section */}
                <div className="mb-4">
                    <h6 className="text-uppercase text-white fw-bold mb-3" style={{ fontSize: '0.75rem' }}>
                        HỆ THỐNG
                    </h6>
                    {systemItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/admin/${item.id}`)}
                            className={`btn w-100 text-start mb-2 d-flex align-items-center ${
                                isActive(item.id)
                                    ? 'btn-warning text-dark fw-bold'
                                    : 'btn-outline-secondary text-white border-0'
                            }`}
                            style={{ height: '45px' }}
                        >
                            <i className={`bi ${item.icon} me-3`}></i>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Cinema Section */}
                <div className="mb-4">
                    <h6 className="text-uppercase text-white fw-bold mb-3" style={{ fontSize: '0.75rem' }}>
                        RẠP PHIM
                    </h6>
                    {cinemaItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/admin/${item.id}`)}
                            className={`btn w-100 text-start mb-2 d-flex align-items-center ${
                                isActive(item.id)
                                    ? 'btn-warning text-dark fw-bold'
                                    : 'btn-outline-secondary text-white border-0'
                            }`}
                            style={{ height: '45px' }}
                        >
                            <i className={`bi ${item.icon} me-3`}></i>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Movie Section */}
                <div className="mb-4">
                    <h6 className="text-uppercase text-white fw-bold mb-3" style={{ fontSize: '0.75rem' }}>
                        PHIM
                    </h6>
                    {movieItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/admin/${item.id}`)}
                            className={`btn w-100 text-start mb-2 d-flex align-items-center ${
                                isActive(item.id)
                                    ? 'btn-warning text-dark fw-bold'
                                    : 'btn-outline-secondary text-white border-0'
                            }`}
                            style={{ height: '45px' }}
                        >
                            <i className={`bi ${item.icon} me-3`}></i>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Revenue Section */}
                <div className="mb-4">
                    <h6 className="text-uppercase text-white fw-bold mb-3" style={{ fontSize: '0.75rem' }}>
                        DOANH THU
                    </h6>
                    {revenueItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/admin/${item.id}`)}
                            className={`btn w-100 text-start mb-2 d-flex align-items-center ${
                                isActive(item.id)
                                    ? 'btn-warning text-dark fw-bold'
                                    : 'btn-outline-secondary text-white border-0'
                            }`}
                            style={{ height: '45px' }}
                        >
                            <i className={`bi ${item.icon} me-3`}></i>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Other Section */}
                <div className="mb-4">
                    <h6 className="text-uppercase text-white fw-bold mb-3" style={{ fontSize: '0.75rem' }}>
                        KHÁC
                    </h6>
                    {otherItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/admin/${item.id}`)}
                            className={`btn w-100 text-start mb-2 d-flex align-items-center ${
                                isActive(item.id)
                                    ? 'btn-warning text-dark fw-bold'
                                    : 'btn-outline-secondary text-white border-0'
                            }`}
                            style={{ height: '45px' }}
                        >
                            <i className={`bi ${item.icon} me-3`}></i>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-top border-secondary">
                <div className="mb-3">
                    <div className="d-flex align-items-center p-2 bg-secondary bg-opacity-25 rounded">
                        <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center me-2"
                             style={{ width: '32px', height: '32px' }}>
                            <i className="bi bi-person-fill text-dark"></i>
                        </div>
                        <div className="flex-grow-1">
                            <div className="fw-bold" style={{ fontSize: '0.875rem' }}>Admin User</div>
                            <small className="text-muted">Administrator</small>
                        </div>
                    </div>
                </div>

                <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                    onClick={handleLogout}
                >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default Sidebar;