import React, { useEffect, useState } from 'react';
import roomService from '../../services/roomService';
import { useNavigate } from 'react-router-dom';
import {Film, House, Plus} from "lucide-react";
import {useToast} from "../common/Toast.jsx";

const RoomManager = ({ setActiveMenu, setSelectedRoomId }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({ tenPhong: '' });
  const {showError, showSuccess} = useToast();
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRooms(currentPage);
  }, [currentPage]);

  const fetchRooms = async (page) => {
    setLoading(true);
    const result = await roomService.getRoomsPaginated(page);
    if (result.success) {
      setRooms(result.data.currentItems);
      setTotalPages(result.data.totalPages);
      setCurrentPage(result.data.currentPage);
    }
    setLoading(false);
  };

  const openModal = (type, room = null) => {
    setModalType(type);
    setSelectedRoom(room);
    setFormData({ tenPhong: room ? room.tenPhong : '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedRoom(null);
    setFormData({ tenPhong: '' });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      const newErrors = {};
      if (!formData.tenPhong.trim()) {
          newErrors.tenPhong = 'Vui lòng nhập tên phòng';
      }
      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }
      setErrors({})



    if (modalType === 'add') {
      const result = await roomService.createRoom(formData);
      if (result.success) {
        fetchRooms(currentPage);
        showSuccess("Thêm phòng thành công");
        closeModal();
      } else {
        showError(result.data || result.message);
      }
    } else if (modalType === 'edit') {
      const result = await roomService.updateRoom(selectedRoom.maPhongChieu, formData);
      if (result.success) {
        fetchRooms(currentPage);
        closeModal();
        showSuccess("Cập nhật phòng thành công");
      } else {
        showError(result.data || result.message);
      }
    }
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Bạn có chắc muốn xóa phòng chiếu này?')) {
      const result = await roomService.deleteRoom(roomId);
      if (result.success) {
        fetchRooms(currentPage);
        showSuccess("Xóa phòng thành công");
      } else {
        showError(result.message || result.data);
      }
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    return (
      <nav aria-label="Page navigation">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &laquo;
            </button>
          </li>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            </li>
          ))}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const handleViewSeats = (roomId) => {
      navigate(`/admin/rooms/${roomId}/seats`);
  };


  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
          <div className="card shadow-sm mb-4">
              <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                          <div className="bg-primary text-white p-3 rounded">
                              <House size={32}/>
                          </div>
                          <div>
                              <h1 className="mb-0 h3">Quản Lý phòng chiếu</h1>
                          </div>
                      </div>
                      <button
                          className="btn btn-primary btn-lg"
                          onClick={() => openModal('add', null)}
                      >
                          <Plus size={20} className="me-2" style={{verticalAlign: 'middle'}}/>
                          Thêm phòng chiếu
                      </button>
                  </div>
              </div>
          </div>
      </div>
      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : (
            <>
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    {/*<th>Mã phòng</th>*/}
                    <th>Tên phòng</th>
                    <th>Số lượng ghế</th>
                    <th style={{ width: '160px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room, idx) => (
                    <tr key={room.maPhongChieu}>
                      <td>{(currentPage - 1) * 10 + idx + 1}</td>
                      <td>{room.tenPhong}</td>
                      <td>{room.soLuongGhe}</td>
                      <td>
                           <button
                          className="btn btn-sm btn-info me-2" onClick={() => handleViewSeats(room.maPhongChieu)}>
                          <i className="bi bi-grid me-1"></i>
                        </button>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => openModal('edit', room)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(room.maPhongChieu)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && renderPagination()}
            </>
          )}
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="modal show d-block modal-overlay">
          <div className="modal-dialog mx-auto">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalType === 'add' ? 'Thêm phòng chiếu' : 'Chỉnh sửa phòng chiếu'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên phòng chiếu
                        <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className= {`form-control ${errors.tenPhong ? 'is-invalid' : ''}`}
                      value={formData.tenPhong}
                      onChange={e => setFormData({ ...formData, tenPhong: e.target.value })}
                    />
                      {errors.tenPhong && (
                          <div className="invalid-feedback">{errors.tenPhong}</div>
                      )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                  <button type="submit" className="btn btn-primary">{modalType === 'add' ? 'Thêm' : 'Cập nhật'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        <style jsx> {`
            .modal-title
            {
                color: black;
                display: flex;
                gap: 0.2rem
            }
            
            .form-label {
                display: flex;
                gap: 0.2rem !important;
                color: black;
                font-weight: 700;
                height: 24px;
            }
        `}
        </style>
    </div>
  );
};

export default RoomManager;