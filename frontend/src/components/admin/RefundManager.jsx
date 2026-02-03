import React, { useState } from 'react';
import paymentService from '../../services/paymentService';
import { useToast } from '../common/Toast';

const RefundManager = () => {
  const [refundData, setRefundData] = useState({
    amount: '',
    transId: '',
    transDate: '',
    orderId: '',
    requestId: '',
    transactionNo: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [loading, setLoading] = useState(false);
  const [refundResult, setRefundResult] = useState(null);
  const { showSuccess, showError, showInfo } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRefundData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRefundResult(null);

    try {
      let result;
      
      if (paymentMethod === 'VNPAY') {
        // VNPay refund format
        const vnpayRefundData = {
          amount: parseInt(refundData.amount),
          transId: refundData.transId,
          transDate: refundData.transDate,
          orderId: refundData.orderId,
          transType: "02" // 02 for full refund
        };
        
        showInfo('Đang xử lý hoàn tiền VNPay... Vui lòng chờ trong vài giây.');
        result = await paymentService.refundVNPay(vnpayRefundData);
      } else {
        // MoMo refund format
        const momoRefundData = {
          amount: parseInt(refundData.amount),
          requestId: refundData.requestId,
          transId: refundData.transactionNo,
          transDate: refundData.transDate
        };
        
        showInfo('Đang xử lý hoàn tiền MoMo... Vui lòng chờ trong vài giây.');
        result = await paymentService.refundMoMo(momoRefundData);
      }

      if (result.success) {
        setRefundResult({
          success: true,
          message: result.message,
          data: result.data
        });
        showSuccess('Hoàn tiền thành công!');
        
        // Reset form
        setRefundData({
          amount: '',
          transId: '',
          transDate: '',
          orderId: '',
          requestId: '',
          transactionNo: ''
        });
      } else {
        setRefundResult({
          success: false,
          message: result.message
        });
        showError(result.message || 'Hoàn tiền thất bại!');
      }
    } catch (error) {
      console.error('Refund error:', error);
      setRefundResult({
        success: false,
        message: 'Có lỗi xảy ra khi xử lý hoàn tiền'
      });
      showError('Có lỗi xảy ra khi xử lý hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setRefundData({
      amount: '',
      transId: '',
      transDate: '',
      orderId: '',
      requestId: '',
      transactionNo: ''
    });
    setRefundResult(null);
  };

  return (
    <div className="refund-manager">
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Quản lý hoàn tiền
              </h4>
            </div>

            <div className="card-body">
              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="form-label fw-bold">Phương thức thanh toán</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'VNPAY' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handlePaymentMethodChange('VNPAY')}
                  >
                    <i className="bi bi-wallet2 me-2"></i>
                    VNPay
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'MOMO' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => handlePaymentMethodChange('MOMO')}
                  >
                    <i className="bi bi-phone me-2"></i>
                    MoMo
                  </button>
                </div>
              </div>

              {/* Refund Form */}
              <form onSubmit={handleRefund}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Số tiền hoàn *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="amount"
                      value={refundData.amount}
                      onChange={handleInputChange}
                      placeholder="Nhập số tiền cần hoàn"
                      required
                    />
                  </div>

                  {paymentMethod === 'VNPAY' && (
                    <>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Mã giao dịch (transId) *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="transId"
                          value={refundData.transId}
                          onChange={handleInputChange}
                          placeholder="Mã giao dịch VNPay"
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Ngày giao dịch *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="transDate"
                          value={refundData.transDate}
                          onChange={handleInputChange}
                          placeholder="YYYYMMDDHHMMSS (VD: 20251010142421)"
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Mã đơn hàng (orderId) *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="orderId"
                          value={refundData.orderId}
                          onChange={handleInputChange}
                          placeholder="Mã đơn hàng"
                          required
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === 'MOMO' && (
                    <>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Request ID *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="requestId"
                          value={refundData.requestId}
                          onChange={handleInputChange}
                          placeholder="UUID từ hóa đơn chi tiết"
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Transaction No (transId) *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="transactionNo"
                          value={refundData.transactionNo}
                          onChange={handleInputChange}
                          placeholder="Mã giao dịch MoMo"
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Ngày giao dịch *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="transDate"
                          value={refundData.transDate}
                          onChange={handleInputChange}
                          placeholder="YYYYMMDDHHMMSS (VD: 20251010142421)"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Lưu ý:</strong> Quá trình hoàn tiền có thể mất từ vài giây đến vài phút. 
                  Vui lòng không tắt trang trong quá trình xử lý.
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className={`btn btn-lg ${paymentMethod === 'MOMO' ? 'btn-danger' : 'btn-primary'}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang xử lý hoàn tiền...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-counterclockwise me-2"></i>
                        Thực hiện hoàn tiền
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Loading Indicator */}
              {loading && (
                <div className="mt-4 text-center">
                  <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">
                    <i className="bi bi-hourglass-split me-2"></i>
                    Đang xử lý yêu cầu hoàn tiền với {paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'}...
                    <br />
                    <small>Quá trình này có thể mất vài giây đến vài phút.</small>
                  </p>
                </div>
              )}

              {/* Result Display */}
              {refundResult && !loading && (
                <div className={`mt-4 alert ${refundResult.success ? 'alert-success' : 'alert-danger'}`}>
                  <h5 className="alert-heading">
                    <i className={`bi ${refundResult.success ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                    {refundResult.success ? 'Hoàn tiền thành công!' : 'Hoàn tiền thất bại!'}
                  </h5>
                  <hr />
                  <p className="mb-2"><strong>Thông báo:</strong> {refundResult.message}</p>
                  {refundResult.data && (
                    <div className="mt-3">
                      <p className="mb-0">
                        <strong>Chi tiết:</strong> {typeof refundResult.data === 'string' ? refundResult.data : JSON.stringify(refundResult.data)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Help Card */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <h6 className="text-primary mb-3">
                <i className="bi bi-question-circle me-2"></i>
                Hướng dẫn sử dụng
              </h6>
              
              <div className="mb-3">
                <strong>VNPay:</strong>
                <ul>
                  <li><strong>transId:</strong> Mã giao dịch VNPay (từ response thanh toán)</li>
                  <li><strong>transDate:</strong> Ngày giờ giao dịch định dạng YYYYMMDDHHMMSS</li>
                  <li><strong>orderId:</strong> Mã đơn hàng của hệ thống</li>
                  <li><strong>transType:</strong> Tự động set = "02" (hoàn tiền toàn bộ)</li>
                </ul>
              </div>

              <div>
                <strong>MoMo:</strong>
                <ul>
                  <li><strong>requestId:</strong> UUID từ hóa đơn chi tiết (lấy từ response thanh toán)</li>
                  <li><strong>transId:</strong> Mã giao dịch MoMo (transactionNo)</li>
                  <li><strong>transDate:</strong> Ngày giờ giao dịch định dạng YYYYMMDDHHMMSS</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .refund-manager pre {
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default RefundManager;
