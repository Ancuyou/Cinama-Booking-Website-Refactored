import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieDetail from './MovieDetail';
import SeatSelection from './SeatSelection';
import ServiceSelection from './ServiceSelection';
import PaymentProcess from './PaymentProcess';
import promotionService from '../../services/promotionService';
import ticketService from '../../services/ticketService';
import { useToast } from '../common/Toast';
import { useAuth } from '../../context/AuthContext';

const BookingProcess = ({ movieId: initialMovieId }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  
  // Booking states
  const [currentStep, setCurrentStep] = useState(1);
  const [movieId, setMovieId] = useState(initialMovieId);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tenPhim, setTenPhim] = useState('');
  
  const [customerInfo, setCustomerInfo] = useState({
    tenKhachHang: '',
    sdtKhachHang: '',
    emailKhachHang: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('VNPAY'); // Default to VNPAY
  useEffect(() => {
    // No need to fetch promotions - only validate entered codes
  }, []);

  const handleShowtimeSelect = (showtime) => {
    setSelectedShowtime(showtime);
    setCurrentStep(2);
  };

  const handleMovieSelect = (movie) => {
    setMovieId(movie.maPhim);
    setTenPhim(movie.tenPhim);
  };

  const handleSeatsSelect = (seats) => {
    setSelectedSeats(seats);
  };

  const handleServicesSelect = (services) => {
    setSelectedServices(services);
  };

  const handlePromotionApply = async () => {
    if (!promotionCode.trim()) {
      showError('Vui lòng nhập mã khuyến mãi');
      return;
    }

    setLoading(true);
    try {
      
      // Validate promotion first
      const validateResult = await promotionService.validatePromotion(promotionCode);
      
      if (validateResult.success) {
        // Get promotion details
        const detailResult = await promotionService.getPromotionDetail(promotionCode);
        
        if (detailResult.success) {
          // Log đầy đủ thông tin khuyến mãi
          setAppliedPromotion(detailResult.data);
          showSuccess('Áp dụng khuyến mãi thành công');
        } else {
          console.error('Error getting promotion details:', detailResult.message);
          showError(detailResult.message);
          setAppliedPromotion(null);
        }
      } else {
        console.error('Invalid promotion code:', validateResult.message);
        showError(validateResult.message);
        setAppliedPromotion(null);
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      showError('Có lỗi xảy ra khi kiểm tra khuyến mãi');
      setAppliedPromotion(null);
    }
    setLoading(false);
  };

  const calculateTicketTotal = () => {
    if (!selectedShowtime || selectedSeats.length === 0) return 0;
    
    // Sử dụng donGiaCoSo từ API mới
    const basePrice = selectedShowtime.donGiaCoSo * selectedSeats.length;
    const seatSurcharge = selectedSeats.reduce((total, seat) => total + (seat.phuThu || 0), 0);
    return basePrice + seatSurcharge;
  };

  const calculateServicesTotal = () => {
    return selectedServices.reduce((total, service) => {
      // Sử dụng donGia hoặc gia tùy thuộc vào cái nào có sẵn
      const price = service.donGia || service.gia || 0;
      return total + (price * service.soLuong);
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedPromotion) return 0;
    
    const subtotal = calculateTicketTotal() + calculateServicesTotal();
    const discountValue = appliedPromotion.giaTri || 0;
    
    // giaTri is percentage (e.g., 20 for 20%)
    return (subtotal * discountValue) / 100;
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateTicketTotal() + calculateServicesTotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
  };

  const validateCustomerInfo = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
    
    if (!user) {
      if (!customerInfo.tenKhachHang.trim()) {
        errors.tenKhachHang = "Vui lòng nhập họ tên";
      }
      
      if (!customerInfo.sdtKhachHang.trim()) {
        errors.sdtKhachHang = "Vui lòng nhập số điện thoại";
      } else if (!phoneRegex.test(customerInfo.sdtKhachHang)) {
        errors.sdtKhachHang = "Số điện thoại không hợp lệ";
      }
      
      if (!customerInfo.emailKhachHang.trim()) {
        errors.emailKhachHang = "Vui lòng nhập email";
      } else if (!emailRegex.test(customerInfo.emailKhachHang)) {
        errors.emailKhachHang = "Email không hợp lệ";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      showError('Vui lòng chọn ít nhất một ghế');
      return;
    }
    
    // Validate customer info if not logged in
    if (!user && !validateCustomerInfo()) {
      showError('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    setLoading(true);


    // Format dữ liệu theo API mới
    const bookingRequest = {
      maPhim: movieId,
      maSuatChieu: selectedShowtime.maSuatChieu,
      maGheList: selectedSeats.map(seat => seat.maGhe),
      maKhuyenMai: appliedPromotion?.maKm || null,
      dichVuList: selectedServices.map(service => ({
        maDv: service.maDv,
        soLuong: service.soLuong
      })),
      phuongThucThanhToan: paymentMethod // Use selected payment method
    };
    
    // Add customer info if user is not logged in
    if (!user) {
      bookingRequest.tenKhachHang = customerInfo.tenKhachHang;
      bookingRequest.sdtKhachHang = customerInfo.sdtKhachHang;
      bookingRequest.emailKhachHang = customerInfo.emailKhachHang;
    }

    try {
      const result = await ticketService.bookTicket(bookingRequest);
      
      if (result.success) {
        setBookingData(result.data);
        setCurrentStep(4); // Move to payment step
        showSuccess('Đặt vé thành công! Vui lòng thanh toán để hoàn tất.');
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError('Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.');
    }

    setLoading(false);
  };

  const handlePaymentSuccess = () => {
    showSuccess('Thanh toán thành công! Cảm ơn bạn đã sử dụng dịch vụ.');
    navigate('/tickets'); // Navigate to tickets page
  };

  const handlePaymentFailure = () => {
    showError('Thanh toán thất bại. Vui lòng thử lại.');
    setCurrentStep(3); // Go back to confirmation step
  };

  const handleStepChange = (step) => {
    if (step === 1) {
      setCurrentStep(1);
    } else if (step === 2 && selectedShowtime) {
      setCurrentStep(2);
    } else if (step === 3 && selectedSeats.length > 0) {
      setCurrentStep(3);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Chọn phim & suất chiếu', icon: 'bi-film' },
      { number: 2, title: 'Chọn ghế', icon: 'bi-grid-3x3' },
      { number: 3, title: 'Dịch vụ & Thanh toán', icon: 'bi-credit-card' },
      { number: 4, title: 'Hoàn tất', icon: 'bi-check-circle' }
    ];

    return (
      <div className="booking-steps mb-4">
        <div className="row">
          {steps.map((step, index) => (
            <div key={step.number} className="col-3">
              <div className="d-flex align-items-center">
                <div
                  className={`step-indicator ${currentStep >= step.number ? 'active' : ''} ${
                    currentStep > step.number ? 'completed' : ''
                  }`}
                  onClick={() => handleStepChange(step.number)}
                  style={{ cursor: currentStep > step.number ? 'pointer' : 'default' }}
                >
                  <i className={`bi ${step.icon}`}></i>
                  <span className="step-number">{step.number}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${currentStep > step.number ? 'completed' : ''}`}></div>
                )}
              </div>
              <div className="step-title mt-2 text-center">
                <small className={currentStep >= step.number ? 'text-primary fw-bold' : 'text-muted'}>
                  {step.title}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBookingSummary = () => {
    if (currentStep < 1) return null;

    return (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-receipt me-2"></i>
            Tóm tắt đơn hàng
          </h5>
        </div>
        <div className="card-body">
          {/* Movie & Showtime Info */}
          <div className="mb-3">
            <h6 className="text-primary">Phim : {tenPhim}</h6>
            <p className="mb-1">
              <i className="bi bi-calendar me-2"></i>
              {new Date(selectedShowtime?.thoiGianBatDau).toLocaleDateString('vi-VN')}
            </p>
            <p className="mb-1">
              <i className="bi bi-clock me-2"></i>
              {new Date(selectedShowtime?.thoiGianBatDau).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="mb-0">
              <i className="bi bi-geo-alt me-2"></i>
              {selectedShowtime?.phongChieu?.tenPhong}
            </p>
          </div>

          <hr />

          {/* Selected Seats */}
          <div className="mb-3">
            <h6>Ghế đã chọn</h6>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {selectedSeats.map((seat, index) => (
                <span key={index} className={`badge ${seat.loaiGhe?.toLowerCase() === 'vip' ? 'bg-warning' : seat.loaiGhe?.toLowerCase() === 'couple' ? 'bg-danger' : 'bg-primary'}`}>
                  {seat.tenGhe}
                </span>
              ))}
            </div>
            <div className="d-flex justify-content-between">
              <span>Vé ({selectedSeats.length} ghế)</span>
              <span>{calculateTicketTotal().toLocaleString('vi-VN')} VNĐ</span>
            </div>
            {/* Hiển thị phụ thu ghế nếu có */}
            {selectedSeats.some(seat => seat.phuThu > 0) && (
              <div className="d-flex justify-content-between text-muted small mt-1">
                <span>Đã bao gồm phụ thu ghế</span>
                <span>{selectedSeats.reduce((total, seat) => total + (seat.phuThu || 0), 0).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
          </div>

          {/* Selected Services */}
          {selectedServices.length > 0 && (
            <>
              <hr />
              <div className="mb-3">
                <h6>Dịch vụ đi kèm</h6>
                {selectedServices.map((service, index) => (
                  <div key={index} className="d-flex justify-content-between mb-1">
                    <span>{service.tenDichVu || service.tenDv} x{service.soLuong}</span>
                    <span>{((service.donGia || service.gia) * service.soLuong).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between fw-bold">
                  <span>Tổng dịch vụ</span>
                  <span>{calculateServicesTotal().toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            </>
          )}

          {/* Customer Information */}
          {!user && currentStep >= 3 && customerInfo.tenKhachHang && (
            <>
              <hr />
              <div className="mb-3">
                <h6>Thông tin khách hàng</h6>
                <p className="mb-1">
                  <i className="bi bi-person me-2"></i>
                  {customerInfo.tenKhachHang}
                </p>
                <p className="mb-1">
                  <i className="bi bi-telephone me-2"></i>
                  {customerInfo.sdtKhachHang}
                </p>
                <p className="mb-0">
                  <i className="bi bi-envelope me-2"></i>
                  {customerInfo.emailKhachHang}
                </p>
              </div>
            </>
          )}
          
          {/* Promotion */}
          {appliedPromotion && (
            <>
              <hr />
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-success">
                      <i className="bi bi-tag me-1"></i>
                      Khuyến mãi ({appliedPromotion.maCode})
                    </span>
                    <span className="badge bg-success ms-2">Đã áp dụng</span>
                  </div>
                  <span className="text-success fw-bold">
                    -{calculateDiscount().toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  {appliedPromotion.tenKm} - {appliedPromotion.moTa}
                </small>
              </div>
            </>
          )}

          <hr />

          {/* Total */}
          <div className="d-flex justify-content-between fw-bold fs-5">
            <span>Tổng cộng</span>
            <span className="text-primary">
              {calculateFinalTotal().toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="booking-process">
      <div className="container-fluid px-4">
        {renderStepIndicator()}

        <div className="row">
          <div className={currentStep < 3 ? 'col-12' : 'col-lg-8'}>
            {/* Step 1: Movie Detail & Showtime Selection */}
            {currentStep === 1 && (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <MovieDetail 
                    movieId={movieId} 
                    onShowtimeSelect={handleShowtimeSelect}
                    onMovieSelect={handleMovieSelect}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Seat Selection */}
            {currentStep === 2 && selectedShowtime && (
              <div>
                <SeatSelection
                  scheduleData={selectedShowtime}
                  onSeatsSelect={handleSeatsSelect}
                  selectedSeats={selectedSeats}
                />
                
                <div className="d-flex justify-content-between mt-4">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Quay lại
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setCurrentStep(3)}
                    disabled={selectedSeats.length === 0}
                  >
                    Tiếp tục
                    <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Services & Payment Confirmation */}
            {currentStep === 3 && (
              <div>
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <ServiceSelection
                      onServicesSelect={handleServicesSelect}
                      selectedServices={selectedServices}
                    />
                  </div>
                </div>

                {/* Customer Information Section - Only show for guests */}
                {!user && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white">
                      <h5 className="mb-0">
                        <i className="bi bi-person me-2"></i>
                        Thông tin khách hàng
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-12 mb-3">
                          <label htmlFor="tenKhachHang" className="form-label fw-medium">Họ và tên <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className={`form-control ${formErrors.tenKhachHang ? 'is-invalid' : ''}`}
                            id="tenKhachHang"
                            name="tenKhachHang"
                            placeholder="Nguyễn Văn A"
                            value={customerInfo.tenKhachHang}
                            onChange={handleInputChange}
                            required
                          />
                          {formErrors.tenKhachHang && <div className="invalid-feedback">{formErrors.tenKhachHang}</div>}
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="sdtKhachHang" className="form-label fw-medium">Số điện thoại <span className="text-danger">*</span></label>
                          <input
                            type="tel"
                            className={`form-control ${formErrors.sdtKhachHang ? 'is-invalid' : ''}`}
                            id="sdtKhachHang"
                            name="sdtKhachHang"
                            placeholder="0123456789"
                            value={customerInfo.sdtKhachHang}
                            onChange={handleInputChange}
                            required
                          />
                          {formErrors.sdtKhachHang && <div className="invalid-feedback">{formErrors.sdtKhachHang}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="emailKhachHang" className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                          <input
                            type="email"
                            className={`form-control ${formErrors.emailKhachHang ? 'is-invalid' : ''}`}
                            id="emailKhachHang"
                            name="emailKhachHang"
                            placeholder="example@email.com"
                            value={customerInfo.emailKhachHang}
                            onChange={handleInputChange}
                            required
                          />
                          {formErrors.emailKhachHang && <div className="invalid-feedback">{formErrors.emailKhachHang}</div>}
                        </div>
                      </div>
                      <div className="mt-2">
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          Đăng nhập để không phải nhập lại thông tin lần sau
                          <a href="/login" className="ms-2 text-primary" target="_blank">Đăng nhập</a>
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-credit-card me-2"></i>
                      Phương thức thanh toán
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div 
                          className={`payment-method-card p-4 border rounded cursor-pointer ${paymentMethod === 'VNPAY' ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
                          onClick={() => setPaymentMethod('VNPAY')}
                          style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-wallet2 fs-1 me-3 text-primary"></i>
                              <div>
                                <h6 className="mb-0 fw-bold">VNPay</h6>
                                <small className="text-muted">Ví điện tử VNPay</small>
                              </div>
                            </div>
                            <div>
                              {paymentMethod === 'VNPAY' && (
                                <i className="bi bi-check-circle-fill text-primary fs-4"></i>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div 
                          className={`payment-method-card p-4 border rounded cursor-pointer ${paymentMethod === 'MOMO' ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary'}`}
                          onClick={() => setPaymentMethod('MOMO')}
                          style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-phone fs-1 me-3 text-danger"></i>
                              <div>
                                <h6 className="mb-0 fw-bold">MoMo</h6>
                                <small className="text-muted">Ví điện tử MoMo</small>
                              </div>
                            </div>
                            <div>
                              {paymentMethod === 'MOMO' && (
                                <i className="bi bi-check-circle-fill text-danger fs-4"></i>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-shield-check me-1"></i>
                        Thanh toán được bảo mật và mã hóa
                      </small>
                    </div>
                  </div>
                </div>

                {/* Promotion Section */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-tag me-2"></i>
                      Mã khuyến mãi
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập mã khuyến mãi"
                            value={promotionCode}
                            onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                          />
                          <button
                            className="btn btn-outline-primary"
                            onClick={handlePromotionApply}
                            disabled={loading}
                          >
                            Áp dụng
                          </button>
                        </div>
                        {appliedPromotion && (
                          <div className="mt-2">
                            <small className="text-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Đã áp dụng: {appliedPromotion.tenKhuyenMai}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Promotion help text */}
                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-lightbulb me-1"></i>
                        Nhập mã khuyến mãi để nhận ưu đãi đặc biệt
                      </small>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Quay lại
                  </button>
                  <button 
                    className="btn btn-success btn-lg"
                    onClick={handleBooking}
                    disabled={loading || selectedSeats.length === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-credit-card me-2"></i>
                        Đặt vé & Thanh toán
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && bookingData && (
              <PaymentProcess
                bookingData={bookingData}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentFailure={handlePaymentFailure}
              />
            )}
          </div>

          {/* Booking Summary (for steps 3+) */}
          {currentStep >= 3 && (
            <div className="col-lg-4">
              {renderBookingSummary()}
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .step-indicator {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .step-indicator.active {
          background-color: #007bff;
          color: white;
        }

        .step-indicator.completed {
          background-color: #28a745;
          color: white;
        }

        .step-connector {
          flex: 1;
          height: 2px;
          background-color: #e9ecef;
          margin: 0 10px;
          transition: all 0.3s ease;
        }

        .step-connector.completed {
          background-color: #28a745;
        }

        .step-number {
          font-weight: bold;
          font-size: 1.1rem;
        }

        .step-title {
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .step-indicator {
            width: 40px;
            height: 40px;
          }
          
          .step-number {
            font-size: 0.9rem;
          }
          
          .step-title small {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BookingProcess;