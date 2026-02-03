import React, { useState, useEffect } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    CalendarCog,
    Save,
    Search,
    Calendar,
    Edit2,
    ImagePlay,
    FileCog,
    Trash
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import SeatTypeManager from "./SeatTypeManager.jsx";
import settingService from "../../services/settingService.js";
import {movieService, promotionService, serviceService} from "../../services/index.js";
import {useToast} from "../common/Toast.jsx";

const SettingsManager = () => {
    const [activeTab, setActiveTab] = useState("system");
    const [settings, setSettings] = useState([]);
    const [movie, setMovies] = useState([]);
    const [promotion, setPromotion] = useState([]);
    const [service, setService] = useState([])
    const [prevSettings, setPrevSettings] = useState([])
    const {showSuccess, showError} = useToast()
    const [errors, setErrors] = useState({});
    const [formStyle, setFormStyle] = useState('')
    const [formData, setFormData] = useState({
        maCauHinh: '',
        tieuDe: '',
        urlHinh: '',
        DoiTuong: '',
        Loai: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedImages, setSelectedImages] = useState(null);
    const categories = [
        { id: 'movie', name: 'Phim', badge: 'primary' },
        { id: 'service', name: 'Dịch vụ', badge: 'warning' },
        { id: 'promotion', name: 'Khuyến mãi', badge: 'info' },
    ];

    useEffect(() => {
        fetchSettings()
        fetchMovies()
        fetchPromotions()
        fetchService()
    },[])


    const fetchSettings = async () => {
        const caiDatHeThong = await settingService.getAllSetting();
        setSettings(caiDatHeThong.data);
        setPrevSettings(caiDatHeThong.data);
    }

    const getCategoryBadge = (category) => {
        const cat = categories.find(c => c.name === category);
        return cat?.badge || 'secondary';
    };

    const fetchMovies = async () => {
        const movies = await movieService.getAllMovies();
        if (movies.success) {
            const filteredMovies = movies.data.filter(
                (m) => m.trangThai === 'Sắp chiếu' || m.trangThai === 'Đang chiếu'
            )
            setMovies(filteredMovies);
        }
        else {
            showError(movies.message);
        }
    }


    const fetchPromotions = async () => {
        const promotions = await promotionService.getAllPromotions();
        if (promotions.success) {
            const filteredPromotions = promotions.data.filter(
                p => p.trangThai === true
            )
            setPromotion(filteredPromotions)
        }
        else {
            showError(promotions.message)
        }
    }

    const fetchService = async () => {
        const services = await serviceService.getAllServices();
        if (services.success) {
            const filteredServices = services.data.filter(
                s => s.trangThai === true
            )
            setService(filteredServices);
        }
        else {
            showError(services.message)
        }
    }

    const handleDeleteSlider = async (s) => {
        console.log(s);
        if (window.confirm("Bạn có chắc muốn xóa slider này không?")) {
            const result = await settingService.deleteSetting(s.maCauHinh);
            if (result.success) {
                showSuccess("Xóa slider thành công");
                await fetchSettings();
            } else {
                showError("Lỗi khi xóa slider: " + result.error);
            }
        }
    };

    const sliders = settings.filter((s) =>
        s.maCauHinh.includes("SLIDER")
    );

    const getSettingValue = (key) => {
        const item = settings.find(s => s.maCauHinh === key);
        return item ? item.giaTri : '';
    };

    const openModal = (style, item = null) => {
        setShowModal(true)
        setFormStyle(style)
        let id = null
        if (item !== null) {
            if (item.loai === 'Phim') {
                const match = item.tenCauHinh.match(/[0-9a-fA-F-]{36}/);
                id = match ? match[0] : null;
            } else id = item.tenCauHinh.split("-")[1].trim();
        }
        setFormData(item ? {
            maCauHinh: item.maCauHinh,
            tieuDe: item.tenCauHinh.split("-")[0].trim(),
            urlHinh: item.giaTri,
            DoiTuong: id,
            Loai: item.loai
        } : {
            maCauHinh: '',
            tieuDe: '',
            urlHinh: '',
            DoiTuong: '',
            Loai: ''
        });
        setShowModal(true);
    };

    const handleInputChange = (key, value) => {
        console.log(key, value);
        setSettings(prev =>
            prev.map(item =>
                item.maCauHinh.trim() === key
                    ? { ...item, giaTri: value }
                    : item
            )
        );
    };

    const handleInputFormDataChange = (e) => {
        if (e.target.name === 'Loai') {
            let doiTuong = null
            if (e.target.value === 'Phim' && movie.length > 0) {
                doiTuong = movie[0].maPhim;
            }
            else if (e.target.value === 'Dịch vụ' && service.length > 0) {
                doiTuong = service[0].maDv.toString();
            }
            else if (e.target.value === 'Khuyến mãi' && promotion.length > 0) {
                doiTuong = promotion[0].maKm.toString();
            }
            setFormData(prev => ({
                ...prev,
                Loai: e.target.value,
                DoiTuong: doiTuong, // reset khi đổi loại
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [e.target.name]: e.target.value
            }));
        }
    };

    const changedSettings = settings.filter(s => {
        const old = prevSettings.find(p => p.maCauHinh === s.maCauHinh);
        return old && old.giaTri !== s.giaTri;
    });

    const handleSaveChange = async () => {
        const changedSettings = settings.filter(s => {
            const old = prevSettings.find(p => p.maCauHinh === s.maCauHinh);
            return old && old.giaTri !== s.giaTri;
        });

        if (changedSettings.length === 0) {
            setErrors({})
            showError("Không có thay đổi nào để lưu!");
            return;
        }

        try {
            for (const s of changedSettings) {
                setErrors({})
                const newErrors = {};
                if (!s.giaTri.trim()) {
                    newErrors.ma = s.maCauHinh
                    newErrors.loi = "Vui lòng nhập giá trị cho " + s.tenCauHinh;
                }
                else if (s.maCauHinh === 'EMAIL_SUPPORT') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(s.giaTri)) {
                        newErrors.ma = s.maCauHinh
                        newErrors.loi = "Vui lòng nhập địa chỉ email hợp lệ";
                    }
                }
                else if (s.maCauHinh === 'TIME_HOLD_SEAT' || s.maCauHinh === 'MAX_TICKET_BOOKING' || s.maCauHinh === 'TIME_IMAGES_TRANSITION') {
                    const numberValue = Number(s.giaTri);
                    if (isNaN(numberValue) || numberValue <= 0 || !Number.isInteger(numberValue)) {
                        newErrors.ma = s.maCauHinh
                        newErrors.loi = "Vui lòng nhập số nguyên dương cho " + s.tenCauHinh;
                    }
                }
                else if (s.maCauHinh === 'HOT_LINE') {
                    const phoneRegex = /^[0-9+\-\s()]+$/;
                    if (!phoneRegex.test(s.giaTri)) {
                        newErrors.ma = s.maCauHinh
                        newErrors.loi = "Vui lòng nhập số điện thoại hợp lệ";
                    }
                }
                if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    return;
                }
                setErrors({})


                const result = await settingService.updateSetting(s);
                if (result.success) {
                    showSuccess(`Đã lưu ${s.maCauHinh} thành công`);
                    fetchSettings();
                } else {
                    showError(`Lỗi khi lưu ${s.maCauHinh}: ${result.error}`);
                }
            }
        } catch (err) {
            showError("Lỗi kết nối tới server!");
            console.error(err);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormStyle('');
        setFormData({
            maCauHinh: '',
            tieuDe: '',
            urlHinh: '',
            DoiTuong: '',
            Loai: 'Phim'
        })
        setErrors({})
    };

    const handleImageSubmit = async (e) => {
        e.preventDefault()
        setErrors({})
        const newErrors = {};
        if (!formData.tieuDe.trim()) newErrors.tieuDe = 'Vui lòng nhập tiêu đề';
        if (!formData.Loai.trim()) newErrors.Loai = 'Vui lòng chọn loại quảng cáo';
        if (formData.Loai === 'Phim' && !formData.urlHinh.trim()) {
            newErrors.urlHinh = 'Vui lòng nhập hình ảnh';
        }
        else if (formData.urlHinh) {
            try {
                new URL(formData.urlHinh);
            } catch (e) {
                newErrors.urlHinh = "Vui lòng nhập URL hình ảnh hợp lệ";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({})


        let DoiTuong = {};
        if (formData.Loai !== 'Phim') {
            if (formData.Loai === 'Khuyến mãi') {
                DoiTuong = promotion.find(p => p.maKm === formData.DoiTuong.trim())
            } else DoiTuong = service.find(p => p.maDv === parseInt(formData.DoiTuong.trim()))
        }
        console.log(formData)
        const slider = {
            maCauHinh: formData.maCauHinh,
            tenCauHinh: formData.tieuDe + ' - ' + formData.DoiTuong,
            giaTri: DoiTuong?.urlHinh || formData.urlHinh,
            loai: formData.Loai,
        }
        console.log(slider)
        let result;
        try {
            if (formStyle === "update") {
                result = await settingService.updateSetting(slider);
            }
            else result = await settingService.creatSetting(slider);
            if (result.success) {
                showSuccess(`Đã lưu ${formData.maCauHinh} thành công`);
                fetchSettings();
            } else {
                showError(`Đã có lỗi xảy ra ${result.data}`);
            }
            closeModal();
        } catch (err) {
            showError(`Đã có lỗi xảy ra ${result.data}`);
            closeModal();
        }
    }


    return (
        <div className="container-fluid p-4">
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white p-3 rounded">
                                <CalendarCog size={32}/>
                            </div>
                            <div>
                                <h1 className="mb-0 h3">Cấu hình hệ thống</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid p-4">
                <div className="card border-1 shadow-sm">
                    <div className="card-header bg-white border-1 pt-3">
                        <ul className="nav nav-tabs card-header-tabs">
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('system')}
                                >
                                    <FileCog Size={16}/> Cấu hình hệ thống
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link ${activeTab === "slider" ? "active" : ""}`}
                                    onClick={() => setActiveTab("slider")}
                                >
                                    <ImagePlay Size={16}/> Danh sách Slider
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="card-body">
                        {activeTab === "system" && (
                            <div className="card shadow-sm border-0">
                                <div className="card-body">
                                    <h5 className="fw-bold mb-3">Cấu hình hệ thống</h5>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Thời gian giữ ghế (phút)</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.ma === 'TIME_HOLD_SEAT' ? 'is-invalid' : ''}`}
                                                value={getSettingValue('TIME_HOLD_SEAT')}
                                                onChange={(e) =>
                                                    handleInputChange('TIME_HOLD_SEAT', e.target.value)
                                                }
                                            />
                                            {errors.ma === 'TIME_HOLD_SEAT' && (
                                                <div className="invalid-feedback">{errors.loi}</div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Số vé tối đa mỗi trong một phim</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.ma  === 'MAX_TICKET_BOOKING' ? 'is-invalid' : ''}`}
                                                value={getSettingValue('MAX_TICKET_BOOKING')}
                                                onChange={(e) =>
                                                    handleInputChange('MAX_TICKET_BOOKING', e.target.value)
                                                }
                                            />
                                            {errors.ma === 'MAX_TICKET_BOOKING' && (
                                                <div className="invalid-feedback">{errors.loi}</div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Thời gian chuyển ảnh slider (giây)</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.ma === 'TIME_IMAGES_TRANSITION' ? 'is-invalid' : ''}`}
                                                value={getSettingValue('TIME_IMAGES_TRANSITION')}
                                                onChange={(e) =>
                                                    handleInputChange('TIME_IMAGES_TRANSITION', e.target.value)
                                                }
                                            />
                                            {errors.ma === 'TIME_IMAGES_TRANSITION' && (
                                                <div className="invalid-feedback">{errors.loi}</div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Email hỗ trợ</label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.ma === 'EMAIL_SUPPORT' ? 'is-invalid' : ''}`}
                                                value={getSettingValue('EMAIL_SUPPORT')}
                                                onChange={(e) =>
                                                    handleInputChange('EMAIL_SUPPORT', e.target.value)
                                                }
                                            />
                                            {errors.ma === 'EMAIL_SUPPORT' && (
                                                <div className="invalid-feedback">{errors.loi}</div>
                                            )}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Hotline hệ thống</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.ma === 'HOT_LINE' ? 'is-invalid' : ''}`}
                                                value={getSettingValue('HOT_LINE')}
                                                onChange={(e) =>
                                                    handleInputChange('HOT_LINE', e.target.value)
                                                }
                                            />
                                            {errors.ma === 'HOT_LINE' && (
                                                <div className="invalid-feedback">{errors.loi}</div>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <button className="btn btn-primary mt-3"
                                                    onClick={() => handleSaveChange()}
                                            >
                                                <Save size={16}/> Lưu cấu hình
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "slider" && (
                            <div className="card shadow-sm border-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="fw-bold mb-0">Danh Sách Banner</h5>
                                            <button className={
                                                (movie.length > 0 || service.length > 0 || promotion.length > 0)
                                                    ? 'btn btn-primary d-flex align-items-center gap-2'
                                                    : 'btn btn-secondary disabled d-flex align-items-center gap-2'
                                            }
                                                    onClick={() => openModal('add', null)}
                                            >
                                                <Plus size={18}/> Thêm Mới
                                            </button>
                                    </div>

                                    {/* Search box */}
                                    <div className="input-group mb-3">
              <span className="input-group-text bg-white">
                <i className="bi bi-search"></i>
              </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm slider..."
                                        />
                                    </div>

                                    {/* Table */}
                                    <div className="table-responsive">
                                        <table className="table align-middle table-hover">
                                            <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Hình ảnh</th>
                                                <th>Tiêu đề</th>
                                                <th>Loại quảng cáo</th>
                                                <th className="text-center">Thao Tác</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {Array.isArray(settings) && sliders.map((slider) => (
                                                <tr key={slider.maCauHinh}>
                                                    <td>{slider.maCauHinh}</td>
                                                    <td>
                                                        <img
                                                            src={slider.giaTri}
                                                            alt={slider.tenCauHinh}
                                                            className="rounded"
                                                            style={{ width: 80, height: 50, objectFit: "cover" }}
                                                        />
                                                    </td>
                                                    <td>{slider.tenCauHinh.split("-")[0]}</td>
                                                    <td>
                                                        <span
                                                            className={`badge bg-${getCategoryBadge(slider.loai)}`}>
                                                    {categories.find(c => c.name === slider.loai)?.name}
                                                </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button className="btn btn-outline-primary btn-sm me-2"
                                                                onClick={() => openModal('update', slider)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button className="btn btn-outline-danger btn-sm me-2"
                                                                onClick={() => handleDeleteSlider(slider)}
                                                        >
                                                            <Trash size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Seat Type */}
            {showModal && (
                <div className="modal show d-block modal-overlay">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {formStyle === 'add' ? 'Thêm mới banner quảng cáo' : 'Chỉnh sửa banner quảng cáo'}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleImageSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="tieuDe" className="form-label">Tiêu đề quảng cáo
                                            <span className="text-danger">*</span>
                                            </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.tieuDe ? 'is-invalid' : ''}`}
                                            id="tieuDe"
                                            name="tieuDe"
                                            value={formData.tieuDe}
                                            onChange={handleInputFormDataChange}
                                        />
                                        {errors.tieuDe && (
                                            <div className="invalid-feedback">{errors.tieuDe}</div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="loai" className="form-label">Loại quảng cáo
                                            <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select ${errors.Loai ? 'is-invalid' : ''}`}
                                            id="loai"
                                            name="Loai"
                                            value={formData.Loai || ''}   // đảm bảo có default value
                                            onChange={handleInputFormDataChange}
                                            required
                                        >
                                            <option value="">-- Chọn loại quảng cáo --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {errors.Loai && (
                                            <div className="invalid-feedback">{errors.Loai}</div>
                                        )}
                                    </div>
                                    {formData.Loai && (
                                        <div className="mb-3">
                                            <label htmlFor="phim" className="form-label">
                                                {(formData.Loai === 'Phim' && movie.length > 0) ?
                                                    'Phim' :
                                                    (formData.Loai === 'Dịch vụ' && movie.length > 0) ?
                                                        'Dịch vụ' : 'Khuyến mãi'
                                                }
                                                <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                id="phim"
                                                name="DoiTuong"
                                                value={formData.DoiTuong}   // đảm bảo có default value
                                                onChange={handleInputFormDataChange}
                                            >
                                                {formData.Loai === 'Phim' ?
                                                    movie.map(m => (
                                                        <option key={m.maPhim} value={m.maPhim}>{m.tenPhim}</option>
                                                    ))
                                                    :
                                                    formData.Loai === 'Dịch vụ' ?
                                                        service.map(s => (
                                                            <option key={s.maDv} value={s.maDv}>{s.tenDv}</option>
                                                        )) :
                                                        promotion.map(p => (
                                                            <option key={p.maKm} value={p.maKm}>{p.maCode}</option>
                                                        ))
                                                }
                                            </select>
                                        </div>)}

                                    {formData.Loai === 'Phim' ?
                                        <div className="mb-3">
                                            <label htmlFor="urlHinh" className="form-label">Hình ảnh
                                                <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="url"
                                                className={`form-control ${errors.urlHinh ? 'is-invalid' : ''}`}
                                                id="urlHinh"
                                                name="urlHinh"
                                                value={formData.urlHinh}
                                                placeholder="https://example.com/image.jpg"
                                                onChange={handleInputFormDataChange}
                                                //readOnly= {formData.Loai === 'Phim'}
                                            />
                                            {errors.urlHinh && (
                                                <div className="invalid-feedback">{errors.urlHinh}</div>
                                            )}
                                        </div> : <></> }
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" onClick={handleImageSubmit}>
                                        Cập nhật
                                    </button>
                                </div>
                            </form>
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
            `}
            </style>
        </div>
    );
}

export default SettingsManager;

