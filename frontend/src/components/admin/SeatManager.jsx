import React, {useEffect, useState} from 'react';
import seatService from '../../services/seatService';
import {useNavigate, useParams} from 'react-router-dom';
import {useToast} from '../common/Toast';
import {roomService} from "../../services/index.js";
import {Armchair, MoveLeft} from "lucide-react";


const SeatManager = () => {
    const [seatTypes, setSeatTypes] = useState([]); // Tất cả loại ghế
    const [roomSeats, setRoomSeats] = useState([]); // Danh sách ghế của phòng
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedSeatType, setSelectedSeatType] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [seatFormData, setSeatFormData] = useState({
        tenGhe: '',
        maLoaiGhe: '',
    });
    const [seatsMap, setSeatsMap] = useState({});
    const [addSeat, setAddSeat] = useState('');
    const [editingSeat, setEditingSeat] = useState(null);
    const [hoveringSeatType, setHoveringSeatType] = useState(null);
    const {roomId} = useParams();
    const navigate = useNavigate();
    const {showSuccess, showError} = useToast();
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchAllSeatTypesAndRoomSeats();
    }, [roomId]);

    // Lấy tất cả loại ghế và ghế của phòng
    const fetchAllSeatTypesAndRoomSeats = async () => {
        setLoading(true);
        const [allTypesRes, roomSeatsRes] = await Promise.all([
            seatService.getAllSeatTypes(roomId),
            roomService.getRoomSeats(roomId)
        ]);

        if (allTypesRes.success && roomSeatsRes.success) {
            setSeatTypes(allTypesRes.data || []);
            setRoomSeats(Array.isArray(roomSeatsRes.data.listGhe) ? roomSeatsRes.data.listGhe : []);
            // Map ghế cho sơ đồ rạp
            const map = {};
            (Array.isArray(roomSeatsRes.data.listGhe) ? roomSeatsRes.data.listGhe : []).forEach(seat => {
                map[seat.tenGhe] = {
                    ...seat,
                    loaiGhe: seat.loaiGhe.tenLoaiGhe,
                    maLoaiGhe: seat.loaiGhe.maLoaiGhe,
                    phuThu: seat.loaiGhe.phuThu,
                    color: getSeatTypeColor(seat.loaiGhe.tenLoaiGhe)
                };
            });
            setSeatsMap(map);
        } else {
            showError('Lỗi khi tải dữ liệu loại ghế hoặc ghế phòng');
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
        const hex = bgColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 150 ? "black" : "white";
    };

    // Open modal for adding/editing
    const openModal = (type, item = null, itemname = null) => {
        setModalType(type);
        if (type === 'addSeat') {
            setAddSeat(itemname);
            setSeatFormData({
                tenGhe: itemname,
                maLoaiGhe: null,
            })
        } else if (type === 'changeSeatType') {
            setEditingSeat(item);
            setSeatFormData({
                tenGhe: item.tenGhe,
                maLoaiGhe: item.maLoaiGhe,
            })
        }
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setSelectedSeatType(null);
        setSelectedSeat(null);
        setEditingSeat(null);
        setSeatFormData({tenGhe: '', maLoaiGhe: ''});
        setErrors({})
    };

    // Handle form input change for seat type

    // Handle form input change for seat
    const handleSeatInputChange = (e) => {
        const {name, value} = e.target;
        setSeatFormData({
            ...seatFormData,
            [name]: value,
        });
    };

  const handleDeleteSeat = async (e, seat) => {
      e.preventDefault();
      e.stopPropagation();

      const result = await seatService.deleteSeat(seat.maGhe);
      if (result.success) {
          showSuccess('Xóa ghế thành công');
          fetchAllSeatTypesAndRoomSeats();
          closeModal();
      } else {
          showError(result.message || 'Lỗi khi xóa ghế');
      }
  }

  const handleCreatSeat = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const newErrors = {};
      if (!seatFormData.maLoaiGhe) newErrors.maLoaiGhe = 'Vui lòng chọn loại ghế';

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      setErrors({});

      const result = await seatService.createSeat({
          maPhongChieu: roomId,
          tenGhe: seatFormData.tenGhe || addSeat,
          maLoaiGhe: seatFormData.maLoaiGhe,
      });

      if (result.success) {
          showSuccess('Thêm ghế thành công');
          fetchAllSeatTypesAndRoomSeats();
          closeModal();
      } else {
          showError(result.message || 'Lỗi khi thêm ghế');
      }
  }

  const handleUpdateSeat = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const newErrors = {};
      if (!seatFormData.maLoaiGhe) newErrors.maLoaiGhe = 'Vui lòng chọn loại ghế';

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      setErrors({});

      const result = await seatService.updateSeat(editingSeat.maGhe, {
          tenGhe: editingSeat.tenGhe,
          maLoaiGhe: seatFormData.maLoaiGhe
      });

      if (result.success) {
          showSuccess('Thay đổi loại ghế thành công');
          fetchAllSeatTypesAndRoomSeats();
          closeModal();
      } else {
          showError(result.message || 'Lỗi khi thay đổi loại ghế');
      }
  }
  // Generate seat grid for cinema layout
  const renderSeatGrid = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsPerRow = 10;
    
    return (
      <div className="mb-5">
        {/* Screen */}
        <div className="text-center mb-4">
          <div 
            className="mx-auto mb-2" 
            style={{ 
              width: '80%', 
              height: '15px', 
              backgroundColor: '#e9ecef', 
              transform: 'perspective(100px) rotateX(-5deg)',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)'
            }}
          ></div>
          <p className="text-center text-muted mb-4">Màn hình</p>
        </div>
        
        {/* Seat Grid */}
        <div className="d-flex flex-column align-items-center">
          {rows.map((row) => (
            <div key={row} className="d-flex mb-2 align-items-center">
              <div className="me-3" style={{ width: '20px' }}>{row}</div>
              <div className="d-flex">
                {Array.from({ length: seatsPerRow }, (_, i) => {
                  const seatName = `${row}${String(i + 1).padStart(2, '0')}`;
                  const seat = seatsMap[seatName];
                  
                  return (
                    <div 
                      key={i} 
                      className="mx-1 seat-item"
                      onClick={() => seat ? openModal('changeSeatType', seat) : openModal('addSeat', null, seatName)}
                    >
                      <div
                        className={`d-flex justify-content-center align-items-center rounded ${seat ? 'cursor-pointer' : ''}`}
                        style={{
                          width: row === 'I' || row === 'J' ? '45px' : '35px',
                          height: row === 'I' || row === 'J' ? '45px' : '35px',
                          backgroundColor: seat ? seat.color : '#f8f9fa',
                          border: seat ? '1px solid #212529' : '1px dashed #adb5bd',
                          color: seat && seat.loaiGhe !== 'Thường' ? '#212529' : '#fff',
                          fontSize: '0.75rem',
                          position: 'relative',
                        }}
                        title={seat ? `${seatName} - ${seat.loaiGhe}` : `Chưa có ghế ${seatName}`}
                      >
                        {seat ? (
                          <>
                            {seatName}
                            {seat.loaiGhe === 'Couple' && (
                              <i className="bi bi-heart-fill position-absolute" 
                                 style={{ top: '2px', right: '2px', fontSize: '10px' }}></i>
                            )}
                          </>
                        ) : seatName}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="ms-3" style={{ width: '20px' }}>{row}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (

    <div className="container-fluid p-4">
      <div className="row mb-4">
          <div className="card shadow-sm mb-4">
              <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                      <button
                          className="btn btn-secondary btn-lg"
                          onClick={() => navigate(-1)}
                      >
                          <MoveLeft size={20} className="me-2" style={{verticalAlign: 'middle'}}/>
                          Quay lại
                      </button>
                      <div className="d-flex align-items-center gap-3">
                          <div className="bg-primary text-white p-3 rounded">
                              <Armchair size={32}/>
                          </div>
                          <div>
                              <h1 className="mb-0 h3">  Quản lý ghế - Phòng {roomId} </h1>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Cinema Layout */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Sơ đồ rạp</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : (
                renderSeatGrid()
              )}
            </div>
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
                    const seatsOfType = roomSeats.filter(seat => seat.loaiGhe.maLoaiGhe === type.maLoaiGhe);
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
                            style={{ backgroundColor: getSeatTypeColor(type.tenLoaiGhe), color: getTextColor(type.tenLoaiGhe.toLowerCase()) }}
                          >
                            <h6 className="mb-0">{type.tenLoaiGhe}</h6>
                          </div>
                          <div className="card-body">
                            <p className="mb-2">Phụ thu: <strong>{type.phuThu.toLocaleString('vi-VN')}đ</strong></p>
                              <p className="mb-2">Số lượng ghế: <strong>{seatsOfType.length}</strong></p>
                            {seatsOfType.length > 0 && (
                              <div className="mt-3">
                                <div className="d-flex flex-wrap gap-1">
                                  {seatsOfType.slice(0, 15).map((seat) => (
                                    <span
                                      key={seat.maGhe}
                                      className="badge bg-secondary"
                                      style={{
                                        backgroundColor: getSeatTypeColor(type.tenLoaiGhe) + ' !important',
                                        color: getTextColor(type.tenLoaiGhe.toLowerCase())
                                      }}
                                      title="Click để thay đổi loại ghế"
                                      onClick={() => openModal('changeSeatType', { ...seat, maLoaiGhe: type.maLoaiGhe, loaiGhe: type.tenLoaiGhe })}
                                    >
                                      {seat.tenGhe}
                                    </span>
                                  ))}
                                  {seatsOfType.length > 15 && (
                                    <span className="badge bg-light text-dark">
                                      +{seatsOfType.length - 15}
                                    </span>
                                  )}
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

      {/* Modal for Change Seat Type */}
      {showModal && (modalType === 'changeSeatType' || modalType === 'addSeat') && (
        <div className="modal show d-block modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                    {modalType === 'addSeat' ? 'Thêm ghế' : 'Thay đổi loại ghế'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên ghế
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingSeat?.tenGhe || addSeat}
                      readOnly
                    />
                  </div>


                  <div className="mb-3">
                    <label htmlFor="maLoaiGhe" className="form-label">Loại ghế
                        <span className="text-danger">*</span>
                    </label>
                    <select
                        className={`form-select ${errors.maLoaiGhe ? 'is-invalid' : ''}`}
                      id="maLoaiGhe"
                      name="maLoaiGhe"
                      value={seatFormData.maLoaiGhe}
                      onChange={handleSeatInputChange}
                    >
                      <option value="">-- Chọn loại ghế --</option>
                      {seatTypes.map((type) => (
                        <option key={type.maLoaiGhe} value={type.maLoaiGhe}>
                          {type.tenLoaiGhe} ({type.phuThu.toLocaleString('vi-VN')} VNĐ)
                        </option>
                      ))}
                    </select>
                      {errors.maLoaiGhe && (
                          <div className="invalid-feedback">{errors.maLoaiGhe}</div>
                      )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                    {(modalType === "changeSeatType") && (
                    <button type="button" className="btn btn-danger"
                        onClick={(e) => handleDeleteSeat(e, editingSeat)}
                    >
                        Xóa
                    </button>
                    )}
                  <button type="button" className="btn btn-primary"
                      onClick={(e) =>
                      (modalType === 'addSeat') ? handleCreatSeat(e) : handleUpdateSeat(e)
                  }>
                    {modalType === 'addSeat' ? 'Thêm' : 'Cập nhật'}
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

export default SeatManager;

