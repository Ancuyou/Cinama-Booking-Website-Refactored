import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import { useToast } from '../common/Toast';

const InvoiceDetailAdmin = () => {
  const { maHD } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (maHD) fetch();
  }, [maHD]);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getInvoiceDetail(maHD);
      if (res.success) setInvoice(res.data);
      else showError(res.message);
    } catch (err) {
      console.error(err);
      showError('Lỗi khi tải chi tiết hóa đơn');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-4 text-center"><div className="spinner-border text-primary"></div></div>;

  if (!invoice) return <div className="p-4">Không tìm thấy hóa đơn</div>;

  return (
    <div className="container-fluid p-4">
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="h4 text-primary mb-1">Chi tiết hóa đơn</h3>
              <small className="text-muted">Mã: {invoice.maHD}</small>
            </div>
            <div>
              <button className="btn btn-outline-secondary me-2" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-1"></i> Quay lại
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <i className="bi bi-printer me-1"></i> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white">
          <h6 className="mb-0">Thông tin hóa đơn</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-primary">Thông tin khách hàng</h6>
              <div className="mb-2">
                <strong>Tên:</strong> {invoice.tenNguoiDung || invoice.tenKhachHang || '-'}
              </div>
              <div className="mb-2">
                <strong>Email:</strong> {invoice.emailNguoiDung || invoice.emailKhachHang || '-'}
              </div>
              <div className="mb-2">
                <strong>SĐT:</strong> {invoice.soDienThoai || invoice.sdtKhachHang || '-'}
              </div>
            </div>
            <div className="col-md-6">
              <h6 className="text-primary">Thông tin đơn hàng</h6>
              <div className="mb-2">
                <strong>Phương thức:</strong> {invoice.phuongThucThanhToan}
              </div>
              <div className="mb-2">
                <strong>Trạng thái:</strong>{' '}
                <span
                  className={`badge ${
                    invoice.trangThai === 'PAID'
                      ? 'bg-success'
                      : invoice.trangThai === 'CANCELLED'
                      ? 'bg-danger'
                      : 'bg-warning'
                  }`}
                >
                  {invoice.trangThai}
                </span>
              </div>
              <div className="mb-2">
                <strong>Ngày lập:</strong> {new Date(invoice.ngayLap).toLocaleString('vi-VN')}
              </div>
              {invoice.transactionNo && (
                <div className="mb-2">
                  <strong>Mã giao dịch:</strong> {invoice.transactionNo}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white">
          <h6 className="mb-0">Danh sách vé</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Mã vé</th>
                  <th>Phim</th>
                  <th>Phòng</th>
                  <th>Ghế</th>
                  <th>Ngày chiếu</th>
                  <th>Giá</th>
                </tr>
              </thead>
              <tbody>
                {invoice.danhSachVe?.map(v => (
                  <tr key={v.maVe}>
                    <td>{v.maVe}</td>
                    <td>{v.tenPhim}</td>
                    <td>{v.tenPhongChieu}</td>
                    <td>{v.tenGhe} ({v.loaiGhe})</td>
                    <td>{new Date(v.ngayChieu).toLocaleString('vi-VN')}</td>
                    <td>{v.thanhTien?.toLocaleString()} VND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {invoice.danhSachDichVu?.length > 0 && (
        <div className="card shadow-sm mb-3">
          <div className="card-header bg-white">
            <h6 className="mb-0">Dịch vụ đi kèm</h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Tên dịch vụ</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.danhSachDichVu.map(d => (
                    <tr key={d.maDichVu}>
                      <td>{d.tenDichVu}</td>
                      <td>{d.soLuong}</td>
                      <td>{d.giaDichVu?.toLocaleString()} VND</td>
                      <td>{d.thanhTien?.toLocaleString()} VND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              {invoice.ghiChu && (
                <div>
                  <strong>Ghi chú:</strong>
                  <pre className="mt-2 p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {invoice.ghiChu}
                  </pre>
                </div>
              )}
            </div>
            <div className="col-md-4">
              <div className="text-end">
                <div className="mb-2">
                  <strong>Tổng tiền vé:</strong> {invoice.tongTienVe?.toLocaleString()} VND
                </div>
                <div className="mb-2">
                  <strong>Tổng tiền dịch vụ:</strong> {invoice.tongTienDichVu?.toLocaleString()} VND
                </div>
                <hr />
                <h5 className="text-primary">
                  <strong>Tổng cộng:</strong> {invoice.tongTien?.toLocaleString()} VND
                </h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailAdmin;
