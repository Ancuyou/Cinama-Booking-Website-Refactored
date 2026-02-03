import React, {useState, useEffect, useRef} from 'react';
import movieService from '../../services/movieService';
import categoryService from '../../services/categoryService';
import { useNavigate } from 'react-router-dom';
import {Calendar, Film, Plus} from "lucide-react";
import {useToast} from "../common/Toast.jsx";
import * as XLSX from "xlsx";


const MovieManagement = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [errors, setErrors] = useState({});
    const {showSuccess, showError} = useToast();
    const {showInfo} = useToast();
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
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            fetchMovies(currentPage);
        } else {
            searchMovies(searchTerm, currentPage);
        }
    }, [currentPage]);

    const fetchCategories = async () => {
        const result = await categoryService.getAllCategories();
        if (result.success) setCategories(result.data);
    };

    const checkVaidExcelFile = async () => {
        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data, {type: "array"});
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, {header: 1});
            const json2 = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            const headers = json[0];

            const requiredHeaders = ["tenPhim", "moTa", "daoDien", "thoiLuong", "ngayKhoiChieu", "hinhAnh", "trailerURL", "tuoi", "trangThai", "theLoai",];
            const missing = requiredHeaders.filter((h) => !headers.includes(h));

            if (missing.length > 0) {
                showError(`File thiếu các cột: ${missing.join(", ")}`);
                return false;
            }

            checkValidMovie(json2)
            return true;
        } catch (err) {
            console.error(err);
            showError("Không thể đọc file Excel này!");
            return false;
        }
    };

    function normalizeDate(str) {
            const date = XLSX.SSF.parse_date_code(str);
            const yyyy = date.y;
            const mm = String(date.m).padStart(2, "0");
            const dd = String(date.d).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
    }


    const checkValidMovie = (movies) => {
        movies.forEach((movie, index) => {
            let check = false
            if (!movie.tenPhim || !movie.daoDien || !movie.thoiLuong || !movie.ngayKhoiChieu || !movie.tuoi || !movie.theLoai) {
                showError(`Dòng ${index + 2}: Thiếu thông tin bắt buộc (tên phim, đạo diễn, thời lượng, ngày khởi chiếu, tuổi, thể loại)`);
                check = true;
            }
            const date = new Date(normalizeDate(movie.ngayKhoiChieu));
            if (isNaN(date.getTime())) {
                showError(`Dòng ${index + 2}: Ngày khởi chiếu không hợp lệ yyyy-MM-dd`);
                check = true;
            }
            const isFuture = date > new Date();
            const duration = parseInt(movie.thoiLuong);
            const isValidDuration = !isNaN(duration) && duration > 0;
            const validAgeSet = ["0", "13", "16", "18"];
            const isValidAge = validAgeSet.includes(String(movie.tuoi).trim());
            if (!isFuture) {
                showError(`Dòng ${index + 2}: Ngày khởi chiếu phải là tương lai`);
                check = true;
            }
            if (!isValidDuration) {
                showError(`Dòng ${index + 2}: Thời lượng phải là số dương`);
                check = true;
            }
            if (!isValidAge) {
                showError(`Dòng ${index + 2}: Tuổi phải thuộc nhóm [0, 13, 16, 18]`);
                check = true;
            }
            return !check;
        });
    }


    const handleUploadExcel = async () => {
        if (!selectedFile) {
            showError("Vui lòng chọn file Excel");
            return;
        }
        if (await checkVaidExcelFile(selectedFile) === false) {
            setSelectedFile(null);
            closeModal();
            return;
        }
        try {
            showInfo("Đang upload file, quá trình có thể mất vài phút...");
            const result = await movieService.uploadMoviesExcel(selectedFile);
            if (result.success) {
                console.log(result.message);
                showSuccess("Upload file thành công: " + result.message);
                fetchMovies();
            }
            else {
                showError("Lỗi khi upload file: " + result.message);
            }
        } catch (error) {
            showError("Lỗi khi upload file: " + error.message);
        } finally {
            closeModal();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        showSuccess("Upload File thành công");

    };

    const fetchMovies = async (page = 1) => {
        try {
            setLoading(true);
            const result = await movieService.getMoviesPaginated(page);
            if (result.success) {
                const {currentMovies, totalPages, currentPage} = result.data;
                setMovies(currentMovies);
                setTotalPages(totalPages);
                setCurrentPage(currentPage);
            } else {
                setMovies([]);
                setTotalPages(1);
                setCurrentPage(1);
            }
        } catch (error) {
            showError(error.message);
            setMovies([]);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    };

    const searchMovies = async (page = 1, keyword) => {
        try {
            setLoading(true);
            const result = await movieService.searchMovies(page, keyword);
            if (result.success) {
                const {currentMovies, totalPages, currentPage} = result.data;
                showSuccess(result.message);
                setMovies(currentMovies);
                setTotalPages(totalPages);
                setCurrentPage(currentPage);
            } else {
                setMovies([]);
                setTotalPages(1);
                setCurrentPage(1);
            }
        } catch (error) {
            showError(error.message);
            setMovies([]);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }

    const openModal = (type, movie = null) => {
        setModalType(type);
        setSelectedMovie(movie);
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
        } else if (type === 'add') {
            setFormData({
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
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setSelectedMovie(null);
        setErrors({});
        setSelectedMovie(null)
    };

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


        const ngayKhoiChieu = new Date(formData.ngayKhoiChieu);
        const hientai = new Date();

        if (ngayKhoiChieu <= hientai) {
            newErrors.ngayKhoiChieu = "Ngày khởi chiếu phải sau ngày hiện tại";
        }


        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({})


        // Chuyển mảng id thể loại sang mảng tên thể loại
        const theLoaiNames = categories
            .filter(cat => formData.theLoai.includes(cat.maTheLoai))
            .map(cat => cat.tenTheLoai);
        const submitData = {...formData, theLoai: theLoaiNames};
        try {
            if (modalType === 'add') {
                const result = await movieService.createMovie(submitData);
                if (result.success) {
                    showSuccess('Thêm phim thành công!');
                    fetchMovies();
                    closeModal();
                } else {
                    showError('Có lỗi xảy ra: ' + result.message);
                }
            } else if (modalType === 'edit') {
                const result = await movieService.updateMovie(selectedMovie.maPhim, submitData);
                if (result.success) {
                    showSuccess('Cập nhật phim thành công!');
                    fetchMovies();
                    closeModal();
                } else {
                    showError('Có lỗi xảy ra: ' + result.message);
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showError('Có lỗi xảy ra: ' + error.message);
        }
    };

    const handleDelete = async (movieId) => {
        if (window.confirm('Bạn có chắc muốn xóa phim này?')) {
            try {
                const result = await movieService.deleteMovie(movieId);
                if (result.success) {
                    showSuccess('Xóa phim thành công!');
                    fetchMovies();
                } else {
                    showError('Có lỗi xảy ra: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting movie:', error);
                showError('Có lỗi xảy ra' + result.message);
            }
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const currentMovies = movies;

    const handleSearchInput = (e) => {
        if (e.key === 'Enter' || e.key === 'Spacebar') {
            searchMovies(searchTerm);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white p-3 rounded">
                                <Film size={32}/>
                            </div>
                            <div>
                                <h1 className="mb-0 h3">Quản Lý Phim</h1>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => openModal('add', null)}
                        >
                            <Plus size={20} className="me-2" style={{verticalAlign: 'middle'}}/>
                            Thêm Phim
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Tìm kiếm phim, đạo diễn..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchInput}
                        />
                    </div>
                </div>
            </div>

            {/* Movies Panel/Grid - Card view, hình ảnh nằm trong panel, shadow bao quanh card */}
            <div className="row g-4">
                {currentMovies?.length > 0 ? (
                    currentMovies.map((movie) => (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={movie.maPhim}
                             onClick={() => navigate(`/admin/film/${movie.maPhim}`)}
                             style={{cursor: 'pointer'}}
                        >
                            <div className="card h-100 shadow rounded-4 border-0 d-flex flex-column"
                                 style={{
                                     transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                 }}
                                 onMouseEnter={(e) => {
                                     e.currentTarget.style.transform = 'scale(1.04)';
                                     e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
                                 }}
                                 onMouseLeave={(e) => {
                                     e.currentTarget.style.transform = 'scale(1)';
                                     e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
                                 }}>
                                <div className="card-body d-flex flex-column align-items-center p-3">
                                    <div className="mb-3 w-100 d-flex justify-content-center">
                                        {/* Nút Xóa phim */}
                                        <button
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(movie.maPhim);
                                            }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                        <img
                                            src={movie.hinhAnh || '/images/no_image.jpg'}
                                            alt={movie.tenPhim}
                                            className="rounded-3"
                                            style={{
                                                width: '100%',
                                                maxWidth: '240px',
                                                height: '240px',
                                                objectFit: 'cover',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                                            }}
                                            onError={(e) => {
                                                e.target.src = '/images/no_image.jpg';
                                            }}
                                        />
                                    </div>
                                    <h5 className="card-title fw-bold mb-1 text-center">
                                        {movie.tenPhim}</h5>
                                    <div className="mb-2 text-center">
                    <span className={`badge ${
                        movie.trangThai === 'Đang chiếu' ? 'bg-success' :
                            movie.trangThai === 'Sắp chiếu' ? 'bg-warning' :
                                'bg-secondary'
                    }`}>
                      {movie.trangThai}
                    </span>
                                    </div>
                                    <div className="d-flex align-items-center gap-4">
                                        <div className="mb-1 text-center" style={{fontSize: '0.95em'}}>
                                            <i className="bi bi-clock"
                                               style={{color: '#0d6efd', fontSize: '1.2rem', marginRight: '6px'}}></i>
                                            {formatDuration(movie.thoiLuong)}</div>
                                        <div className="mb-1 text-center" style={{fontSize: '0.95em'}}>
                                            <i className="bi bi-calendar-event"
                                               style={{color: '#0d6efd', fontSize: '1.2rem', marginRight: '6px'}}></i>
                                            {formatDate(movie.ngayKhoiChieu)}
                                        </div>
                                    </div>
                                    <div className="mb-1 text-muted text-center" style={{fontSize: '0.95em'}}>Đạo
                                        diễn: {movie.daoDien}</div>
                                    <div className="mb-1 text-center" style={{fontSize: '0.95em'}}>Thể
                                        loại: {movie.listTheLoai ? movie.listTheLoai.map(tl => tl.tenTheLoai).join(', ') : 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <i className="bi bi-film display-1 text-muted"></i>
                        <p className="text-muted mt-2">Không tìm thấy phim nào.</p>
                    </div>
                )}
            </div>

            {/* Pagination giữ nguyên */}
            {totalPages && totalPages > 1 && (
                <div className="card-footer bg-white mt-4">
                    <nav>
                        <ul className="pagination pagination-sm justify-content-center mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Trước
                                </button>
                            </li>
                            {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Sau
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal show d-block modal-overlay">
                    <div className={`modal-dialog modal-lg ${modalType === 'view' ? 'modal-xl' : ''} mx-auto`}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {(modalType === 'add' || modalType === "excel") && 'Thêm phim mới'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeModal}
                                ></button>
                            </div>
                            {(modalType === 'add' || modalType === 'edit') ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Tên phim
                                                        <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.tenPhim ? 'is-invalid' : ''}`}
                                                        value={formData.tenPhim}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            tenPhim: e.target.value
                                                        })}
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
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            daoDien: e.target.value
                                                        })}
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
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            dienVien: e.target.value
                                                        })}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Thể loại
                                                        <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className={`form-select`}
                                                        multiple
                                                        value={formData.theLoai}
                                                        onChange={e => {
                                                            const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                                                            setFormData({...formData, theLoai: selected});
                                                        }}
                                                        required
                                                    >
                                                        {categories.map(cat => (
                                                            <option key={cat.maTheLoai}
                                                                    value={cat.maTheLoai}>{cat.tenTheLoai}</option>
                                                        ))}
                                                    </select>
                                                    <small className="text-muted">Giữ Ctrl để chọn nhiều thể
                                                        loại</small>
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
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    thoiLuong: e.target.value
                                                                })}
                                                            />
                                                            {errors.thoiLuong && (
                                                                <div
                                                                    className="invalid-feedback">{errors.thoiLuong}</div>
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
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    tuoi: e.target.value
                                                                })}
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
                                                        className={`form-control ${errors.ngayKhoiChieu ? 'is-invalid' : ''}`}
                                                        value={formData.ngayKhoiChieu}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            ngayKhoiChieu: e.target.value
                                                        })}
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
                                                        className={`form-select ${errors.trangThai ? 'is-invalid' : ''}`}
                                                        value={formData.trangThai}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            trangThai: e.target.value
                                                        })}
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
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            hinhAnh: e.target.value
                                                        })}
                                                        placeholder="https://example.com/image.jpg"
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">URL Trailer</label>
                                                    <input
                                                        type="url"
                                                        className="form-control"
                                                        value={formData.trailerURL}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            trailerURL: e.target.value
                                                        })}
                                                        placeholder="https://youtube.com/watch?v=..."
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
                                        <div>
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={() => {
                                                    openModal("excel", null)
                                                }}
                                            >
                                                <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                                                Excel
                                            </button>
                                        </div>

                                        <button type="submit" className="btn btn-primary">
                                            {modalType === 'add' ? 'Thêm phim' : 'Lưu thay đổi'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="modal-body">
                                        <label className="form-label">Chọn file Excel để tải lên phim
                                            <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group mb-3">
                                            <input
                                                id="fileInput"
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleFileChange}
                                                className="form-control"
                                                style={{cursor: 'pointer'}}
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <i className="bi bi-upload"></i>
                                            </button>
                                        </div>
                                        {selectedFile && (
                                            <div className="alert alert-info">
                                                <i className="bi bi-file-earmark-check"></i> Đã chọn
                                                file: {selectedFile.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                            Đóng
                                        </button>
                                        <button type="submit" className="btn btn-primary"
                                                onClick={handleUploadExcel}
                                        >
                                            {(modalType === 'add' || modalType === "excel") ? 'Thêm phim' : 'Lưu thay đổi'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .modal-title {
                    color: black;
                    display: flex;
                    gap: 0.2rem
                }

                .form-label {
                    color: black;
                    display: flex;
                    gap: 0.2rem;
                    font-weight: 700;
                    height: 24px;
                }
            `}
            </style>

        </div>
    );
}

export default MovieManagement;

