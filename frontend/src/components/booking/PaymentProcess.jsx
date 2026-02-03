import React, { useState, useEffect } from 'react';
import ticketService from '../../services/ticketService';
import { useToast } from '../common/Toast';

const PaymentProcess = ({ bookingData, onPaymentSuccess, onPaymentFailure }) => {
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('PENDING'); // PENDING, PROCESSING, SUCCESS, FAILED
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [showQR, setShowQR] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY'); // VNPAY or MOMO
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    if (bookingData) {
      createPaymentUrl();
    }
  }, [bookingData]);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0 && paymentStatus === 'PENDING') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && paymentStatus === 'PENDING') {
      handlePaymentTimeout();
    }
  }, [timeLeft, paymentStatus]);

  useEffect(() => {
    // Poll payment status
    if (paymentStatus === 'PROCESSING') {
      const pollInterval = setInterval(() => {
        checkPaymentStatus();
      }, 3000); // Check every 3 seconds

      return () => clearInterval(pollInterval);
    }
  }, [paymentStatus]);

  const createPaymentUrl = async () => {
    setLoading(true);
    try {
      const paymentData = {
        amount: bookingData.tongTien,
        orderId: bookingData.maHD
      };

      // Get payment method from bookingData (set during booking)
      const method = bookingData.phuongThucThanhToan?.toUpperCase() || 'VNPAY';
      setPaymentMethod(method);

      let result;
      if (method === 'MOMO') {
        result = await ticketService.createMoMoPayment(paymentData);
      } else {
        result = await ticketService.createVNPayPayment(paymentData);
      }
      
      if (result.success) {
        // Check if result.data is an object with payUrl (MoMo format) or just a string (VNPay format)
        const url = typeof result.data === 'object' ? result.data.payUrl : result.data;
        setPaymentUrl(url);
        showInfo(`Đã tạo liên kết thanh toán ${method === 'MOMO' ? 'MoMo' : 'VNPay'}. Vui lòng hoàn tất trong vòng 5 phút.`);
      } else {
        showError(result.message);
        onPaymentFailure();
      }
    } catch (error) {
      showError('Có lỗi xảy ra khi tạo thanh toán');
      onPaymentFailure();
    }
    setLoading(false);
  };

  const checkPaymentStatus = async () => {
    try {
      const result = await ticketService.checkPaymentStatus(bookingData.maHD);
      
      if (result.success) {
        const status = result.data.paymentStatus;
        console.log('Payment status:', status);
        
        if (status === 'SUCCESS') {
          setPaymentStatus('SUCCESS');
          showSuccess('Thanh toán thành công! Vé đã được đặt.');
          // Không tự động chuyển trang, để user xem thông tin và chọn
        } else if (status === 'FAILED' || status === 'CANCELLED'  || status === 'EXPIRED') {
          setPaymentStatus('FAILED');
          showError('Thanh toán thất bại');
          onPaymentFailure();
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handlePaymentTimeout = async () => {
    try {
      await ticketService.cancelInvoice(bookingData.maHD);
      showError('Hết thời gian thanh toán. Đơn hàng đã bị hủy.');
      onPaymentFailure();
    } catch (error) {
      console.error('Error canceling invoice:', error);
    }
  };

  const handlePayNow = () => {
    if (paymentUrl) {
      setPaymentStatus('PROCESSING');
      window.open(paymentUrl, '_blank');
      showInfo(`Vui lòng hoàn tất thanh toán trên trang ${paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'} và quay lại đây.`);
    }
  };

  const handleCancelPayment = async () => {
    if (window.confirm('Bạn có chắc muốn hủy thanh toán?')) {
      try {
        await ticketService.cancelInvoice(bookingData.maHD);
        showInfo('Đã hủy đơn hàng');
        onPaymentFailure();
      } catch (error) {
        showError('Có lỗi khi hủy đơn hàng');
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateQRCode = () => {
    // Simple QR code generation for demo purposes
    // In real implementation, you might want to use a proper QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl || '')}`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3"></div>
        <p>Đang tạo thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="payment-process">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h3 className="mb-0">
                <i className="bi bi-credit-card me-2"></i>
                Thanh toán đơn hàng
              </h3>
              <p className="mb-0 mt-2">Mã đơn hàng: <strong>{bookingData.maHD}</strong></p>
            </div>

            <div className="card-body p-4">
              {/* Payment Status */}
              <div className="text-center mb-4">
                {paymentStatus === 'PENDING' && (
                  <div className="alert alert-warning">
                    <h5>
                      <i className="bi bi-clock me-2"></i>
                      Chờ thanh toán
                    </h5>
                    <p className="mb-0">
                      Thời gian còn lại: <strong className="text-danger">{formatTime(timeLeft)}</strong>
                    </p>
                  </div>
                )}

                {paymentStatus === 'PROCESSING' && (
                  <div className="alert alert-info">
                    <h5>
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Đang xử lý thanh toán
                    </h5>
                    <div className="spinner-border spinner-border-sm me-2"></div>
                    <span>Vui lòng chờ...</span>
                  </div>
                )}

                {paymentStatus === 'SUCCESS' && (
                  <div className="alert alert-success">
                    <h5>
                      <i className="bi bi-check-circle me-2"></i>
                      Thanh toán thành công
                    </h5>
                    <p className="mb-0">Cảm ơn bạn đã sử dụng dịch vụ!</p>
                  </div>
                )}

                {paymentStatus === 'FAILED' && (
                  <div className="alert alert-danger">
                    <h5>
                      <i className="bi bi-x-circle me-2"></i>
                      Thanh toán thất bại
                    </h5>
                    <p className="mb-0">Vui lòng thử lại hoặc liên hệ hỗ trợ</p>
                  </div>
                )}
              </div>

              {/* Booking Summary */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="text-primary mb-3">Thông tin đặt vé</h6>
                  <div className="booking-info">
                    <p><strong>Phim:</strong> {bookingData.danhSachVe[0]?.tenPhim}</p>
                    <p><strong>Phòng:</strong> {bookingData.danhSachVe[0]?.tenPhongChieu}</p>
                    <p><strong>Thời gian:</strong> {new Date(bookingData.danhSachVe[0]?.thoiGianChieu).toLocaleString('vi-VN')}</p>
                    <p><strong>Ghế:</strong> {bookingData.danhSachVe.map(ve => ve.tenGhe).join(', ')}</p>
                  </div>
                </div>

                <div className="col-md-6">
                  <h6 className="text-primary mb-3">Chi tiết thanh toán</h6>
                  <div className="payment-details">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tổng tiền:</span>
                      <span className="fw-bold text-success">
                        {bookingData.tongTien.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Phương thức:</span>
                      <span className={`badge ${paymentMethod === 'MOMO' ? 'bg-danger' : 'bg-primary'}`}>
                        {paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Trạng thái:</span>
                      <span className={`badge ${
                        paymentStatus === 'SUCCESS' ? 'bg-success' :
                        paymentStatus === 'FAILED' ? 'bg-danger' :
                        paymentStatus === 'PROCESSING' ? 'bg-info' : 'bg-warning'
                      }`}>
                        {paymentStatus === 'SUCCESS' ? 'Thành công' :
                         paymentStatus === 'FAILED' ? 'Thất bại' :
                         paymentStatus === 'PROCESSING' ? 'Đang xử lý' : 'Chờ thanh toán'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Actions */}
              {paymentStatus === 'PENDING' && paymentUrl && (
                <div className="payment-actions">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="text-center">
                        <h6>Thanh toán trực tiếp</h6>
                        <button
                          className={`btn btn-lg w-100 ${paymentMethod === 'MOMO' ? 'btn-danger' : 'btn-success'}`}
                          onClick={handlePayNow}
                        >
                          <i className="bi bi-credit-card me-2"></i>
                          Thanh toán với {paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'}
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="text-center">
                        <h6>Quét mã QR</h6>
                        <button
                          className={`btn w-100 ${paymentMethod === 'MOMO' ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                          onClick={() => setShowQR(!showQR)}
                        >
                          <i className="bi bi-qr-code me-2"></i>
                          {showQR ? 'Ẩn mã QR' : 'Hiện mã QR'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showQR && (
                    <div className="text-center mt-3">
                      <div className="qr-code-container">
                        <img
                          src={generateQRCode()}
                          alt="QR Code Payment"
                          className="img-fluid"
                          style={{ maxWidth: '200px' }}
                        />
                        <p className="mt-2 text-muted small">
                          Quét mã QR bằng ứng dụng {paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'} để thanh toán
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <button
                      className="btn btn-outline-danger"
                      onClick={handleCancelPayment}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Hủy đơn hàng
                    </button>
                  </div>
                </div>
              )}

              {paymentStatus === 'PROCESSING' && (
                <div className="text-center">
                  <div className="alert alert-info">
                    <p className="mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Hệ thống đang kiểm tra trạng thái thanh toán của bạn...
                    </p>
                  </div>
                  <button
                    className="btn btn-outline-primary"
                    onClick={checkPaymentStatus}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Kiểm tra lại
                  </button>
                </div>
              )}

              {paymentStatus === 'SUCCESS' && (
                <div className="text-center">
                  <div className="success-animation mb-4">
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-success mb-3">🎉 Thanh toán thành công!</h4>
                  <div className="alert alert-success text-start mb-4">
                    <h6 className="alert-heading">Chi tiết thanh toán:</h6>
                    <hr />
                    <p className="mb-1"><strong>Mã đơn hàng:</strong> {bookingData.maHD}</p>
                    <p className="mb-1"><strong>Tổng tiền:</strong> {bookingData.tongTien?.toLocaleString('vi-VN')} VNĐ</p>
                    <p className="mb-1"><strong>Số vé:</strong> {(bookingData.danhSachVe || []).length} vé</p>
                    <p className="mb-0"><strong>Trạng thái:</strong> <span className="badge bg-success">Đã thanh toán</span></p>
                  </div>
                  <p className="text-muted mb-4">
                    🎫 Vé điện tử đã được tạo thành công!<br/>
                    📧 Thông tin vé sẽ được gửi về email của bạn.<br/>
                    📱 Bạn có thể xem và quản lý vé trong phần "Vé của tôi".
                  </p>
                  
                  <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                    <button
                      className="btn btn-primary btn-lg me-md-2"
                      onClick={onPaymentSuccess}
                    >
                      <i className="bi bi-ticket-detailed me-2"></i>
                      Xem vé của tôi
                    </button>
                    <button
                      className="btn btn-outline-primary btn-lg"
                      onClick={() => window.location.href = '/'}
                    >
                      <i className="bi bi-house me-2"></i>
                      Về trang chủ
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Nếu có vấn đề gì, vui lòng liên hệ hotline: 1900 123 456
                    </small>
                  </div>
                </div>
              )}

              {paymentStatus === 'FAILED' && (
                <div className="text-center">
                  <div className="error-animation mb-4">
                    <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-danger mb-3">Thanh toán thất bại!</h4>
                  <p className="text-muted">
                    Có lỗi xảy ra trong quá trình thanh toán.
                    <br />
                    Vui lòng thử lại hoặc liên hệ hỗ trợ.
                  </p>
                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setPaymentStatus('PENDING');
                        createPaymentUrl();
                      }}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Thử lại
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={onPaymentFailure}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Quay lại
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="card-footer bg-light text-center">
              <small className="text-muted">
                <i className="bi bi-shield-check me-1"></i>
                Thanh toán được bảo mật bởi {paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'}
              </small>
            </div>
          </div>

          {/* Help Section */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <h6 className="text-primary">
                <i className="bi bi-question-circle me-2"></i>
                Cần hỗ trợ?
              </h6>
              <p className="text-muted small mb-0">
                Nếu bạn gặp vấn đề trong quá trình thanh toán, vui lòng liên hệ:
                <br />
                📞 Hotline: 1900-xxxx | 📧 Email: support@movieticket.com
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .success-animation {
          animation: bounce 1s infinite alternate;
        }

        .error-animation {
          animation: shake 0.5s;
        }

        @keyframes bounce {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .qr-code-container {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: inline-block;
        }

        .payment-actions .btn {
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .payment-actions .col-md-6 {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentProcess;