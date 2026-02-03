import React, {useEffect, useState} from 'react';
import seatService from '../../services/seatService';
import {useParams} from 'react-router-dom';
import {useToast} from '../common/Toast';
import {roomService} from "../../services/index.js";
import {Armchair, Plus} from "lucide-react";


const SeatTypeManager = () => {
    const [seatTypes, setSeatTypes] = useState([]); // Tất cả loại ghế
    const [roomSeats, setRoomSeats] = useState([]); // Danh sách ghế của phòng
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedSeatType, setSelectedSeatType] = useState(null);
    const [formData, setFormData] = useState({
        tenLoaiGhe: '',
        phuThu: 0,
    });
    const [seatFormData, setSetFormData] = useState({
        tenGhe: '',
        maLoaiGhe: '',
    });
    const [seatsMap, setSeatsMap] = useState({});
    const [addSeat, setAddSeat] = useState('');
    const [editingSeat, setEditingSeat] = useState(null);
    const [hoveringSeatType, setHoveringSeatType] = useState(null);
    const {roomId} = useParams();
    const {showSuccess, showError} = useToast();
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchAllSeatTypesAndSeat();
    }, []);

    // Lấy tất cả loại ghế và ghế của phòng
    const fetchAllSeatTypesAndSeat = async () => {
        setLoading(true);
        const [allTypesRes, roomSeatsRes, rooms] = await Promise.all([
            seatService.getAllSeatTypes(roomId),
            roomService.getAllSeats(),
        ]);
        if (allTypesRes.success || roomSeatsRes.success) {
            setSeatTypes(allTypesRes.data || []);
            setRoomSeats(roomSeatsRes.data || []);
        } else {
            showError('Lỗi khi tải dữ liệu loại ghế hoặc ghế phòng hoặc phòng');
        }
        setLoading(false);
    };

    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
         // sinh màu theo hue
        return `hsl(${hash % 360}, 70%, 60%)`;
    };
    // Lấy màu theo loại ghế
    const getSeatTypeColor = (seatType) => {
        switch (seatType.toLowerCase()) {
            case 'thường':
                return '#6c757d';
            case 'vip':
                return '#ffc107';
            case 'couple':
                return '#dc3545';
            default:
                return stringToColor(seatType.toLowerCase());
        }
    };

    const getTextColor = (bgColor) => {
        // Chuyển màu hex sang RGB
        const hex = bgColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        // Tính độ sáng (theo công thức chuẩn WCAG)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        // Nếu sáng → dùng màu đen, nếu tối → dùng màu trắng
        return brightness > 150 ? "black" : "white";
    };


    // Open modal for adding/editing
    const openModal = (type, item = null, itemname = null) => {
        setModalType(type);

        if (type === 'addSeatType' || type === 'editSeatType') {
            setSelectedSeatType(item);
            setFormData(item ? {
                tenLoaiGhe: item.tenLoaiGhe,
                phuThu: item.phuThu
            } : {
                tenLoaiGhe: '',
                phuThu: 0
            });

        }
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setSelectedSeatType(null);
        setEditingSeat(null);
        setFormData({tenLoaiGhe: '', phuThu: 0});
        setSetFormData({tenGhe: '', maLoaiGhe: ''});
        setErrors({})
    };

    // Handle form input change for seat type
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: name === 'phuThu' ? parseFloat(value) : value,
        });
    };

    // Submit seat type form
    const handleSeatTypeSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.tenLoaiGhe.trim()) newErrors.tenLoaiGhe = 'Vui lòng nhập tên loại ghế';
        if (!formData.phuThu < 0)
            newErrors.phuThu = 'Vui lòng nhập phụ thu hợp lệ';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({})



        if (modalType === 'addSeatType') {
           await handleAddSeatType()
        } else if (modalType === 'editSeatType') {
            await handleUpdateSeatType()
        }
    };

    const handleAddSeatType = async (e) => {
        const result = await seatService.createSeatType(formData);
        if (result.success) {
            showSuccess('Thêm loại ghế thành công');
            fetchAllSeatTypesAndSeat();
            closeModal();
        } else {
            showError(result.message || 'Lỗi khi thêm loại ghế');
        }
    }

    const handleUpdateSeatType = async (e) => {
        const result = await seatService.updateSeatType(selectedSeatType.maLoaiGhe, formData);
        if (result.success) {
            showSuccess('Cập nhật loại ghế thành công');
            fetchAllSeatTypesAndSeat();
            closeModal();
        } else {
            showError(result.message || 'Lỗi khi cập nhật loại ghế');
        }
    }

    // Delete seat type
    const handleDeleteSeatType = async (seatTypeId) => {
        if (window.confirm('Bạn có chắc muốn xóa loại ghế này?')) {
            const result = await seatService.deleteSeatType(seatTypeId);
            if (result.success) {
                showSuccess('Xóa loại ghế thành công');
                fetchAllSeatTypesAndSeat();
            } else {
                showError(result.message || 'Lỗi khi xóa loại ghế');
            }
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white p-3 rounded">
                                <Armchair size={32}/>
                            </div>
                            <div>
                                <h1 className="mb-0 h3">Quản Lý Loại ghế</h1>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => openModal('addSeatType')}
                        >
                            <Plus size={20} className="me-2" style={{verticalAlign: 'middle'}}/>
                            Thêm Loại ghế
                        </button>
                    </div>
                </div>
            </div>

            {/* Seat Types */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Loại ghế</h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="d-flex justify-content-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                </div>
                            ) : (
                                <div className="row">
                                    {seatTypes.map((type) => {
                                        // Lọc ghế của phòng thuộc loại này
                                        const seatsOfType = roomSeats.filter(seat => seat.maLoaiGhe === type.maLoaiGhe);
                                        return (
                                            <div
                                                key={type.maLoaiGhe}
                                                className="col-md-4 mb-3"
                                                onMouseEnter={() => setHoveringSeatType(type.maLoaiGhe)}
                                                onMouseLeave={() => setHoveringSeatType(null)}
                                            >
                                                <div className="card h-100">
                                                    <div
                                                        className="card-header d-flex justify-content-between align-items-center"
                                                        style={{ backgroundColor: getSeatTypeColor(type.tenLoaiGhe), color: getTextColor(type.tenLoaiGhe.toLowerCase())}}
                                                    >
                                                        <h6 className="mb-0">{type.tenLoaiGhe}</h6>
                                                        <div className={`btn-group ${hoveringSeatType === type.maLoaiGhe ? 'opacity-100' : 'opacity-0'}`}>
                                                            <button
                                                                className="btn btn-sm btn-light"
                                                                onClick={() => openModal('editSeatType', type)}
                                                                title="Chỉnh sửa"
                                                            >
                                                                <i className="bi bi-pencil-fill"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-light"
                                                                onClick={() => handleDeleteSeatType(type.maLoaiGhe)}
                                                                title="Xóa"
                                                                disabled={seatsOfType.length > 0}
                                                            >
                                                                <i className="bi bi-trash-fill"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="card-body">
                                                        <p className="mb-2">Phụ thu: <strong>{type.phuThu.toLocaleString('vi-VN')}đ</strong></p>
                                                        <p className="mb-2">Số lượng ghế: <strong>{seatsOfType.length}</strong></p>
                                                        {seatsOfType.length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {Object.entries(
                                                                        seatsOfType.reduce((acc, seat) => {
                                                                            acc[seat.tenPhong] = (acc[seat.tenPhong] || 0) + 1;
                                                                            return acc;
                                                                        }, {})
                                                                    ).map(([tenPhong, count]) => (
                                                                        <span
                                                                            key={tenPhong}
                                                                            className="badge bg-secondary"
                                                                            style={{
                                                                                backgroundColor: getSeatTypeColor(type.tenLoaiGhe) + ' !important',
                                                                                color: getTextColor(type.tenLoaiGhe.toLowerCase()),
                                                                            }}
                                                                            title="Click để thay đổi loại ghế"
                                                                            onClick={() => openModal('changeSeatType', { ...seat, maLoaiGhe: type.maLoaiGhe, loaiGhe: type.tenLoaiGhe })}
                                                                        >
                                                                            {tenPhong} - {count} ghế
                                    </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Add/Edit Seat Type */}
            {showModal && (modalType === 'addSeatType' || modalType === 'editSeatType') && (
                <div className="modal show d-block modal-overlay">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modalType === 'addSeatType' ? 'Thêm loại ghế' : 'Chỉnh sửa loại ghế'}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleSeatTypeSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="tenLoaiGhe" className="form-label">Tên loại ghế
                                            <span className="text-danger">*</span>
                                            </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.tenLoaiGhe ? 'is-invalid' : ''}`}
                                            id="tenLoaiGhe"
                                            name="tenLoaiGhe"
                                            value={formData.tenLoaiGhe}
                                            onChange={handleInputChange}
                                        />
                                        {errors.tenLoaiGhe && (
                                            <div className="invalid-feedback">{errors.tenLoaiGhe}</div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="phuThu" className="form-label">Phụ thu (đ)
                                            <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className={`form-control ${errors.phuThu ? 'is-invalid' : ''}`}
                                            id="phuThu"
                                            name="phuThu"
                                            value={formData.phuThu}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="1000"
                                        />
                                        {errors.phuThu && (
                                            <div className="invalid-feedback">{errors.phuThu}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary">
                                        {modalType === 'addSeatType' ? 'Thêm' : 'Cập nhật'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add CSS for hover effects */}
            <style jsx="true">{`
        .modal-overlay {
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1050;
        }
        
        .seat-item {
          transition: transform 0.2s;
        }
        
        .seat-item:hover {
          transform: scale(1.1);
          z-index: 1;
          cursor: pointer;
        }
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
    );
};

export default SeatTypeManager;

