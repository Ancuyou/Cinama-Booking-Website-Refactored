import React, { useState, useEffect } from 'react';
import seatService from '../../services/seatService';

const SeatSelection = ({ scheduleData, onSeatsSelect, selectedSeats = [] }) => {
  const [seatMap, setSeatMap] = useState({});
  const [seatTypes, setSeatTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookedSeats, setBookedSeats] = useState([]);

  useEffect(() => {
    if (scheduleData) {
      fetchSeatData();
      fetchBookedSeats();
    }
  }, [scheduleData]);

  const fetchSeatData = async () => {
    setLoading(true);
    console.log('Fetching seat type data...');
    console.log('Schedule Data:', scheduleData);
    const result = await seatService.getSeatTypesByRoom(scheduleData.phongChieu.maPhongChieu
);
    if (result.success) {
      console.log('Seat Types retrieved:', result.data);
      setSeatTypes(result.data);
      
      // Create seat map for easy access
      const map = {};
      result.data.forEach(type => {
        console.log(`Processing seat type: ${type.tenLoaiGhe}, seats count: ${type.listGhe?.length || 0}`);
        if (type.listGhe && Array.isArray(type.listGhe)) {
          type.listGhe.forEach(seat => {
            map[seat.tenGhe] = {
              ...seat,
              loaiGhe: type.tenLoaiGhe,
              phuThu: type.phuThu,
              color: getSeatTypeColor(type.tenLoaiGhe)
            };
          });
        } else {
          console.warn(`No seats found for seat type: ${type.tenLoaiGhe}`);
        }
      });
      console.log('Seat map created with', Object.keys(map).length, 'seats');
      setSeatMap(map);
    } else {
      console.error('Failed to fetch seat types:', result.message);
    }
    setLoading(false);
  };

  const fetchBookedSeats = async () => {
    // Fetch booked seats for this schedule
    try {
      console.log('Fetching booked seats for schedule:', scheduleData.maSuatChieu);
      const result = await seatService.getBookedSeats(scheduleData.maSuatChieu);
      if (result.success) {
        console.log('Booked seats:', result.data);
        setBookedSeats(result.data || []);
      } else {
        console.error('Failed to fetch booked seats:', result.message);
      }
    } catch (error) {
      console.error('Error fetching booked seats:', error);
    }
  };

  const getSeatTypeColor = (seatType) => {
    switch (seatType.toLowerCase()) {
      case 'thường':
        return '#6c757d'; // Grey
      case 'vip':
        return '#ffc107'; // Yellow
      case 'couple':
        return '#dc3545'; // Red
      default:
        return '#6c757d';
    }
  };

  const getSeatStatus = (seatName) => {
    // Check if seat is booked (bookedSeats is array of objects with maGhe and tenGhe)
    if (bookedSeats.some(bookedSeat => bookedSeat.tenGhe === seatName)) {
      return 'booked';
    }
    if (selectedSeats.some(seat => seat.tenGhe === seatName)) {
      return 'selected';
    }
    return 'available';
  };

  const handleSeatClick = (seatName) => {
    const seat = seatMap[seatName];
    if (!seat || getSeatStatus(seatName) === 'booked') {
      return;
    }

    const isSelected = selectedSeats.some(s => s.tenGhe === seatName);
    let newSelectedSeats;

    if (isSelected) {
      // Remove seat from selection
      newSelectedSeats = selectedSeats.filter(s => s.tenGhe !== seatName);
    } else {
      // Add seat to selection
      newSelectedSeats = [...selectedSeats, seat];
    }

    onSeatsSelect(newSelectedSeats);
  };

  const renderSeatGrid = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsPerRow = 10;
    
    return (
      <div className="seat-grid">
        {/* Screen */}
        <div className="text-center mb-4">
          <div 
            className="mx-auto mb-2 screen" 
            style={{ 
              width: '80%', 
              height: '15px', 
              backgroundColor: '#e9ecef', 
              transform: 'perspective(100px) rotateX(-5deg)',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              borderRadius: '5px'
            }}
          ></div>
          <p className="text-center text-muted mb-4 fw-bold">MÀN HÌNH</p>
        </div>
        
        {/* Seat Grid */}
        <div className="d-flex flex-column align-items-center">
          {rows.map((row) => (
            <div key={row} className="d-flex mb-2 align-items-center">
              <div className="me-3 row-label" style={{ width: '20px', fontWeight: 'bold' }}>
                {row}
              </div>
              <div className="d-flex">
                {Array.from({ length: seatsPerRow }, (_, i) => {
                  const seatName = `${row}${String(i + 1).padStart(2, '0')}`;
                  const seat = seatMap[seatName];
                  const status = getSeatStatus(seatName);
                  
                  return (
                    <div 
                      key={i} 
                      className="mx-1 seat-item"
                      onClick={() => handleSeatClick(seatName)}
                    >
                      <div
                        className={`seat ${status} ${seat ? 'available-seat' : 'no-seat'}`}
                        style={{
                          width: row === 'I' || row === 'J' ? '45px' : '35px',
                          height: row === 'I' || row === 'J' ? '45px' : '35px',
                          backgroundColor: getSeatBackgroundColor(seat, status),
                          border: seat ? '2px solid #212529' : '1px dashed #adb5bd',
                          color: getSeatTextColor(seat, status),
                          fontSize: '0.75rem',
                          position: 'relative',
                          borderRadius: '8px',
                          cursor: seat && status !== 'booked' ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}
                        title={seat ? `${seatName} - ${seat.loaiGhe} (+${seat.phuThu.toLocaleString('vi-VN')} VNĐ)` : `Chưa có ghế ${seatName}`}
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
              <div className="ms-3 row-label" style={{ width: '20px', fontWeight: 'bold' }}>
                {row}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getSeatBackgroundColor = (seat, status) => {
    if (!seat) return '#f8f9fa';
    
    switch (status) {
      case 'booked':
        return '#dc3545'; // Red for booked
      case 'selected':
        return '#28a745'; // Green for selected
      default:
        return seat.color; // Original color for available
    }
  };

  const getSeatTextColor = (seat, status) => {
    if (!seat) return '#6c757d';
    
    switch (status) {
      case 'booked':
      case 'selected':
        return '#fff';
      default:
        return seat.loaiGhe !== 'Thường' ? '#212529' : '#fff';
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = scheduleData?.giaVe || 0;
    const seatPrices = selectedSeats.reduce((total, seat) => total + (seat.phuThu || 0), 0);
    return basePrice * selectedSeats.length + seatPrices;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="seat-selection">
      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Chọn ghế ngồi</h5>
              <small className="text-muted">
                Phòng {scheduleData?.phongChieu?.tenPhong} - {scheduleData?.phongChieu?.loaiPhong}
              </small>
            </div>
            <div className="card-body">
              {renderSeatGrid()}
            </div>
          </div>
          
          {/* Legend */}
          {/* Legend */}
<div className="card border-0 shadow-sm mt-3">
  <div className="card-body">
    <h6>Chú thích:</h6>
    <div className="row g-3">
      <div className="col-md-3 col-6">
        <div className="d-flex align-items-center">
          <div 
            className="seat-legend me-2" 
            style={{ backgroundColor: '#6c757d', color: '#fff' }}
          >
            A01
          </div>
          <small>Ghế thường</small>
        </div>
      </div>
      <div className="col-md-3 col-6">
        <div className="d-flex align-items-center">
          <div 
            className="seat-legend me-2" 
            style={{ backgroundColor: '#ffc107', color: '#212529' }}
          >
            A01
          </div>
          <small>Ghế VIP</small>
        </div>
      </div>
      <div className="col-md-3 col-6">
        <div className="d-flex align-items-center">
          <div 
            className="seat-legend me-2" 
            style={{ backgroundColor: '#dc3545', color: '#fff' }}
          >
            <i className="bi bi-heart-fill" style={{ fontSize: '12px' }}></i>
          </div>
          <small>Ghế Couple</small>
        </div>
      </div>
      <div className="col-md-3 col-6">
        <div className="d-flex align-items-center">
          <div 
            className="seat-legend me-2" 
            style={{ backgroundColor: '#28a745', color: '#fff' }}
          >
            A01
          </div>
          <small>Đang chọn</small>
        </div>
      </div>
      <div className="col-md-3 col-6">
        <div className="d-flex align-items-center">
          <div 
            className="seat-legend me-2" 
            style={{ 
              backgroundColor: '#dc3545', 
              color: '#fff',
              opacity: 0.6,
              cursor: 'not-allowed'
            }}
          >
            A01
          </div>
          <small>Đã đặt</small>
        </div>
      </div>
      <div className="col-md-3 col-6">
        <div className="d-flex align-items-center">
          <div 
            className="seat-legend me-2" 
            style={{ 
              backgroundColor: '#f8f9fa', 
              color: '#6c757d',
              border: '1px dashed #adb5bd'
            }}
          >
            A01
          </div>
          <small>Chưa có ghế</small>
        </div>
      </div>
    </div>
  </div>
</div>
        </div>

        {/* Selected Seats Summary */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title mb-0">Thông tin đặt vé</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6>Ghế đã chọn ({selectedSeats.length})</h6>
                {selectedSeats.length === 0 ? (
                  <p className="text-muted small">Chưa chọn ghế nào</p>
                ) : (
                  <div>
                    {selectedSeats.map((seat, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small">
                          Ghế {seat.tenGhe} ({seat.loaiGhe})
                        </span>
                        <span className="small fw-bold">
                          +{seat.phuThu.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr />

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Giá vé ({selectedSeats.length} x {(scheduleData?.giaVe || 0).toLocaleString('vi-VN')} VNĐ)</span>
                  <span>{((scheduleData?.giaVe || 0) * selectedSeats.length).toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Phụ thu ghế</span>
                  <span>
                    {selectedSeats.reduce((total, seat) => total + (seat.phuThu || 0), 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">
                    {calculateTotalPrice().toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="text-center">
                  <small className="text-muted">
                    Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .seat {
          transition: all 0.2s ease;
          font-family: 'Courier New', monospace;
        }
        
        .seat:hover.available-seat {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .seat.booked {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .seat-legend {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: bold;
          border: 2px solid #212529;
        }

        .row-label {
          color: #6c757d;
          font-size: 1rem;
        }

        .screen::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #007bff, transparent);
        }

        @media (max-width: 768px) {
          .seat {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.6rem !important;
          }
          
          .seat.couple {
            width: 35px !important;
            height: 35px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SeatSelection;