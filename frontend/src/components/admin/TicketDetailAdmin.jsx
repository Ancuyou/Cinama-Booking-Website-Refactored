import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import { useEffect, useState } from 'react';
import { useToast } from '../common/Toast';

const TicketDetailAdmin = () => {
  const { maVe } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (maVe) fetch(); }, [maVe]);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await paymentService.searchTickets({ maVe });
      if (res.success) setTicket(res.data.items?.[0] || null);
      else showError(res.message);
    } catch (err) { console.error(err); showError('Lỗi khi tải chi tiết vé'); }
    setLoading(false);
  };

  if (loading) return <div className="p-4 text-center"><div className="spinner-border text-primary"></div></div>;
  if (!ticket) return <div className="p-4">Không tìm thấy vé</div>;

  return (
    <div className="container-fluid p-4">
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="h4 text-primary mb-1">Chi tiết vé</h3>
              <small className="text-muted">Mã vé: {ticket.maVe}</small>
            </div>
            <div>
              <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-1"></i> Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Thông tin vé</h6>
            </div>
            <div className="card-body">
              <div className="row mb-2">
                <div className="col-4"><strong>Phim:</strong></div>
                <div className="col-8">{ticket.tenPhim}</div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Phòng chiếu:</strong></div>
                <div className="col-8">{ticket.tenPhongChieu}</div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Ghế:</strong></div>
                <div className="col-8">{ticket.tenGhe} ({ticket.loaiGhe})</div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Ngày chiếu:</strong></div>
                <div className="col-8">{new Date(ticket.ngayChieu).toLocaleString('vi-VN')}</div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Ngày đặt:</strong></div>
                <div className="col-8">{new Date(ticket.ngayDat).toLocaleString('vi-VN')}</div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Trạng thái:</strong></div>
                <div className="col-8">
                  <span
                    className={`badge ${
                      ticket.trangThai === 'PAID' ? 'bg-success' : 'bg-danger'
                    }`}
                  >
                    {ticket.trangThai}
                  </span>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-4"><strong>Giá vé:</strong></div>
                <div className="col-8 text-primary fw-bold">{ticket.thanhTien?.toLocaleString()} VND</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {ticket.qrCodeUrl && (
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">QR Code</h6>
              </div>
              <div className="card-body text-center">
                <img
                  src={ticket.qrCodeUrl}
                  alt="QR Code"
                  className="img-fluid rounded"
                  style={{ maxWidth: '250px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <p className="text-muted mt-2" style={{ display: 'none' }}>
                  QR Code không khả dụng
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailAdmin;
