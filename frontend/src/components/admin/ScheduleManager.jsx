import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Film,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Copy,
  AlertCircle,
  Filter,
  Search,
  Edit,
} from "lucide-react";
import scheduleService from "../../services/scheduleService";
import roomService from "../../services/roomService";
import { v4 as uuidv4 } from "uuid";
import {useToast} from "../common/Toast.jsx";

const ScheduleManager = () => {
        const [showtimes, setShowtimes] = useState([]);
        const [rooms, setRooms] = useState([]);
        const [movies, setMovies] = useState([]);
        const [loading, setLoading] = useState(true);
        const [currentPage, setCurrentPage] = useState(1);
        const [totalPages, setTotalPages] = useState(1);
        const [showModal, setShowModal] = useState(false);
        const [modalType, setModalType] = useState('');
        const [selectedSchedule, setSelectedSchedule] = useState(null);
        const {showError, showSuccess} = useToast();
        const [errors, setErrors] = useState({});
        const [formData, setFormData] = useState({
            donGiaCoSo: 90000,
            thoiGianBatDau: '',
            maPhim: '',
            maPhongChieu: ''
        });

        useEffect(() => {
            fetchSchedules();
            fetchRooms();
            fetchMovies();
        }, []);

        const fetchSchedules = async () => {
            setLoading(true);
            const result = await scheduleService.getAllSchedules();
            if (result.success) {
                setShowtimes(result.data);
            }
            setLoading(false);
        };

        const fetchRooms = async () => {
            const result = await roomService.getAllRooms()
            if (result.success) {
                setRooms(result.data);
            }
        };

        const fetchMovies = async () => {
            const result = await scheduleService.getMoviesForSchedule();
            if (result.success) {
                setMovies(result.data);
            }
        };


        const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("en-CA"));
        const [selectedRoom, setSelectedRoom] = useState('all');
        const [searchTerm, setSearchTerm] = useState('');

          const formatISODateTime = (dateTimeStr) => {
            const date = new Date(dateTimeStr);
            return date.toISOString().slice(0, 16);
            };

        function calculateEndTimeWithDate(startTime, durationMinutes) {
            const [datePart, timePart] = startTime.split('T');
            const [hours, minutes] = timePart.split(':').map(Number);


            const dateObj = new Date(datePart);
            dateObj.setHours(hours);
            dateObj.setMinutes(minutes + durationMinutes);

            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hour = String(dateObj.getHours()).padStart(2, '0');
            const minute = String(dateObj.getMinutes()).padStart(2, '0');

            console.log(day)
            return `${year}-${month}-${day}T${hour}:${minute}`;
        }

    function dateOnlyFromIsoString(iso) {
        if (!iso) return '';
        // "2025-10-12T23:28:00" => "2025-10-12"
        return iso.split('T')[0];
    }

    const openModal = (schedule = null, type) => {
            setModalType(type);
            setSelectedSchedule(schedule);

            if (schedule) {
                setFormData({
                    donGiaCoSo: schedule.donGiaCoSo,
                    thoiGianBatDau: formatISODateTime(schedule.thoiGianBatDau),
                    maPhim: schedule.phim.maPhim || '',
                    maPhongChieu: schedule.phongChieu.maPhongChieu
                });
            } else {
                setFormData({
                    donGiaCoSo: 90000,
                    thoiGianBatDau: '',
                    maPhim: movies.length > 0 ? movies[0].maPhim : '',
                    maPhongChieu: rooms.length > 0 ? rooms[0].maPhongChieu : ''
                });
            }

            setShowModal(true);
        };

        const closeModal = () => {
            setShowModal(false);
            setModalType('');
            setSelectedSchedule(null);
            setFormData({
                donGiaCoSo: 90000,
                thoiGianBatDau: '',
                maPhim: '',
                maPhongChieu: ''
            });
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            const newErrors = {};
            if (!formData.thoiGianBatDau) newErrors.thoiGianBatDau = 'Vui lòng chọn thời gian bắt đầu';
            if (!formData.donGiaCoSo) newErrors.donGiaCoSo = 'Đơn giá cơ sở không hợp lệ';

            if (formData.thoiGianBatDau) {
                const inputDate = new Date(formData.thoiGianBatDau); // parse chuỗi thành Date
                const now = new Date();

                if (isNaN(inputDate.getTime())) {
                    newErrors.thoiGianBatDau = 'Thời gian bắt đầu không hợp lệ';
                } else if (inputDate < now) {
                    newErrors.thoiGianBatDau = 'Thời gian bắt đầu phải là tương lai';
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
            setErrors({})

            if (modalType === 'add') {
                const result = await scheduleService.createSchedule(formData);
                if (result.success) {
                    showSuccess("Thêm suất chiếu thành công");
                    await fetchSchedules();
                    closeModal();
                } else {
                    showError(result.message || 'Có lỗi xảy ra khi thêm suất chiếu');
                }
            } else if (modalType === 'edit') {
                const result = await scheduleService.updateSchedule(selectedSchedule.maSuatChieu, formData);
                if (result.success) {
                    showSuccess("Cập nhật suất chiếu thành công");
                    await fetchSchedules();
                    closeModal();
                } else {
                    showError(result.message || 'Có lỗi xảy ra khi cập nhật suất chiếu');
                }
            }
        };

        const handleDelete = async (scheduleId) => {
            if (window.confirm('Bạn có chắc muốn xóa suất chiếu này?')) {
                const result = await scheduleService.deleteSchedule(scheduleId);
                if (result.success) {
                    showSuccess("Xóa suất chiếu thành công")
                    await fetchSchedules();
                } else {
                    showError (result.message || 'Có lỗi xảy ra khi xóa suất chiếu');
                }
            }
        };

        const handlePageChange = (page) => {
            if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
            }
        };

        const handleInputChange = (e) => {
            const {name, value} = e.target;
            setFormData({
                ...formData,
                [name]: value
            });
        };

        const handleDuplicate = async (show) => {
            const newShow = {
                donGiaCoSo: show.donGiaCoSo,
                thoiGianBatDau: show.thoiGianBatDau,
                maPhim: show.phim.maPhim,
                maPhongChieu: show.phongChieu.maPhongChieu
            };

            newShow.thoiGianBatDau = show.thoiGianBatDau.slice(0, 10) + 'T' +  calculateEndTime(show.thoiGianBatDau, show.phim.thoiLuong);
            newShow.thoiGianBatDau = calculateEndTimeWithDate(newShow.thoiGianBatDau, 70);
            setFormData(
                newShow
            )
             const newShowTemp = {
                ...show,
                 thoiGianBatDau: newShow.thoiGianBatDau,
             }
             if (formData.maPhim ===  '') setLoading(true)
                else {
                    setLoading(false)
                 const result = await scheduleService.createSchedule(formData)
                 if (result.success) {
                     fetchSchedules();
                     newShowTemp.maSuatChieu = result.data.maSuatChieu;
                     setShowtimes([...showtimes, show]);
                 } else {
                     showError(result.message || 'Có lỗi xảy ra khi thêm suất chiếu');
                 }
             }
        };

        const calculateEndTime = (startTime, duration) => {
            const date = new Date(startTime);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const totalMinutes = hours * 60 + minutes + duration;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;
            return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        };

        const checkConflict = (show) => {
            const endTime = calculateEndTime(show.startTime, show.duration);
            return showtimes.some(s => {
                if (s.id === show.id || s.room !== show.room || s.date !== show.date) return false;
                const sEndTime = calculateEndTime(s.startTime, s.duration);
                return (show.startTime >= s.startTime && show.startTime < sEndTime) ||
                    (endTime > s.startTime && endTime <= sEndTime) ||
                    (show.startTime <= s.startTime && endTime >= sEndTime);
            });
        };

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        };

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        const changeDate = (days) => {
            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() + days);
            setSelectedDate(currentDate.toISOString().split('T')[0]);
        };

        const getWeekDays = () => {
            const days = [];
            const current = new Date(selectedDate);
            const startOfWeek = new Date(current);
            startOfWeek.setDate(current.getDate() - current.getDay());

            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                days.push(day.toISOString().split('T')[0]);
            }
            return days;
        };

        const filteredShowtimes = showtimes.filter(show => {
            const showDate = show.thoiGianBatDau.split('T')[0];
            const matchDate = showDate === selectedDate;
            const matchRoom = selectedRoom === 'all' || show.phongChieu.maPhongChieu === selectedRoom;
            const matchSearch = show.phim.tenPhim.toLowerCase().includes(searchTerm.toLowerCase());
            return matchDate && matchRoom && matchSearch;
        });

        const groupedByRoom = rooms.reduce((acc, room) => {
            acc[room.maPhongChieu] = filteredShowtimes.filter(show => show.phongChieu.maPhongChieu === room.maPhongChieu)
                .sort((a, b) => a.thoiGianBatDau.localeCompare(b.thoiGianBatDau));
            return acc;
        }, {});

        const totalRevenue = filteredShowtimes.reduce((sum, show) => sum + show.donGiaCoSo * show.phongChieu.soLuongGhe, 0);

        const cardColors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary'];

        return (
            <>
                <link
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                    rel="stylesheet"
                />
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

                <div className="bg-light min-vh-100 py-4">
                    <div className="container-fluid" style={{maxWidth: '1800px'}}>
                        {/* Header */}
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary text-white p-3 rounded">
                                            <Calendar size={32}/>
                                        </div>
                                        <div>
                                            <h1 className="mb-0 h3">Quản Lý Suất Chiếu</h1>
                                            <p className="text-muted mb-0">Hệ thống quản lý rạp chiếu phim</p>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={() => openModal(null, 'add')}
                                    >
                                        <Plus size={20} className="me-2" style={{verticalAlign: 'middle'}}/>
                                        Thêm Suất Chiếu
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-3">
                                <div className="card shadow-sm border-primary border-start border-4">
                                    <div className="card-body">
                                        <div className="text-muted small mb-1">Tổng suất chiếu</div>
                                        <div className="h2 mb-0 text-primary fw-bold">{filteredShowtimes.length}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card shadow-sm border-info border-start border-4">
                                    <div className="card-body">
                                        <div className="text-muted small mb-1">Tổng ghế</div>
                                        <div className="h2 mb-0 text-info fw-bold">
                                            {filteredShowtimes.reduce((sum, s) => sum + s.phongChieu.soLuongGhe, 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card shadow-sm border-success border-start border-4">
                                    <div className="card-body">
                                        <div className="text-muted small mb-1">Doanh thu tiềm năng</div>
                                        <div
                                            className="h2 mb-0 text-success fw-bold">{formatCurrency(totalRevenue)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card shadow-sm border-warning border-start border-4">
                                    <div className="card-body">
                                        <div className="text-muted small mb-1">Phòng hoạt động</div>
                                        <div className="h2 mb-0 text-warning fw-bold">
                                            {new Set(filteredShowtimes.map(s => s.phongChieu.maPhongChieu)).size}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            {/* Sidebar */}
                            <div className="col-lg-3 mb-4">
                                {/* Week Calendar */}
                                <div className="card shadow-sm mb-3">
                                    <div className="card-body">
                                        <h5 className="card-title d-flex align-items-center">
                                            <Calendar size={20} className="me-2"/>
                                            Tuần này
                                        </h5>
                                        <div className="d-grid gap-2">
                                            {getWeekDays().map(day => {
                                                const dayShowtimes = showtimes.filter(s => dateOnlyFromIsoString(s.thoiGianBatDau) === day);
                                                const isSelected = day === selectedDate;
                                                const dayDate = new Date(day);

                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => setSelectedDate(day)}
                                                        className={`btn text-start ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    >
                                                        <div
                                                            className="d-flex align-items-center justify-content-between">
                                                            <div>
                                                                <div className="small">
                                                                    {dayDate.toLocaleDateString('vi-VN', {weekday: 'short'})}
                                                                </div>
                                                                <div className="fw-bold">
                                                                    {dayDate.getDate()}/{dayDate.getMonth() + 1}
                                                                </div>
                                                            </div>
                                                            {dayShowtimes.length > 0 && (
                                                                <span
                                                                    className={`badge ${isSelected ? 'bg-white text-primary' : 'bg-primary'}`}>
                                {dayShowtimes.length}
                              </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Room Filter */}
                                <div className="card shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title d-flex align-items-center">
                                            <Filter size={20} className="me-2"/>
                                            Lọc theo phòng
                                        </h5>
                                        <div className="list-group">
                                            <button
                                                className={`list-group-item list-group-item-action ${selectedRoom === 'all' ? 'active' : ''}`}
                                                onClick={() => setSelectedRoom('all')}
                                            >
                                                Tất cả phòng
                                            </button>
                                            {rooms.map(room => (
                                                <button
                                                    key={room.maPhongChieu}
                                                    className={`list-group-item list-group-item-action ${selectedRoom === room.maPhongChieu ? 'active' : ''}`}
                                                    onClick={() => setSelectedRoom(room.maPhongChieu)}
                                                >
                                                    {room.tenPhong}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="col-lg-9">
                                <div className="card shadow-sm">
                                    <div className="card-body">
                                        {/* Header */}
                                        <div className="d-flex align-items-center justify-content-between mb-4">
                                            <div className="d-flex align-items-center gap-3">
                                                <button
                                                    onClick={() => changeDate(-1)}
                                                    className="btn btn-outline-primary"
                                                >
                                                    <ChevronLeft size={20}/>
                                                </button>
                                                <h2 className="mb-0 h4">
                                                    {formatDate(selectedDate)}
                                                </h2>
                                                <button
                                                    onClick={() => changeDate(1)}
                                                    className="btn btn-outline-primary"
                                                >
                                                    <ChevronRight size={20}/>
                                                </button>
                                            </div>

                                            {/* Search */}
                                            <div className="input-group" style={{maxWidth: '300px'}}>
                      <span className="input-group-text">
                        <Search size={20}/>
                      </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Tìm phim..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                         {/*Showtimes by Room */}
                                        {rooms.map(room => {
                                            const roomShowtimes = groupedByRoom[room.maPhongChieu]
                                            if (selectedRoom !== 'all' && selectedRoom !== room.maPhongChieu) return null;

                                            return (
                                                <div key={room.maPhongChieu} className="mb-4">
                                                    <div
                                                        className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                          <span className="badge bg-primary fs-6 px-3 py-2">
                            🎬 {room.tenPhong}
                          </span>
                                                        <small className="text-muted">
                                                            {roomShowtimes.length} suất chiếu
                                                        </small>
                                                    </div>

                                                    {roomShowtimes.length === 0 ? (
                                                        <div
                                                            className="text-center py-5 border border-2 border-dashed rounded">
                                                            <Film size={48} className="text-muted mb-2"/>
                                                            <p className="text-muted mb-0">Chưa có suất chiếu</p>
                                                        </div>
                                                    ) : (
                                                        <div className="row g-3">
                                                            {roomShowtimes.map((show, idx) => {
                                                                const beginDate = new Date(show.thoiGianBatDau);
                                                                const beginTime = beginDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                                                const endTime = calculateEndTime(show.thoiGianBatDau, show.phim.thoiLuong);
                                                                const hasConflict = checkConflict(show);
                                                                const colorClass = hasConflict ? 'danger' : cardColors[idx % cardColors.length];

                                                                return (
                                                                    <div key={show.maSuatChieu} className="col-md-6">
                                                                        <div
                                                                            className={`card border-${colorClass} border-2 shadow-sm h-100`}>
                                                                            {hasConflict && (
                                                                                <div
                                                                                    className="card-header bg-danger text-white py-2">
                                                                                    <small
                                                                                        className="d-flex align-items-center">
                                                                                        <AlertCircle size={16}
                                                                                                     className="me-1"/>
                                                                                        Trùng lịch!
                                                                                    </small>
                                                                                </div>
                                                                            )}
                                                                            <div className="card-body">
                                                                                <h5 className="card-title text-dark mb-3">
                                                                                    🎥 {show.phim.tenPhim.length > 30
                                                                                        ? show.phim.tenPhim.substring(0, 30) + "..."
                                                                                        : show.phim.tenPhim}
                                                                                </h5>

                                                                                <div className="row g-2 mb-3">
                                                                                    <div className="col-6">
                                                                                        <div
                                                                                            className={`bg-${colorClass} bg-opacity-10 rounded p-3`}>
                                                                                            <div
                                                                                                className="d-flex align-items-center text-muted small mb-1">
                                                                                                <Clock size={16}
                                                                                                       className="me-1"/>
                                                                                                Thời gian
                                                                                            </div>
                                                                                            <div
                                                                                                className="fw-bold text-dark h5 mb-0">
                                                                                                {beginTime} - {endTime}
                                                                                            </div>
                                                                                            <small
                                                                                                className="text-muted">({show.phim.thoiLuong} phút)</small>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="col-6">
                                                                                        <div
                                                                                            className="bg-success bg-opacity-10 rounded p-3">
                                                                                            <div
                                                                                                className="text-muted small mb-1">
                                                                                                💰 Giá vé
                                                                                            </div>
                                                                                            <div
                                                                                                className="fw-bold text-dark h5 mb-0">
                                                                                                {formatCurrency(show.donGiaCoSo)}
                                                                                            </div>
                                                                                            <small
                                                                                                className="text-muted">{show.phongChieu.soLuongGhe} ghế</small>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="d-flex gap-2">
                                                                                    <button
                                                                                        onClick={() => openModal(show, 'edit')}
                                                                                        className="btn btn-primary btn-sm flex-fill"
                                                                                    >
                                                                                        <Edit size={16}
                                                                                              className="me-1"/>
                                                                                        Sửa
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDuplicate(show)}
                                                                                        className="btn btn-secondary btn-sm"
                                                                                        title="Sao chép"
                                                                                    >
                                                                                        <Copy size={16}/>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDelete(show.maSuatChieu)}
                                                                                        className="btn btn-danger btn-sm"
                                                                                        title="Xóa"
                                                                                    >
                                                                                        <Trash2 size={16}/>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {filteredShowtimes.length === 0 && (
                                            <div className="text-center py-5">
                                                <Film size={64} className="text-muted mb-3"/>
                                                <h5 className="text-muted">Không có suất chiếu nào</h5>
                                                <p className="text-muted">Hãy thêm suất chiếu mới cho ngày này</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal */}
                    {showModal && (
                        <div className="modal show d-block modal-overlay">
                            <div className="modal-dialog mx-auto">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            {modalType === 'add' ? 'Thêm suất chiếu' : 'Chỉnh sửa suất chiếu'}
                                        </h5>
                                        <button type="button" className="btn-close" onClick={closeModal}></button>
                                    </div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="modal-body">
                                            <div className="mb-3">
                                                <label className="form-label">Phim
                                                    <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="maPhim"
                                                    value={formData.maPhim}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">-- Chọn phim --</option>
                                                    {movies.map(movie => (
                                                        <option key={movie.maPhim} value={movie.maPhim}>
                                                            {movie.tenPhim.length > 30
                                                                ? movie.tenPhim.substring(0, 30) + "..."
                                                                : movie.tenPhim}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Phòng chiếu
                                                    <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="maPhongChieu"
                                                    value={formData.maPhongChieu}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">-- Chọn phòng --</option>
                                                    {rooms.map(room => (
                                                        <option key={room.maPhongChieu} value={room.maPhongChieu}>
                                                            {room.tenPhong}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Thời gian bắt đầu
                                                    <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    className={`form-control ${errors.thoiGianBatDau ? 'is-invalid' : ''}`}
                                                    name="thoiGianBatDau"
                                                    value={formData.thoiGianBatDau}
                                                    onChange={handleInputChange}
                                                />
                                                {errors.thoiGianBatDau && (
                                                    <div className="invalid-feedback">{errors.thoiGianBatDau}</div>
                                                )}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Đơn giá cơ sở (VNĐ)
                                                    <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="donGiaCoSo"
                                                    value={formData.donGiaCoSo}
                                                    onChange={handleInputChange}
                                                    min="10000"
                                                    step="10000"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-secondary"
                                                    onClick={closeModal}>Hủy
                                            </button>
                                            <button type="submit"
                                                    className="btn btn-primary">{modalType === 'add' ? 'Thêm' : 'Cập nhật'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <style jsx> {`
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
                `} </style>
            </>
        )};
export default ScheduleManager;