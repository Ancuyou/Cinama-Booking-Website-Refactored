import { useEffect, useState } from "react";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import Banner from "../components/home/MovieBanner";
import MovieSlider from "../components/home/MovieSlider";
import PromotionSection from "../components/home/PromotionSection";
import {settingService} from "../services/index.js";
import {useToast} from "../components/common/Toast.jsx"
import {Flame, CalendarClock, ChevronRight, Info, Mail, Phone} from "lucide-react";
import { API_CONFIG } from "../services/config.js";
const Home = () => {
    const [nowShowing, setNowShowing] = useState([]);
    const [comingSoon, setComingSoon] = useState([]);
    const [movieBanners, setMovieBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const {showError, showSuccess} = useToast();
    const [Email, setEmail] = useState("");
    const [PhoneNumber, setPhoneNumber] = useState("");
    

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                const [resNow, resSoon, resSlider] = await Promise.all([
                    fetch(`${API_CONFIG.BASE_URL}/phim/dangchieu`).then((r) => r.json()),
                    fetch(`${API_CONFIG.BASE_URL}/phim/sapchieu`).then((r) => r.json()),
                    settingService.getAllPhimBanner()
                ]);

                setNowShowing(resNow.data || []);
                setComingSoon(resSoon.data || []);
                setMovieBanners(resSlider.data || []);
            } catch (err) {
                showError("❌ Lỗi khi tải phim:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
        email()
        phone()
    }, []);

    const email = async () => {
        try {
            const result = await settingService.getSettingByKey("EMAIL_SUPPORT");
            if (result.success) {
                setEmail(result.data.giaTri);
            } else {
                showError(result.data?.data || "Lỗi khi lấy email hỗ trợ");
                return "";
            }
        } catch (error) {
            showError(error?.message || "Đã xảy ra lỗi trong quá trình gọi API");
            return "";
        }
    };
    const phone = async () =>  {
        try {
            const result = await settingService.getSettingByKey("HOT_LINE");
            if (result.success) {
                setPhoneNumber(result.data.giaTri);
            }
            else {
                showError(result.data.data);
                return "";
            }
        } catch (error)    {
            showError(error?.message || "Đã xảy ra lỗi trong quá trình gọi API");
            return "";
        }
    };


    return (
        <div
            className="d-flex flex-column min-vh-100"
            style={{ overflowX: "hidden" }}
        >
            {/* Header */}
            <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
                <Header />
            </div>

            {/* Banner */}
            <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
                <Banner movies={movieBanners} />
            </div>

            {/* Nội dung chính */}
            <main className="flex-grow-1 py-5">
                <div className="container">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-danger" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* PHIM ĐANG CHIẾU */}
                            <section className="mb-5" id="now-showing-section">
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <h2
                                        className="mb-0 fw-semibold d-flex align-items-center"
                                        style={{ color: "#ff4b2b" }}
                                    >
                                        <Flame size={36} className="me-2" />
                                        Phim đang chiếu
                                    </h2>
                                    <a
                                        href="/movies"
                                        className="btn-view-all d-flex align-items-center"
                                    >
                                        Xem tất cả <ChevronRight size={20} className="ms-1" />
                                    </a>
                                </div>
                                <MovieSlider movies={nowShowing} />
                            </section>

                            {/* PHIM SẮP RA MẮT */}
                            <section className="mb-5" id="coming-soon-section">
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <h2
                                        className="mb-0 fw-semibold d-flex align-items-center"
                                        style={{ color: "#ff4b2b" }}
                                    >
                                        <CalendarClock size={36} className="me-2" />
                                        Sắp ra mắt
                                    </h2>
                                    <a
                                        href="/movies"
                                        className="btn-view-all d-flex align-items-center"
                                    >
                                        Xem tất cả <ChevronRight size={20} className="ms-1" />
                                    </a>
                                </div>
                                <MovieSlider movies={comingSoon} />
                            </section>

                            {/* KHUYẾN MÃI */}
                            <PromotionSection />

                            {/* THÔNG TIN RẠP CHIẾU */}
                            <section className="mb-5 mt-5" id="cinema-info-section">
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <h2
                                        className="mb-0 fw-semibold d-flex align-items-center"
                                        style={{ color: "#ff4b2b" }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                                            <polyline points="17 2 12 7 7 2"></polyline>
                                        </svg>
                                        Về CineTickets
                                    </h2>
                                </div>

                                <div className="row g-4 align-items-center">
                                    <div className="col-5" style={{
                                        position: 'relative',
                                        top: '0px'
                                    }}>
                                        <div className="cinema-image-wrapper">
                                            <img
                                                src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80"
                                                alt="CineTickets Cinema"
                                                className="cinema-image"
                                            />
                                        </div>
                                    </div>

                                    {/* Nội dung giới thiệu bên phải */}
                                    <div className="col-md-6">
                                        <div className="cinema-info-content">
                                            <p className="cinema-info-text">
                                                <strong>CineTickets</strong> tự hào là hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam,
                                                mang đến cho khán giả những trải nghiệm điện ảnh tuyệt vời nhất với công nghệ tiên tiến
                                                và dịch vụ chuyên nghiệp.
                                            </p>

                                            <div className="cinema-features">
                                                <div className="feature-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                    <div>
                                                        <strong>Âm thanh Dolby Atmos</strong>
                                                        <p>Hệ thống âm thanh vòm 360° mang đến trải nghiệm sống động như thật</p>
                                                    </div>
                                                </div>

                                                <div className="feature-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                    <div>
                                                        <strong>Màn hình 4K Ultra HD</strong>
                                                        <p>Hình ảnh siêu nét, màu sắc chân thực với công nghệ chiếu hiện đại nhất</p>
                                                    </div>
                                                </div>

                                                <div className="feature-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                    <div>
                                                        <strong>Ghế ngồi Premium</strong>
                                                        <p>Ghế da cao cấp, điều chỉnh độ nghiêng, đảm bảo sự thoải mái tuyệt đối</p>
                                                    </div>
                                                </div>

                                                <div className="feature-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                    <div>
                                                        <strong>Dịch vụ F&B đa dạng</strong>
                                                        <p>Quầy bắp rang bơ, nước giải khát và nhiều món ăn nhẹ hấp dẫn</p>
                                                    </div>
                                                </div>
                                                <div className="feature-item mt-4">
                                                    <div>
                                                        <><strong>Thông tin liên hệ</strong></>
                                                        <div className="d-flex align-items-center mb-2 justify-content-center ms-5">
                                                            <strong>
                                                                <Mail className = "me-2"/>
                                                            </strong>
                                                            <p className="mb-1">{Email}</p>
                                                        </div>
                                                        <div className="d-flex align-items-center mb-2 justify-content-center">
                                                            <strong>
                                                                <Phone className = "me-2"/>
                                                            </strong>
                                                            <p className="mb-1">{PhoneNumber}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}


                </div>
            </main>

            {/* Footer */}
            <div style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
                <Footer />
            </div>

            <style jsx>{`
                .btn-view-all {
                    border: 1px solid #ff4b2b;
                    color: #ff4b2b;
                    padding: 10px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-weight: 500;
                }

                .btn-view-all:hover {
                    background: #ff4b2b;
                    color: white;
                    box-shadow: 0 4px 12px rgba(255, 75, 43, 0.4);
                }

                /* Cinema Info Section */
                .cinema-image-wrapper {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }

                .cinema-image {
                    width: 100%;
                    height: 500px;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }


                .cinema-image-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 50%);
                    display: flex;
                    align-items: flex-end;
                    padding: 30px;
                }

                .overlay-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 24px;
                    background: rgba(255, 75, 43, 0.9);
                    backdrop-filter: blur(10px);
                    border-radius: 50px;
                    color: white;
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .cinema-info-text strong {
                    color: #FFC107;
                }

                .feature-item {
                    display: flex;
                    gap: 15px;
                    align-items: flex-start;
                }

                .feature-item svg {
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .feature-item strong {
                    color: #FFC107;
                    font-size: 1.05rem;
                    display: block;
                    margin-bottom: 5px;
                }

                .feature-item p {
                    color: #999;
                    font-size: 0.95rem;
                    margin: 0;
                    line-height: 1.5;
                }

                .stat-item h4 {
                    color: #FFC107;
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 5px;
                }

                .stat-item p {
                    color: #bbb;
                    font-size: 0.9rem;
                    margin: 0;
                }

                @media (max-width: 768px) {
                    .cinema-image {
                        height: 350px;
                    }

                    .cinema-info-title {
                        font-size: 1.8rem;
                    }

                    .cinema-info-text {
                        font-size: 0.95rem;
                    }

                    .cinema-info-content {
                        padding: 20px 0;
                    }

                    .cinema-stats {
                        gap: 20px;
                    }

                    .stat-item h4 {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Home;
