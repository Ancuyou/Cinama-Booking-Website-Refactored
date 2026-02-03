import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import movieService from '../../services/movieService';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useNavigate } from "react-router-dom";
import categoryService from "../../services/categoryService.js";
import {useToast} from "../common/Toast.jsx";
import Movie from "../home/Movie.jsx"; // nhớ import ở đầu file



const MovieDetail = () => {
    const navigate = useNavigate();
    const { movieId } = useParams(); // 👈 Lấy id phim từ URL
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [categories, setCategories] = useState([]);
    const {showError, showSuccess} = useToast();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        tenPhim: '',
        moTa: '',
        daoDien: '',
        dienVien: '',
        thoiLuong: '',
        ngayKhoiChieu: '',
        hinhAnh: '',
        trailerURL: '',
        tuoi: '',
        trangThai: 'Sắp chiếu',
        theLoai: []
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const result = await categoryService.getAllCategories();
        if (result.success) setCategories(result.data);
    };

    const fetchMovie = async () => {
        try {
            const result = await movieService.getMovieById(movieId);
            if (result.success) {
                setMovie(result.data);
            }
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovie();
    }, [movieId]);
    if (loading)
    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-center">
                <div className="spinner-border text-primary"></div>
            </div>
        </div>
    );

    if (!movie)
        return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-center">
                <Movie Size={36} />
                <div className="text-center p-5">Không tìm thấy phim.</div>;
            </div>
        </div>
    );


    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.tenPhim.trim()) newErrors.tenPhim = 'Vui lòng nhập tên phim';
        if (!formData.daoDien.trim()) newErrors.daoDien = 'Vui lòng nhập đạo diễn';
        if (!formData.ngayKhoiChieu) newErrors.ngayKhoiChieu = 'Vui lòng chọn ngày khới chiếu';
        if (!formData.tuoi) newErrors.tuoi = 'Vui lòng chọn giới hạn độ tuổi';
        if (!formData.trangThai) newErrors.trangThai = 'Vui lòng chọn trạng thái phim';
        if (!formData.thoiLuong || isNaN(formData.thoiLuong) || formData.thoiLuong <= 0)
            newErrors.thoiLuong = 'Vui lòng nhập thời lượng hợp lệ';
        if (formData.theLoai.length === 0)
            newErrors.theLoai = 'Vui lòng chọn ít nhất một thể loại';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({})


        // Chuyển mảng id thể loại sang mảng tên thể loại
        const theLoaiNames = categories
            .filter(cat => formData.theLoai.includes(cat.maTheLoai))
            .map(cat => cat.tenTheLoai);
        const submitData = { ...formData, theLoai: theLoaiNames };
        try {
            const result = await movieService.updateMovie(movie.maPhim, submitData);
            if (result.success) {
                showSuccess('Cập nhật phim thành công!');
                closeModal();
                await fetchMovie();
            } else {
                showError(result.data);
            }
        } catch (error) {
            showError(error.message);
        }
    };


    const openModal = (type, movie) => {
        setModalType(type);
        if (type === 'edit' && movie) {
            setFormData({
                tenPhim: movie.tenPhim || '',
                moTa: movie.moTa || '',
                daoDien: movie.daoDien || '',
                dienVien: movie.dienVien || '',
                thoiLuong: movie.thoiLuong || '',
                ngayKhoiChieu: movie.ngayKhoiChieu ? movie.ngayKhoiChieu.split('T')[0] : '',
                hinhAnh: movie.hinhAnh || '',
                trailerURL: movie.trailerURL || '',
                tuoi: movie.tuoi || '',
                trangThai: movie.trangThai || '',
                theLoai: movie.listTheLoai ? movie.listTheLoai.map(tl => tl.maTheLoai) : []
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setErrors({});
    };

    return (
        <div className="ontainer py-4">
            <div className="container py-4 d-flex justify-content-between align-items-center">
                {/* Nút quay lại */}
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: "8px" }}
                >
                    ← Quay lại
                </button>

                {/* Nút chỉnh sửa phim */}
                <button
                    onClick={() => openModal('edit', movie)} // đổi path tùy theo route edit của bạn
                    className="btn btn-primary "
                    style={{
                        borderRadius: "8px",
                        backgroundColor: "#007bff",
                        border: "none",
                    }}
                >
                    <i className="bi bi-pencil-square me-1">
                    </i>
                    Chỉnh sửa phim
                </button>

            </div>
            <div className="row">
                <div className="col-md-4 position-relative">
                    {/* Ảnh phim */}
                    <img
                        src={movie.hinhAnh || '/images/no_image.jpg'}
                        alt={movie.tenPhim}
                        className="img-fluid rounded shadow"
                        style={{
                            width: '70%',
                            height: 'auto',
                            objectFit: 'cover',
                            margin: '0 50px',
                        }}
                    />

                    {/* Nút Play (overlay trên ảnh) */}
                    <button
                        onClick={() => openModal('view', movie)}
                        className="btn btn-light rounded-circle position-absolute top-50 start-50 translate-middle shadow"
                        style={{
                            width: '70px',
                            height: '70px',
                            opacity: 0.85,
                            fontSize: '28px',
                            border: 'none',
                        }}
                    >
                        ▶
                    </button>
                </div>

                {/* Thông tin phim */}
                <div className="col-md-8">
                    <div className="d-flex align-items-center gap-2">
                        <h2 className="mb-0">{movie.tenPhim}</h2>

                        <span
                            className="badge"
                            style={{
                                backgroundColor: movie.tuoi >= 18 ? '#dc3545' : '#198754', // đỏ nếu 18+, xanh nếu dưới
                                fontSize: '0.9rem',
                                padding: '8px 10px',
                                height: '30px',
                                marginLeft: '20px',
                                cursor: "default"
                            }}
                        >
                        T{movie.tuoi}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-4 mt-3">
                        {/* Thời lượng */}
                        <div className="d-flex align-items-center">
                            <i className="bi bi-clock" style={{ color: '#0d6efd', fontSize: '1.2rem', marginRight: '6px' }}></i>
                            <span>{movie.thoiLuong} phút</span>
                        </div>

                        {/* Ngày khởi chiếu */}
                        <div className="d-flex align-items-center">
                            <i className="bi bi-calendar-event" style={{ color: '#0d6efd', fontSize: '1.2rem', marginRight: '6px' }}></i>
                            <span>{new Date(movie.ngayKhoiChieu).toLocaleDateString('vi-VN')}</span>
                        </div>

                    </div>
                    <div className="mt-3">
                        <p><strong>Đạo diễn:</strong> {movie.daoDien}</p>
                        <p><strong>Diễn viên:</strong> {movie.dienVien}</p>
                        <p><strong>Thể loại:</strong> {movie.listTheLoai?.map(t => t.tenTheLoai).join(', ')}</p>
                        <div className={`badge ${
                            movie.trangThai === 'Đang chiếu' ? 'bg-success' :
                                movie.trangThai === 'Sắp chiếu' ? 'bg-warning' :
                                    'bg-secondary'
                        }  card-title fw-bold mb-1 text-center`} style={{
                            marginTop: '10px',
                            padding: '6px 20px',
                            cursor: 'default',
                        }}>
                            <h6>
                                {movie.trangThai}
                            </h6>
                        </div>
                    </div>


                </div>
            </div>

            <div className="row mt-5">
                <div className="col-12">
                    <h4 className="fw-bold mb-3" style={{ color: '#000' }}>Nội Dung Phim</h4>
                    <div
                        className="p-3"
                        style={{
                            textAlign: 'justify',
                            lineHeight: '1.8',
                            fontSize: '1.05rem',
                            color: '#333',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        }}
                    >
                        {movie.moTa || 'Hiện chưa có mô tả cho bộ phim này.'}
                    </div>
                </div>
            </div>

            {showModal && (
                <div
                    className="modal fade show"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={handleCloseModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered modal-xl"
                        onClick={(e) => e.stopPropagation()} // tránh click đóng khi bấm trong modal
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modalType === 'view' && 'Trailer: '}
                                    {modalType === 'edit' && 'Chinh sửa phim: '} {movie.tenPhim}

                                  </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>

                            {modalType === 'view' ? (
                            <div className="modal-body p-0">
                                <div className="ratio ratio-16x9">
                                    <iframe width="560" height="315"
                                        src={
                                            movie.trailerURL?.replace("watch?v=", "embed/") + "&autoplay=1" ||
                                            "https://www.youtube.com/embed/dQw4w9WgXcQ"
                                        }
                                        title="Trailer"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                    ></iframe>
                                </div>
                            </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Tên phim *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.tenPhim ? 'is-invalid' : ''}`}
                                                value={formData.tenPhim}
                                                onChange={(e) => setFormData({...formData, tenPhim: e.target.value})}
                                            />
                                            {errors.tenPhim && (
                                                <div className="invalid-feedback">{errors.tenPhim}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Đạo diễn
                                                <span className="text-danger">*</span>
                                                </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.daoDien ? 'is-invalid' : ''}`}
                                                value={formData.daoDien}
                                                onChange={(e) => setFormData({...formData, daoDien: e.target.value})}
                                            />
                                            {errors.daoDien && (
                                                <div className="invalid-feedback">{errors.daoDien}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Diễn viên</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.dienVien}
                                                onChange={(e) => setFormData({...formData, dienVien: e.target.value})}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Thể loại
                                                <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${errors.theLoai ? 'is-invalid' : ''}`}
                                                multiple
                                                value={formData.theLoai}
                                                onChange={e => {
                                                    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                                                    setFormData({ ...formData, theLoai: selected });
                                                }}
                                                required
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.maTheLoai} value={cat.maTheLoai}>{cat.tenTheLoai}</option>
                                                ))}
                                            </select>
                                            {errors.theLoai && (
                                                <div className="invalid-feedback">{errors.theLoai}</div>
                                            )}
                                            <small className="text-muted">Giữ Ctrl để chọn nhiều thể loại</small>
                                        </div>
                                        <div className="row">
                                            <div className="col-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Thời lượng (phút)
                                                        <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className={`form-control ${errors.thoiLuong ? 'is-invalid' : ''}`}
                                                        value={formData.thoiLuong}
                                                        onChange={(e) => setFormData({...formData, thoiLuong: e.target.value})}
                                                    />
                                                    {errors.thoiLuong && (
                                                        <div className="invalid-feedback">{errors.thoiLuong}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Độ tuổi
                                                        <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className={`form-select ${errors.tuoi ? 'is-invalid' : ''}`}
                                                        value={formData.tuoi}
                                                        onChange={(e) => setFormData({...formData, tuoi: e.target.value})}
                                                    >
                                                        <option value="">Chọn độ tuổi</option>
                                                        <option value="0">0+</option>
                                                        <option value="13">13+</option>
                                                        <option value="16">16+</option>
                                                        <option value="18">18+</option>
                                                    </select>
                                                    {errors.tuoi && (
                                                        <div className="invalid-feedback">{errors.tuoi}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Ngày khởi chiếu
                                                <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.ngayKhoiChieu}
                                                onChange={(e) => setFormData({...formData, ngayKhoiChieu: e.target.value})}
                                            />
                                            {errors.ngayKhoiChieu && (
                                                <div className="invalid-feedback">{errors.ngayKhoiChieu}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Trạng thái
                                                <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                value={formData.trangThai}
                                                onChange={(e) => setFormData({...formData, trangThai: e.target.value})}
                                                required
                                            >
                                                <option value="Sắp chiếu">Sắp chiếu</option>
                                                <option value="Đang chiếu">Đang chiếu</option>
                                                <option value="Đã chiếu">Đã chiếu</option>
                                            </select>
                                            {errors.trangThai && (
                                                <div className="invalid-feedback">{errors.trangThai}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">URL Hình ảnh</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={formData.hinhAnh}
                                                onChange={(e) => setFormData({...formData, hinhAnh: e.target.value})}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">URL Trailer</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={formData.trailerURL}
                                                onChange={(e) => setFormData({...formData, trailerURL: e.target.value})}
                                                placeholder="https://youtube.com/embed/..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Mô tả</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={formData.moTa}
                                        onChange={e => setFormData({...formData, moTa: e.target.value})}
                                        placeholder="Nhập mô tả phim..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Đóng
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {modalType === 'add' ? 'Thêm phim' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                        )}
                        </div>
                    </div>
                </div>
                )}
            <style jsx>{`
            .modal-title
            {
                color: black;
                display: flex;
                gap: 0.2rem
            }

            .form-label
            {
                color: black;
                display: flex;
                gap: 0.2rem;
                font-weight: 700;
                height: 24px;
            }
        `}</style>
        </div>
        )
};

export default MovieDetail;
