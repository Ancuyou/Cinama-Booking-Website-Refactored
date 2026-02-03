import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logOut();
    navigate("/");
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="p-3 bg-dark text-white">
      <div className="container">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <Link
            to="/"
            className="d-flex align-items-center text-decoration-none"
          >
            <img
              src="/images/cinema_logo.png"
              alt="Logo"
              width="60px"
              height="60px"
              className="me-3"
            />
            <span className="fs-3 fw-bold text-warning">CineTickets</span>
          </Link>

          {/* Menu - ở giữa */}
          <ul className="nav mb-2 justify-content-center mb-md-0">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link px-3 text-header ${isActive ? "text-warning" : "text-white"}`
                }
              >
                Trang chủ
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/movies"
                className={({ isActive }) =>
                  `nav-link px-3 text-header ${isActive ? "text-warning" : "text-white"}`
                }
              >
                Phim
              </NavLink>
            </li>
            {user && (
              <>
              <li>
                <NavLink
                  to="/tickets"
                  className={({ isActive }) =>
                    `nav-link px-3 text-header ${isActive ? "text-warning" : "text-white"}`
                  }
                >
                  Vé của tôi
                </NavLink>
              </li>
                <li>
                <NavLink
                  to="/my-reviews"
                  className={({ isActive }) =>
                    `nav-link px-3 text-header ${isActive ? "text-warning" : "text-white"}`
                  }
                >
                  Lịch sử đánh giá
                </NavLink>
              </li>
              </>
            )}
            <li>

            </li>
            {user && user.roles.includes("ROLE_ADMIN") && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `nav-link px-3 text-header ${
                      isActive ? "text-warning fw-bold" : "text-warning"
                    }`
                  }
                >
                  Quản trị
                </NavLink>
              </li>
            )}
          </ul>

          {/* Khu vực Đăng nhập / Người dùng - bên phải */}
          <div className="text-end">
            {user ? (
              // Giao diện khi đã đăng nhập
              <div className="dropdown text-header">
                <a
                  href="#"
                  className="d-block link-light text-decoration-none dropdown-toggle"
                  id="dropdownUser1"
                  onClick={toggleDropdown}
                >
                  <i className="bi bi-person-circle me-2"></i>
                  Chào,{" "}
                  <span className="text-warning text-header">{user.username}</span>
                </a>
                <ul
                  className={`dropdown-menu dropdown-menu-end text-small mt-2 ${
                    isDropdownOpen ? "show" : ""
                  }`}
                  aria-labelledby="dropdownUser1"
                >
                    <li>
                        <Link className="dropdown-item p-3" to="/profile">
                            <i className="bi bi-person-circle me-2"></i>
                            Quản lý tài khoản
                        </Link>
                    </li>
                  <li>
                    <Link to="/tickets" className="dropdown-item p-3">
                      <i className="bi bi-ticket-perforated me-2"></i>
                      Lịch sử đặt vé
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item text-danger p-3" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              // Giao diện khi chưa đăng nhập
              <div>
                <Link to="/login" className="btn btn-outline-light me-2">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-warning">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx  >{`
        .logo-brand {
          transition: transform 0.2s ease;
        }
        .logo-brand:hover {
          transform: scale(1.05);
        }
        .logo-brand img {
          filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.3));
        }
        .nav-link {
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .nav-link:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </header>
  );
};

export default Header;
