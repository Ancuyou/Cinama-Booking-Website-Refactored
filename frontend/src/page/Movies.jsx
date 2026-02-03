import { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import Banner from "../components/home/MovieBanner";
import Movie from "../components/home/Movie";
import { API_CONFIG } from "../services/config";


const Movies = () => {
    const [movies, setMovies] = useState([]);
    const [bannerMovies, setBannerMovies] = useState([]); // Giữ banner cố định
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [keyword, setKeyword] = useState("");

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                let url = "";

                if (statusFilter === "dangchieu")
                    url = `${API_CONFIG.BASE_URL}/phim/dangchieu`;
                else if (statusFilter === "sapchieu")
                    url = `${API_CONFIG.BASE_URL}/phim/sapchieu`;
                else url = `${API_CONFIG.BASE_URL}/phim/pageable?page=${page}&size=8`;

                const res = await fetch(url);
                const data = await res.json();

                if (data?.data) {
                    if (Array.isArray(data.data)) {
                        setMovies(data.data);
                        if (statusFilter === "all" && bannerMovies.length === 0) {
                            setBannerMovies(data.data); // Lưu phim cho banner lần đầu
                        }
                    } else {
                        setMovies(data.data.currentMovies || []);
                        setTotalPages(data.data.totalPages || 1);
                        if (statusFilter === "all" && bannerMovies.length === 0) {
                            setBannerMovies(data.data.currentMovies || []);
                        }
                    }
                }
            } catch (error) {
                console.error("Lỗi tải danh sách phim:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, [page, statusFilter]);

    const filteredMovies = movies.filter((m) =>
        m.tenPhim?.toLowerCase().includes(keyword.toLowerCase())
    );

    return (
        <div className="d-flex flex-column min-vh-100" style={{ background: "#fff" }}>
            <link
                href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css"
                rel="stylesheet"
            />
            <link
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
                rel="stylesheet"
            />
            <style>
                {`
            .search-input::placeholder {
              color: #fff;
              opacity: 1;
            }
            .search-input::-webkit-input-placeholder {
              color: #888;
            }
            .search-input::-moz-placeholder {
              color: #888;
            }
            .search-input:-ms-input-placeholder {
              color: #888;
            }
          `}
            </style>
            <Header />

            {/* ✅ Banner vẫn giữ nguyên khi đổi filter */}
            <Banner movies={bannerMovies.length ? bannerMovies : movies} />

            <div className="bg-primary text-white py-4 mb-4">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h2 className="mb-0">
                                <i className="bi bi-film me-2"></i>
                                Phim
                            </h2>
                            <p className="mb-0 opacity-75">
                                Quản lý và xem thông tin phim
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bộ lọc phim */}
            <section className="py-4" style={{ background: "#fff" }}>
                <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
                    {/* Nút lọc trạng thái */}
                    <div className="d-flex gap-3" role="group">
                        {[
                            { key: "all", label: "Tất cả", icon: "fas fa-list" },
                            { key: "dangchieu", label: "Đang chiếu", icon: "fas fa-play-circle" },
                            { key: "sapchieu", label: "Sắp chiếu", icon: "fas fa-clock" },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                className={`btn ${
                                    statusFilter === btn.key ? "btn-active" : "btn-inactive"
                                }`}
                                style={{
                                    background: statusFilter === btn.key
                                        ? "linear-gradient(135deg, #ff4b2b 0%, #ff6b4a 100%)"
                                        : "linear-gradient(135deg, #1a1d29 0%, #252837 100%)",
                                    border: statusFilter === btn.key ? "2px solid #ff6b4a" : "2px solid #3a3d4a",
                                    borderRadius: "25px",
                                    padding: "10px 24px",
                                    fontWeight: "600",
                                    color: statusFilter === btn.key ? "#fff" : "#ccc",
                                    transition: "all 0.3s ease",
                                    boxShadow: statusFilter === btn.key
                                        ? "0 6px 20px rgba(255, 75, 43, 0.4)"
                                        : "0 2px 8px rgba(0, 0, 0, 0.2)",
                                    transform: statusFilter === btn.key ? "translateY(-2px)" : "translateY(0)",
                                    fontSize: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                                onClick={() => {
                                    setStatusFilter(btn.key);
                                    setPage(1);
                                }}
                                onMouseEnter={(e) => {
                                    if (statusFilter !== btn.key) {
                                        e.target.style.borderColor = "#ff4b2b";
                                        e.target.style.color = "#fff";
                                        e.target.style.transform = "translateY(-2px)";
                                        e.target.style.boxShadow = "0 4px 15px rgba(255, 75, 43, 0.3)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (statusFilter !== btn.key) {
                                        e.target.style.borderColor = "#3a3d4a";
                                        e.target.style.color = "#ccc";
                                        e.target.style.transform = "translateY(0)";
                                        e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
                                    }
                                }}
                            >
                                <i className={btn.icon}></i>
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Ô tìm kiếm */}
                    <div className="position-relative" style={{ width: "280px" }}>
                        <div
                            className="input-group"
                            style={{
                                background: "#fff",
                                padding: "5px 12px",
                                border: "2px solid #ccc",
                                transition: "box-shadow 0.3s ease"
                            }}
                        >
                            <span
                                className="input-group-text border-0"
                                style={{
                                    background: "transparent",
                                    paddingLeft: "0",
                                    paddingRight: "10px"
                                }}
                            >
                                <i
                                    className="fas fa-search"
                                    style={{
                                        color: "#ccc",
                                        fontSize: "16px"
                                    }}
                                ></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-0 search-input"
                                placeholder="Tìm kiếm phim..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                style={{
                                    background: "transparent",
                                    color: "#000",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    paddingRight: keyword ? "35px" : "0",
                                    paddingLeft: "0",
                                    outline: "none",
                                    boxShadow: "none"
                                }}
                            />
                            {keyword && (
                                <span
                                    className="position-absolute"
                                    style={{
                                        right: "14px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer",
                                        zIndex: 10,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "22px",
                                        height: "22px",
                                        borderRadius: "50%",
                                        transition: "background 0.2s ease"
                                    }}
                                    onClick={() => setKeyword("")}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255, 75, 43, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <i
                                        className="fas fa-times-circle"
                                        style={{
                                            color: "#ccc",
                                            fontSize: "15px"
                                        }}
                                    ></i>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Danh sách phim */}
            <main className="flex-grow-1 py-5 text-white" style={{
                background: "#fff",
            }}>
                <div className="container">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-danger" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h2 className="mb-0" style={{ color: "#ff4b2b" }}>
                                    <i className="fas fa-film me-2"></i>
                                    {statusFilter === "dangchieu"
                                        ? "Phim đang chiếu"
                                        : statusFilter === "sapchieu"
                                            ? "Phim sắp ra mắt"
                                            : "Tất cả phim"}
                                </h2>
                            </div>

                            <div className="row g-4 justify-content-center">
                                {filteredMovies.length > 0 ? (
                                    filteredMovies.map((movie, idx) => (
                                        <div
                                            key={idx}
                                            className="col-lg-3 col-md-4 col-sm-6 d-flex justify-content-center"
                                        >
                                            <Movie movie={movie} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-secondary fs-5">
                                        Không tìm thấy phim phù hợp.
                                    </div>
                                )}
                            </div>

                            {/* Phân trang */}
                            {statusFilter === "all" && totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-5">
                                    <nav>
                                        <ul className="pagination">
                                            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setPage(page - 1)}
                                                    style={{
                                                        background: "#fff",
                                                        color: "#0d6efd",
                                                        borderRadius: "10px 0 0 10px",
                                                    }}
                                                >
                                                    Trước
                                                </button>
                                            </li>

                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <li key={i} className="page-item">
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setPage(i + 1)}
                                                        style={{
                                                            background:
                                                                page === i + 1 ? "#0d6efd" : "transparent",
                                                            color: page === i + 1 ? "#fff" : "#0d6efd",
                                                            borderRadius: "0",
                                                            transition: "all 0.2s",
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                </li>
                                            ))}

                                            <li
                                                className={`page-item ${
                                                    page === totalPages ? "disabled" : ""
                                                }`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => setPage(page + 1)}
                                                    style={{
                                                        background: "#fff",
                                                        color: "#0d6efd",
                                                        borderRadius: "0 10px 10px 0",
                                                    }}
                                                >
                                                    Sau
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Movies;
