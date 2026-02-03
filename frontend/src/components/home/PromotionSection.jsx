import React, { useEffect, useState } from "react";
import settingService from "../../services/settingService.js";
import {movieService} from "../../services/index.js";
import serviceService from "../../services/serviceService.js";
import promotionService from "../../services/promotionService.js";
import { Gift, ChevronLeft, ChevronRight } from "lucide-react";
import {useToast} from "../common/Toast.jsx";

const PromotionSection = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [banners, setBanners] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 3; // Số khuyến mãi hiển thị mỗi trang
    const { showError } = useToast();

    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const res = await settingService.getAllKhuyenMaiBanner();
                if (res.success) {
                    const promotion = res.data || [];
                    setPromotions(promotion);
                } else throw Error(res.data);
            } catch (err) {
                showError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPromotions();
    }, []);

    useEffect(() => {
        const fetchSlider = async () => {
            const result = await Promise.all(
                promotions.map(async (item) => {
                    const match = item.tenCauHinh.split('-');
                    const id = match ? match.pop().trim() : null;
                    const service = (item.loai === 'Khuyến mãi') ? await promotionService.getPromotionById(id) : await serviceService.getServiceById(id)
                    return {
                        id: item.maCauHinh,
                        tieuDe: match[0].trim(),
                        hinhAnh: item.giaTri,
                        details: service?.data,
                        loai: item.loai,
                        moTa: service?.data?.moTa,
                        ngayBatDau: service?.data?.ngayBatDau,
                        ngayKetThuc: service?.data?.ngayKetThuc,
                    }
                })
            );
            setBanners(result);
        };
        fetchSlider()
    }, [promotions]);

    // Auto-slide mỗi 5 giây
    useEffect(() => {
        if (banners.length <= itemsPerPage) return; // Không cần slide nếu ít hơn hoặc bằng số items hiển thị

        const interval = setInterval(() => {
            setCurrentPage((prev) => {
                const totalPages = Math.ceil(banners.length / itemsPerPage);
                return (prev + 1) % totalPages;
            });
        }, 5000); // 5 giây

        return () => clearInterval(interval);
    }, [banners.length]);

    const totalPages = Math.ceil(banners.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const currentBanners = banners.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (pageIndex) => {
        setCurrentPage(pageIndex);
    };

    const goToPrev = () => {
        setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    };

    const goToNext = () => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
    };

    if (loading)
        return (
            <div className="text-center py-4">
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
            </div>
        );

    if (promotions.length === 0)
        return (
            <section className="mt-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <h2 className="mb-0 fw-semibold" style={{ color: "#ff4b2b" }}>
                        <i className="fas fa-gift me-2"></i>Khuyến mãi
                    </h2>
                </div>

                <div className="row g-4">
                    {[
                        {
                            tenKm: "Ưu đãi thành viên SuperMovie",
                            moTa: "Giảm giá 30% cho tất cả suất chiếu vào Thứ 4 hàng tuần.",
                            hinhAnh:
                                "https://api-website.cinestar.com.vn/media/wysiwyg/CMSPage/Promotions/HSSV-2.jpg",
                            ngayBatDau: "01/10/2025",
                            ngayKetThuc: "31/12/2025",
                        },
                        {
                            tenKm: "Happy Day - Vé chỉ 45.000đ",
                            moTa: "Áp dụng cho học sinh, sinh viên tại các rạp SuperMovie toàn quốc.",
                            hinhAnh: "https://media.lottecinemavn.com/Media/Event/60cb72826642494ab62b80df02cbeb22.jpg",
                            ngayBatDau: "05/10/2025",
                            ngayKetThuc: "31/12/2025",
                        },
                        {
                            tenKm: "Combo bắp nước chỉ 45.000đ",
                            moTa: "Combo bắp nước chỉ 45.000đ",
                            hinhAnh: "https://media.lottecinemavn.com/Media/Event/5bb61105185d44158c2e50326cdfa05e.jpg",
                            ngayBatDau: "10/10/2025",
                            ngayKetThuc: "31/12/2025",
                        },
                    ].map((km, i) => (
                        <div key={i} className="col-md-4 col-sm-6">
                            <div
                                className="card h-100 border-0 shadow-sm"
                                style={{ background: "#20232a", color: "#fff" }}
                            >
                                <img
                                    src={km.hinhAnh}
                                    alt={km.tenKm}
                                    className="card-img-top"
                                    style={{
                                        height: "200px",
                                        objectFit: "cover",
                                        borderRadius: "4px 4px 0 0",
                                    }}
                                />
                                <div className="card-body">
                                    <h5
                                        className="card-title fw-semibold"
                                        style={{ color: "#ff4b2b" }}
                                    >
                                        {km.tenKm}
                                    </h5>
                                    <p
                                        className="card-text text-muted"
                                        style={{
                                            fontSize: "0.9rem",
                                            color: "#fff"
                                        }}
                                    >
                                        {km.moTa}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );

    return (
        <section className="mt-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="mb-0 fw-semibold d-flex" style={{ color: "#ff4b2b" }}>
                    <Gift size={36} className="me-2" />
                    Khuyến mãi
                </h2>
            </div>

            {/* Promotion Cards với Animation */}
            <div className="position-relative">
                <div className="row g-4">
                    {currentBanners.map((km, index) => (
                        <div
                            key={km.id}
                            className="col-md-4 col-sm-6"
                            style={{
                                animation: "fadeIn 0.5s ease-in",
                            }}
                        >
                            <div
                                className="card h-100 border-0 shadow-sm"
                                style={{
                                    background: "#20232a",
                                    color: "#fff",
                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                    cursor: "default",
                                }}
                            >
                                <img
                                    src={km.hinhAnh || "/default-promo.jpg"}
                                    alt={km.tieuDe}
                                    className="card-img-top"
                                    style={{
                                        height: "200px",
                                        objectFit: "cover",
                                        borderRadius: "4px 4px 0 0",
                                    }}
                                />
                                <div className="card-body">
                                    <h5
                                        className="card-title fw-bold"
                                        style={{
                                            color: "#ff4b2b",
                                            textAlign: "center"
                                        }}
                                    >
                                        {km.tieuDe}
                                    </h5>
                                    <p
                                        className="card-text"
                                        style={{
                                            fontSize: "0.9rem",
                                            textAlign: "center",
                                            color: "#fff"
                                        }}
                                    >
                                        {km.moTa?.length > 100
                                            ? km.moTa.substring(0, 100) + "..."
                                            : km.moTa}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Dots - Only show if more than itemsPerPage */}
            {banners.length > itemsPerPage && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToPage(index)}
                            style={{
                                width: currentPage === index ? "30px" : "10px",
                                height: "10px",
                                borderRadius: "5px",
                                border: "none",
                                background: currentPage === index
                                    ? "linear-gradient(135deg, #ff4b2b 0%, #ff6b4a 100%)"
                                    : "#3a3d4a",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                boxShadow: currentPage === index
                                    ? "0 2px 8px rgba(255, 75, 43, 0.4)"
                                    : "none"
                            }}
                            onMouseEnter={(e) => {
                                if (currentPage !== index) {
                                    e.target.style.background = "#5a5d6a";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== index) {
                                    e.target.style.background = "#3a3d4a";
                                }
                            }}
                        />
                    ))}
                </div>
            )}

            {/* CSS Animation */}
            <style>
                {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
            </style>
        </section>
    );
};

export default PromotionSection;
