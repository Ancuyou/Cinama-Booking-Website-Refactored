import React, {useEffect, useState} from 'react';
import { Ticket, Plus, Edit2, Trash2, Search, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import promotionService from "../../services/promotionService.js";
import {serviceService} from "../../services/index.js";
import {useToast} from "../common/Toast.jsx";

const PromotionManager = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [promotions, setPromotions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
     const {showError, showSuccess} = useToast()
    const [formData, setFormData] = useState({
        maKm: '',
        tenKm: '',
        moTa: '',
        giaTri: '',
        ngayBatDau: '',
        ngayKetThuc: '',
        maCode: '',
        soLuong: '',
        urlHinh: '',
        trangThai: true
    });
    const [errors, setErrors] = useState({});
    const fetchPromotions = async (page = 1) => {
        setLoading(true);
        const result = await promotionService.getAllPromotionsPageable(page);
        const { currentItems, totalPages, currentPage } = result.data;
        try {
            if (result.success) {
                setPromotions(currentItems);
                setTotalPages(totalPages);
                setCurrentPage(currentPage);
            } else {
                setPromotions([]);
                setTotalPages(1);
                setCurrentPage(1);
            }
        }
        catch (error) {
            showError("Lỗi kết nối API: " + error.message)
            setPromotions([]);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPromotions(currentPage);
    }, [currentPage])


    const [editingId, setEditingId] = useState(null);
    const activePromotions = promotions.filter(p => p.trangThai === true).length;
    const totalUsage = promotions.reduce((sum, p) => sum + p.ves.length, 0);
    const avgUsageRate = promotions.length > 0
        ? (promotions.reduce((sum, p) => sum + (p.ves.length / p.soLuong * 100), 0) / promotions.length).toFixed(1)
        : 0;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const searchProducts = async (tenDv = '', danhMuc = '', page = 1) => {
        const result = await serviceService.searchServices(tenDv, danhMuc, page = 1);
        if (result.success) {
            const { currentItems, totalPages, currentPage } = result.data;
            setCurrentProducts(currentItems);
            setTotalPages(totalPages);
            setCurrentPage(currentPage);
        } else {
            setCurrentProducts([]);
            setTotalPages(1);
            setCurrentPage(1);
        }
    }

    const filteredPromotions = promotions.filter(promo =>
        promo.tenKm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.maCode.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.tenKm.trim()) newErrors.tenKm = 'Vui lòng nhập tên khuyến mãi';
        if (!formData.maCode.trim()) newErrors.maCode = 'Vui lòng nhập mã code';
        if (!formData.giaTri || formData.giaTri <= 0)
            newErrors.giaTri = 'Vui lòng nhập giá trị giảm hợp lệ';
        if (!formData.ngayBatDau) newErrors.ngayBatDau = 'Vui lòng chọn ngày bắt đầu';
        if (!formData.ngayKetThuc) newErrors.ngayKetThuc = 'Vui lòng chọn ngày kết thúc';
        if (!formData.soLuong || formData.soLuong <= 0)
            newErrors.soLuong = 'Vui lòng nhập giới hạn sử dụng hợp lệ';
        if (!formData.urlHinh.trim()) newErrors.urlHinh = 'Vui lòng nhập URL hình ảnh';


        if (formData.trangThai === null || formData.trangThai === undefined) {
            newErrors.trangThai = 'Vui lòng chọn trạng thái';
        }

        const ngayKetThuc = new Date(formData.ngayKetThuc);
        const hientai = new Date();

        if (formData.trangThai === true && ngayKetThuc <= hientai) {
            newErrors.ngayKetThuc = "Ngày kết thúc phải sau ngày hiện tại nếu khuyến mãi đang hoạt động";
        }


        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({})

        if (editingId) {
            const result = await promotionService.updatePromotion(editingId, formData);
            if (result.success) {
                setPromotions(promotions.map(promo =>
                    promo.maKm === editingId
                        ? result.data
                        : promo
                ));
                showSuccess("Cập nhập dịch vụ thành công!")
            }
            else {
                showError(result.data);
            }

            setEditingId(null);
        } else {
            const  result = await promotionService.createPromotion(formData)
            if (result.success) {
                result.data.ves = [];
                setPromotions([...promotions, result.data]);
                showSuccess("Thêm mới thành công");
            } else {
                showError(result.data);
            }
        }

        setFormData({
            maKm: null,
            tenKm: '',
            moTa: '',
            giaTri: '',
            ngayBatDau: '',
            ngayKetThuc: '',
            maCode: '',
            soLuong: '',
            urlHinh: '',
            trangThai: true
        });
        setActiveTab('list');
    };

    const handleEdit = (promo) => {
        setErrors({})
        setFormData({
            maKm : promo.maKm,
            tenKm: promo.tenKm,
            moTa: promo.moTa,
            giaTri: promo.giaTri,
            maCode: promo.maCode,
            ngayBatDau: promo.ngayBatDau,
            ngayKetThuc: promo.ngayKetThuc,
            soLuong: promo.soLuong,
            urlHinh: promo.urlHinh,
            trangThai: promo.trangThai
        });
        setEditingId(promo.maKm);
        setActiveTab('form');
    };

    const handleDelete = (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
            const result = promotionService.deletePromotion(id)
            try {
                setPromotions(promotions.filter(promo => promo.maKm !== id));
                showSuccess("Xóa dịch vụ thành công");
            } catch (error)
            {
                showError(error.message);
            }
        }
    };

    const handleCancel = () => {
        setFormData({
            maKm: null,
            tenKm: '',
            moTa: '',
            giaTri: '',
            ngayBatDau: '',
            ngayKetThuc: '',
            maCode: '',
            soLuong: '',
            urlHinh: '',
            trangThai: true
        });
        setErrors({})
        setEditingId(null);
        setActiveTab('list');
    };

    const handleToggleStatus = async (id) => {
        const newPromotion = promotions.find(p => p.maKm === id);
        const ngayKetThuc = new Date(newPromotion.ngayKetThuc);
        const hientai = new Date();

        if (newPromotion.trangThai !== true && ngayKetThuc <= hientai) {
            showError("Ngày kết thúc phải sau ngày hiện tại nếu khuyến mãi đang hoạt động")
            return
        }
        const result = await promotionService.updatePromotion(id, {...newPromotion, trangThai: newPromotion.trangThai !== true});
        if (!result.success) {
            showError(result.message);
            setPromotions(promotions.map(p =>
                p.maKm === id ? newPromotion : p
            ));
        }
        else {
            setPromotions(promotions.map(p =>
                p.maKm === id ? result.data : p
            ));
        }
    }

    return (
        <div className="min-vh-100 bg-light">
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
                rel="stylesheet"
            />

            <nav className="navbar navbar-dark bg-danger shadow-sm">
                <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 d-flex align-items-center">
            <Ticket className="me-2" size={28} />
            Quản Lý Khuyến Mãi Rạp Chiếu Phim
          </span>
                </div>
            </nav>

            <div className="container-fluid p-4">
                <div className="row mb-4">
                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1 small">Tổng Khuyến Mãi</p>
                                        <h3 className="mb-0">{promotions.length}</h3>
                                    </div>
                                    <div className="bg-primary bg-opacity-10 p-2 rounded">
                                        <Ticket className="text-primary" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1 small">Đang Hoạt Động</p>
                                        <h3 className="mb-0 text-success">{activePromotions}</h3>
                                    </div>
                                    <div className="bg-success bg-opacity-10 p-2 rounded">
                                        <TrendingUp className="text-success" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1 small">Tổng Lượt Dùng</p>
                                        <h3 className="mb-0">{totalUsage.toLocaleString()}</h3>
                                    </div>
                                    <div className="bg-warning bg-opacity-10 p-2 rounded">
                                        <Users className="text-warning" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1 small">Tỷ Lệ Sử Dụng TB</p>
                                        <h3 className="mb-0">{avgUsageRate}%</h3>
                                    </div>
                                    <div className="bg-info bg-opacity-10 p-2 rounded">
                                        <DollarSign className="text-info" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 pt-3">
                        <ul className="nav nav-tabs card-header-tabs">
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('list')}
                                >
                                    Danh Sách Khuyến Mãi
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'form' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('form')}
                                >
                                    <Plus size={16} className="me-1" />
                                    {editingId ? 'Chỉnh Sửa' : 'Thêm Mới'}
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="card-body">
                        {activeTab === 'list' && (
                            <div>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <div className="input-group">
                      <span className="input-group-text bg-white">
                        <Search size={18} />
                      </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Tìm kiếm theo tên hoặc mã khuyến mãi..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {loading ? (
                                        <div className="d-flex justify-content-center py-5">
                                            <div className="spinner-border text-primary"></div>
                                        </div>
                                    ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                        <tr>
                                            <th style={{width: '50px'}}>ID</th>
                                            <th>Hình Ảnh</th>
                                            <th>Tên Khuyến Mãi</th>
                                            <th>Mã Code</th>
                                            <th>Giảm Giá</th>
                                            <th>Thời Gian</th>
                                            <th>Sử Dụng</th>
                                            <th>Trạng Thái</th>
                                            <th style={{width: '120px'}}>Thao Tác</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredPromotions.map(promo => (
                                            <tr key={promo.maKm}>
                                                <td>{promo.maKm}</td>
                                                <td>
                                                    <img
                                                        src={promo.urlHinh}
                                                        alt={promo.tenKm}
                                                        className="rounded"
                                                        style={{width: '80px', height: '50px', objectFit: 'cover'}}
                                                    />
                                                </td>
                                                <td>
                                                    <strong>{promo.tenKm}</strong>
                                                    <br />
                                                    <small className="text-muted">{promo.moTa}</small>
                                                </td>
                                                <td>
                                                    <code className="bg-light px-2 py-1 rounded">{promo.maCode}</code>
                                                </td>
                                                <td>
                            <span className="badge bg-danger">
                              {`${promo.giaTri}%`}
                            </span>
                                                </td>
                                                <td>
                                                    <small>
                                                        <Calendar size={14} className="me-1" />
                                                        {promo.ngayBatDau} đến {promo.ngayKetThuc}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <small>{promo.ves.length} / {promo.soLuong}</small>
                                                        <div className="progress" style={{height: '4px'}}>
                                                            <div
                                                                className="progress-bar bg-success"
                                                                style={{width: `${(promo.ves.length / promo.soLuong) * 100}%`}}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                            <span className={`badge ${promo.trangThai === true ? 'bg-success' : 'bg-secondary'}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleToggleStatus(promo.maKm)}>
                                {promo.trangThai === true ? 'Hoạt động' : 'Hết hạn'}
                            </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-1"
                                                        onClick={() => handleEdit(promo)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(promo.maKm)}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                    )}
                            </div>
                        )}

                        {activeTab === 'form' && (
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-8">
                                        <div className="mb-3">
                                            <label className="form-label">Tên Khuyến Mãi *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.tenKm ? 'is-invalid' : ''}`}
                                                name="tenKm"
                                                value={formData.tenKm}
                                                onChange={handleInputChange}
                                                placeholder="VD: Giảm 50% Vé Xem Phim"
                                                required
                                            />
                                            {errors.tenKm && (
                                                <div className="invalid-feedback">{errors.tenKm}</div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Mô Tả *</label>
                                            <textarea
                                                className=  "form-control"
                                                name="moTa"
                                                value={formData.moTa}
                                                onChange={handleInputChange}
                                                rows="3"
                                                placeholder="Mô tả chi tiết về chương trình khuyến mãi"
                                            />
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Mã Code *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control text-uppercase ${errors.maCode ? 'is-invalid' : ''}`}
                                                    name="maCode"
                                                    value={formData.maCode}
                                                    onChange={handleInputChange}
                                                    placeholder="VD: CINEMA50"
                                                    required
                                                />
                                                {errors.maCode && (
                                                    <div className="invalid-feedback">{errors.maCode}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Loại Giảm Giá</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value="Phần Trăm (%)"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Giá Trị Giảm *</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.giaTri ? 'is-invalid' : ''}`}
                                                    name="giaTri"
                                                    value={formData.giaTri}
                                                    onChange={handleInputChange}
                                                    placeholder= '50'
                                                    min={0}
                                                    max={100}
                                                    required
                                                />
                                                {errors.giaTri && (
                                                    <div className="invalid-feedback">{errors.giaTri}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Giới Hạn Sử Dụng *</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.soLuong ? 'is-invalid' : ''}`}
                                                    name="soLuong"
                                                    value={formData.soLuong}
                                                    onChange={handleInputChange}
                                                    placeholder="1000"
                                                />
                                                {errors.soLuong && (
                                                    <div className="invalid-feedback">{errors.soLuong}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Ngày Bắt Đầu *</label>
                                                <input
                                                    type="date"
                                                    className={`form-control ${errors.ngayBatDau ? 'is-invalid' : ''}`}
                                                    name="ngayBatDau"
                                                    value={formData.ngayBatDau}
                                                    onChange={handleInputChange}
                                                    min={new Date().toISOString().split("T")[0]}
                                                    required
                                                />
                                                {errors.ngayBatDau && (
                                                    <div className="invalid-feedback">{errors.ngayBatDau}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Ngày Kết Thúc *</label>
                                                <input
                                                    type="date"
                                                    name="ngayKetThuc"
                                                    className={`form-control ${errors.ngayKetThuc ? 'is-invalid' : ''}`}
                                                    value={formData.ngayKetThuc}
                                                    onChange={handleInputChange}
                                                    min={formData.ngayBatDau || new Date().toISOString().split("T")[0]}
                                                    required
                                                />
                                                {errors.ngayKetThuc && (
                                                    <div className="invalid-feedback">{errors.ngayKetThuc}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">URL Hình Ảnh *</label>
                                            <input
                                                type="url"
                                                name="urlHinh"
                                                className={`form-control ${errors.urlHinh ? 'is-invalid' : ''}`}
                                                value={formData.urlHinh}
                                                onChange={handleInputChange}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                            {errors.urlHinh && (
                                                <div className="invalid-feedback">{errors.urlHinh}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Trạng Thái</label>
                                            <div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        id="statusActive"
                                                        value="active"
                                                        checked={formData.trangThai === true}
                                                        onChange={(e) => setFormData({ ...formData, trangThai: true })}
                                                    />
                                                    <label className="form-check-label" htmlFor="statusActive">
                                                        Hoạt động
                                                    </label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        id="statusInactive"
                                                        value="inactive"
                                                        checked={formData.trangThai === false}
                                                        onChange={(e) => setFormData({ ...formData, trangThai: false })}
                                                    />
                                                    <label className="form-check-label" htmlFor="statusInactive">
                                                        Hết hạn
                                                    </label>
                                                </div>
                                            </div>
                                            {errors.trangThai && (
                                                <div className="invalid-feedback d-block">{errors.trangThai}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-md-4">
                                        <div className="card bg-light border-0">
                                            <div className="card-body">
                                                <h6 className="card-title">Preview</h6>
                                                {formData.urlHinh && (
                                                    <img
                                                        src={formData.urlHinh}
                                                        alt="Preview"
                                                        className="img-fluid rounded mb-3"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                )}
                                                <p className="mb-1"><strong>{formData.tenKm || 'Tên khuyến mãi'}</strong></p>
                                                <p className="small text-muted mb-2">{formData.moTa || 'Mô tả...'}</p>
                                                {formData.maCode && (
                                                    <code className="bg-white px-2 py-1 rounded d-inline-block mb-2">
                                                        {formData.maCode}
                                                    </code>
                                                )}
                                                {formData.giaTri && (
                                                    <div>
                            <span className="badge bg-danger">
                              Giảm {`${formData.giaTri}%`}
                            </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4">
                                    <button type="button" onClick={handleSubmit} className="btn btn-danger">
                                        <Plus size={18} className="me-1" />
                                        {editingId ? 'Cập Nhật' : 'Thêm Khuyến Mãi'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PromotionManager;