import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ticketService from '../../services/ticketService';
import { useToast } from '../common/Toast';

const PaymentReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  
  const [paymentResult, setPaymentResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    handlePaymentReturn();
  }, []);

  const handlePaymentReturn = async () => {
    try {
      // Extract payment parameters from URL (new format from backend)
      // Format: /payment/result?orderId=XXX&status=SUCCESS/FAILED&transactionNo=XXX&transactionDate=XXX
      // Or: /payment/result?orderId=XXX&status=FAILED&responseCode=XXX&message=XXX
      const orderId = searchParams.get('orderId');
      const status = searchParams.get('status');
      const transactionNo = searchParams.get('transactionNo');
      const transactionDate = searchParams.get('transactionDate');
      const responseCode = searchParams.get('responseCode');
      const errorMessage = searchParams.get('message');

      if (!orderId) {
        setPaymentResult({
          status: 'ERROR',
          message: 'Không tìm thấy thông tin đơn hàng'
        });
        setLoading(false);
        return;
      }

      // Get invoice details
      const invoiceResult = await ticketService.getInvoiceDetail(orderId);
      
      if (invoiceResult.success) {
        setInvoiceDetail(invoiceResult.data);
      }

      if (status === 'SUCCESS') {
        setPaymentResult({
          status: 'SUCCESS',
          message: 'Thanh toán thành công',
          data: {
            orderId: orderId,
            transactionNo: transactionNo,
            transactionDate: transactionDate,
            status: status
          }
        });
        showSuccess('Thanh toán thành công!');
      } else if (status === 'FAILED') {
        // Failed with responseCode and message
        const failedMessage = errorMessage 
          ? decodeURIComponent(errorMessage) 
          : 'Thanh toán thất bại';
        
        setPaymentResult({
          status: 'FAILED',
          message: failedMessage,
          data: {
            orderId: orderId,
            status: status,
            responseCode: responseCode,
            errorMessage: errorMessage
          }
        });
        showError(failedMessage);
      } else {
        // Unknown status
        setPaymentResult({
          status: 'ERROR',
          message: 'Trạng thái thanh toán không xác định',
          data: {
            orderId: orderId,
            status: status
          }
        });
        showError('Trạng thái thanh toán không xác định');
      }
    } catch (error) {
      console.error('Payment return error:', error);
      setPaymentResult({
        status: 'ERROR',
        message: 'Có lỗi xảy ra khi xử lý kết quả thanh toán'
      });
      showError('Có lỗi xảy ra khi xử lý kết quả thanh toán');
    }
    
    setLoading(false);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    // VNPay date format: YYYYMMDDHHMMSS
    if (dateString.length === 14) {
      const year = dateString.substr(0, 4);
      const month = dateString.substr(4, 2);
      const day = dateString.substr(6, 2);
      const hour = dateString.substr(8, 2);
      const minute = dateString.substr(10, 2);
      const second = dateString.substr(12, 2);
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
      return {
        date: date.toLocaleDateString('vi-VN'),
        time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    }
    
    return { date: '', time: '' };
  };

  if (loading) {
    return (
      <div className="payment-return">
        <div className="container">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
              <h5>Đang xử lý kết quả thanh toán...</h5>
              <p className="text-muted">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-return">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-lg mt-5">
              {/* Success Result */}
              {paymentResult?.status === 'SUCCESS' && (
                <>
                  <div className="card-header bg-success text-white text-center py-4">
                    <div className="success-animation">
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="mt-3 mb-0">Thanh toán thành công!</h3>
                    <p className="mb-0 mt-2">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</p>
                  </div>
                  
                  <div className="card-body p-4">
                    {/* Payment Information */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="text-success mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          Thông tin thanh toán
                        </h6>
                        <div className="payment-info">
                          <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted">Mã đơn hàng:</span>
                            <strong>{paymentResult.data.orderId}</strong>
                          </div>
                          {paymentResult.data.transactionNo && (
                            <div className="d-flex justify-content-between py-2 border-bottom">
                              <span className="text-muted">Mã giao dịch:</span>
                              <strong>{paymentResult.data.transactionNo}</strong>
                            </div>
                          )}
                          {paymentResult.data.transactionDate && (
                            <div className="d-flex justify-content-between py-2 border-bottom">
                              <span className="text-muted">Thời gian thanh toán:</span>
                              <strong>
                                {formatDateTime(paymentResult.data.transactionDate).date} {formatDateTime(paymentResult.data.transactionDate).time}
                              </strong>
                            </div>
                          )}
                          {/* thông tin khách hàng */}
                          
                          <div className="d-flex justify-content-between py-2">
                            <span className="text-muted">Trạng thái:</span>
                            <span className="badge bg-success">Thành công</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Invoice Summary */}
                      {invoiceDetail && (
                        <div className="col-md-6">
                          <h6 className="text-success mb-3">
                            <i className="bi bi-receipt me-2"></i>
                            Tóm tắt đơn hàng
                          </h6>
                          <div className="invoice-summary">
                            <div className="d-flex justify-content-between py-2 border-bottom">
                              <span className="text-muted">Số vé:</span>
                              <strong>{invoiceDetail.soLuongVe}</strong>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                              <span className="text-muted">Tổng tiền vé:</span>
                              <strong>{invoiceDetail.tongTienVe?.toLocaleString('vi-VN')} VNĐ</strong>
                            </div>
                            {invoiceDetail.tongTienDichVu > 0 && (
                              <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted">Dịch vụ:</span>
                                <strong>{invoiceDetail.tongTienDichVu?.toLocaleString('vi-VN')} VNĐ</strong>
                              </div>
                            )}
                            <div className="d-flex justify-content-between py-2 fs-5 fw-bold text-success">
                              <span>Tổng cộng:</span>
                              <span>{invoiceDetail.tongTien?.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Movie Tickets */}
                    {invoiceDetail?.danhSachVe && invoiceDetail.danhSachVe.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-success mb-3">
                          <i className="bi bi-ticket me-2"></i>
                          Thông tin vé
                        </h6>
                        <div className="row">
                          {invoiceDetail.danhSachVe.map((ticket, index) => {
                            const showDateTime = formatDateTime(ticket.thoiGianChieu);
                            return (
                              <div key={index} className="col-md-6 mb-3">
                                <div className="card border border-success">
                                  <div className="card-body">
                                    <h6 className="card-title text-success">{ticket.tenPhim}</h6>
                                    <p className="card-text small mb-2">
                                      <i className="bi bi-geo-alt me-1"></i>
                                      {ticket.tenPhongChieu}
                                    </p>
                                    <p className="card-text small mb-2">
                                      <i className="bi bi-calendar me-1"></i>
                                      {showDateTime.date} lúc {showDateTime.time}
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span className="badge bg-success">Ghế {ticket.tenGhe}</span>
                                      <strong className="text-success">
                                        {ticket.thanhTien?.toLocaleString('vi-VN')} VNĐ
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="text-center">
                      <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <button 
                          className="btn btn-success btn-lg"
                          onClick={() => navigate('/tickets')}
                        >
                          <i className="bi bi-ticket-detailed me-2"></i>
                          Xem vé của tôi
                        </button>
                        <button 
                          className="btn btn-outline-success btn-lg"
                          onClick={() => navigate(`/invoice/${paymentResult.data.orderId}`)}
                        >
                          <i className="bi bi-receipt me-2"></i>
                          Xem hóa đơn chi tiết
                        </button>
                        <button 
                          className="btn btn-primary btn-lg"
                          onClick={() => navigate('/')}
                        >
                          <i className="bi bi-house me-2"></i>
                          Về trang chủ
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Vé điện tử sẽ được gửi về email của bạn trong vài phút tới
                      </small>
                    </div>
                  </div>
                </>
              )}

              {/* Failed Result */}
              {paymentResult?.status === 'FAILED' && (
                <>
                  <div className="card-header bg-danger text-white text-center py-4">
                    <div className="error-animation">
                      <i className="bi bi-x-circle-fill" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="mt-3 mb-0">Thanh toán thất bại!</h3>
                    <p className="mb-0 mt-2">Đã xảy ra lỗi trong quá trình thanh toán</p>
                    
                  </div>
                  
                  <div className="card-body p-4 text-center">
                    <div className="payment-info mb-4">
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted">Mã đơn hàng:</span>
                        <strong>{paymentResult.data?.orderId}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2">
                        <span className="text-muted">Trạng thái:</span>
                        <span className="badge bg-danger">Thất bại</span>
                      </div>
                    </div>

                    <div className="alert alert-danger mb-4" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Lý do:</strong> {paymentResult.message || 'Giao dịch không thành công'}
                    </div>

                    {paymentResult.data?.responseCode && (
                      <div className="mb-4">
                        <small className="text-muted">
                          Mã lỗi: <code>{paymentResult.data.responseCode}</code>
                        </small>
                      </div>
                    )}

                    <p className="text-muted mb-4">
                      Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
                    </p>

                    <div className="d-flex gap-2 justify-content-center">
                      <button 
                        className="btn btn-danger"
                        onClick={() => navigate('/')}
                      >
                        <i className="bi bi-house me-2"></i>
                        Về trang chủ
                      </button>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/tickets')}
                      >
                        <i className="bi bi-ticket me-2"></i>
                        Xem vé của tôi
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error Result */}
              {paymentResult?.status === 'ERROR' && (
                <>
                  <div className="card-header bg-warning text-dark text-center py-4">
                    <div className="error-animation">
                      <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="mt-3 mb-0">Có lỗi xảy ra!</h3>
                    <p className="mb-0 mt-2">{paymentResult.message}</p>
                  </div>
                  
                  <div className="card-body p-4 text-center">
                    <p className="text-muted mb-4">
                      Vui lòng thử lại hoặc liên hệ hỗ trợ khách hàng.
                    </p>

                    <div className="d-flex gap-2 justify-content-center">
                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                      >
                        <i className="bi bi-house me-2"></i>
                        Về trang chủ
                      </button>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/tickets')}
                      >
                        <i className="bi bi-ticket me-2"></i>
                        Xem vé của tôi
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="card-footer bg-light text-center">
                <small className="text-muted">
                  <i className="bi bi-shield-check me-1"></i>
                  Thanh toán được bảo mật bởi VNPay
                </small>
              </div>
            </div>

            {/* Support Section */}
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body text-center">
                <h6 className="text-primary">
                  <i className="bi bi-headset me-2"></i>
                  Cần hỗ trợ?
                </h6>
                <p className="text-muted small mb-0">
                  Hotline: 1900-xxxx | Email: support@movieticket.com
                  <br />
                  Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .payment-return {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 0;
        }

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

        .payment-info, .invoice-summary {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
        }

        .card {
          backdrop-filter: blur(10px);
        }

        @media (max-width: 768px) {
          .d-flex.gap-3 {
            flex-direction: column;
          }
          
          .btn-lg {
            width: 100%;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentReturn;