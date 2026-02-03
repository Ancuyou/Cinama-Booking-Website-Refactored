import React, { useState, useEffect } from 'react';
import paymentService from '../../services/paymentService';
import { useToast } from '../common/Toast';
import { useNavigate } from 'react-router-dom';
import { Receipt, Search, FileDown } from 'lucide-react';
import * as XLSX from "xlsx-js-style";

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'PAID', label: 'PAID' },
  { value: 'CANCELLED', label: 'CANCELLED' },
  { value: 'PROCESSING', label: 'PROCESSING' },
  { value: 'REFUNDED', label: 'REFUNDED' },
  { value: 'EXPIRED', label: 'EXPIRED' }
];

const InvoiceManager = () => {
  const { showError } = useToast();
  const [filters, setFilters] = useState({ tenKhachHang: '', nam: '', thang: '', trangThai: '' });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage]);

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page, size: 10 };
      const res = await paymentService.searchInvoices(params);
      if (res.success) {
        setData(res.data);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || 1);
      } else {
        showError(res.message);
      }
    } catch (error) {
      console.error(error);
      showError('Lỗi khi tải hóa đơn');
    }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchInvoices(1);
  };

  const resetFilters = () => {
    setFilters({ tenKhachHang: '', nam: '', thang: '', trangThai: '' });
    setCurrentPage(1);
    fetchInvoices(1);
  };

  const openDetail = (invoice) => {
    navigate(`/admin/invoices/${invoice.maHD}`);
  };

    const exportToExcel = async () => {
    try {
      const params = { ...filters, page: 1, size: 10000 };
      const res = await paymentService.searchInvoices(params);
      if (!res.success || !res.data?.items || res.data.items.length === 0) {
        showError('Không có dữ liệu để xuất');
        return;
      }
      const allInvoices = res.data.items;
      const total = allInvoices.length;
      const totalMoney = allInvoices.reduce((sum, t) => sum + (t.tongTien || 0), 0);
      
      // Tạo workbook
      const wb = XLSX.utils.book_new();
      
      // === SHEET 1: Danh sách hóa đơn ===
      const cinemaName = 'RẠP CHIẾU PHIM CINEMA';
      const reportTitle = 'BÁO CÁO DANH SÁCH HÓA ĐƠN';
      const exportDate = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`;
      
      // Dữ liệu hóa đơn
      const invoiceData = allInvoices.map((invoice, index) => [
        index + 1,
        invoice.maHD,
        new Date(invoice.ngayLap).toLocaleString('vi-VN'),
        invoice.tenNguoiDung || invoice.tenKhachHang || '-',
        invoice.phuongThucThanhToan,
        invoice.trangThai,
        invoice.tongTien
      ]);
      
      // Tạo sheet với cấu trúc
      const ws1Data = [
        [cinemaName], // Row 0
        [reportTitle], // Row 1
        [exportDate], // Row 2
        [], // Row 3 - empty
        ['STT', 'Mã hóa đơn', 'Ngày lập', 'Khách hàng', 'Phương thức', 'Trạng thái', 'Tổng tiền (VND)'], // Row 4 - header
        ...invoiceData, // Data rows
        [], // Empty row
        ['', '', '', '', '', 'TỔNG CỘNG:', totalMoney] // Summary row
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
      
      // Merge cells cho tiêu đề
      ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Cinema name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Report title
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }  // Export date
      ];
      
      // Style cho tiêu đề rạp (Row 0)
      ws1.A1.s = {
        font: { bold: true, sz: 18, color: { rgb: "1976D2" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "E3F2FD" } }
      };
      
      // Style cho tiêu đề báo cáo (Row 1)
      ws1.A2.s = {
        font: { bold: true, sz: 14, color: { rgb: "D32F2F" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
      
      // Style cho ngày xuất (Row 2)
      ws1.A3.s = {
        font: { sz: 11, italic: true, color: { rgb: "666666" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
      
      // Style cho header (Row 4)
      const headerStyle = {
        fill: { fgColor: { rgb: "1976D2" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
      
      for (let C = 0; C <= 6; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 4, c: C });
        if (!ws1[cellAddress]) ws1[cellAddress] = { t: 's', v: '' };
        ws1[cellAddress].s = headerStyle;
      }
      
      // Style cho data rows
      const dataStyle = {
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        }
      };
      
      for (let R = 5; R < 5 + invoiceData.length; R++) {
        for (let C = 0; C <= 6; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws1[cellAddress]) continue;
          ws1[cellAddress].s = { ...dataStyle };
          
          // Zebra striping
          if (R % 2 === 0) {
            ws1[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
          }
          
          // Format số tiền
          if (C === 6) {
            ws1[cellAddress].t = 'n';
            ws1[cellAddress].z = '#,##0';
          }
        }
      }
      
      // Style cho tổng cộng
      const summaryRow = 5 + invoiceData.length + 1;
      for (let C = 5; C <= 6; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: summaryRow, c: C });
        if (!ws1[cellAddress]) continue;
        ws1[cellAddress].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "388E3C" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } }
          }
        };
        if (C === 6) {
          ws1[cellAddress].t = 'n';
          ws1[cellAddress].z = '#,##0';
        }
      }
      
      // Độ rộng cột
      ws1['!cols'] = [
        { wch: 6 },  // STT
        { wch: 15 }, // Mã HD
        { wch: 20 }, // Ngày lập
        { wch: 25 }, // Khách hàng
        { wch: 15 }, // Phương thức
        { wch: 12 }, // Trạng thái
        { wch: 18 }  // Tổng tiền
      ];
      
      // Chiều cao hàng
      ws1['!rows'] = [
        { hpt: 25 }, // Row 0
        { hpt: 20 }, // Row 1
        { hpt: 16 }, // Row 2
        { hpt: 10 }, // Row 3
        { hpt: 20 }  // Row 4
      ];
      
      XLSX.utils.book_append_sheet(wb, ws1, 'Danh sách hóa đơn');
      
      // === SHEET 2: Thống kê ===
      const statusCount = allInvoices.reduce((acc, t) => {
        acc[t.trangThai] = (acc[t.trangThai] || 0) + 1;
        return acc;
      }, {});
      
      const ws2Data = [
        ['THỐNG KÊ HÓA ĐƠN'],
        [],
        ['Chỉ tiêu', 'Giá trị'],
        ['Tổng số hóa đơn', total],
        ['Tổng doanh thu', totalMoney],
        [],
        ['PHÂN BỐ THEO TRẠNG THÁI'],
        [],
        ['Trạng thái', 'Số lượng'],
        ...Object.entries(statusCount).map(([k, v]) => [k, v])
      ];
      
      const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
      
      // Style sheet thống kê
      ws2.A1.s = {
        font: { bold: true, sz: 16, color: { rgb: "1976D2" } },
        alignment: { horizontal: "center" },
        fill: { fgColor: { rgb: "E3F2FD" } }
      };
      
      ws2['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }
      ];
      
      ws2['!cols'] = [{ wch: 25 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(wb, ws2, 'Thống kê');
      
      // Xuất file
      const fileName = `DanhSachHoaDon_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      showError('Lỗi khi xuất Excel');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header giống MovieManagement */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white p-3 rounded">
              <Receipt size={32} />
            </div>
            <div>
              <h1 className="mb-0 h3">Quản Lý Hóa Đơn</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={18} />
            </span>
            <input
              name="tenKhachHang"
              value={filters.tenKhachHang}
              onChange={handleFilterChange}
              className="form-control"
              placeholder="Tên khách hàng"
            />
          </div>
        </div>
        <div className="col-md-2">
          <input
            name="nam"
            value={filters.nam}
            onChange={handleFilterChange}
            className="form-control"
            placeholder="Năm"
            type="number"
          />
        </div>
        <div className="col-md-2">
          <input
            name="thang"
            value={filters.thang}
            onChange={handleFilterChange}
            className="form-control"
            placeholder="Tháng"
            type="number"
            min="1"
            max="12"
          />
        </div>
        <div className="col-md-2">
          <select
            name="trangThai"
            value={filters.trangThai}
            onChange={handleFilterChange}
            className="form-select"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3 d-flex gap-2">
          <button className="btn btn-primary" onClick={applyFilters}>
            <i className="bi bi-search me-1"></i> Tìm
          </button>
          <button className="btn btn-outline-secondary" onClick={resetFilters}>
            <i className="bi bi-arrow-clockwise me-1"></i> Reset
          </button>
          <button className="btn btn-success" onClick={exportToExcel}>
            <FileDown size={18} className="me-1" /> Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã HD</th>
                  <th>Ngày lập</th>
                  <th>Khách hàng</th>
                  <th>Phương thức</th>
                  <th>Trạng thái</th>
                  <th>Tổng tiền</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.length > 0 ? (
                  data.items.map((inv, index) => (
                    <tr key={inv.maHD}>
                      <td>{index + 1 + (currentPage - 1) * 10}</td>
                      <td>{inv.maHD}</td>
                      <td>{new Date(inv.ngayLap).toLocaleString('vi-VN')}</td>
                      <td>{inv.tenNguoiDung || inv.tenKhachHang || '-'}</td>
                      <td>{inv.phuongThucThanhToan}</td>
                      <td>
                        <span
                          className={`badge ${
                            inv.trangThai === 'PAID'
                              ? 'bg-success'
                              : inv.trangThai === 'CANCELLED'
                              ? 'bg-danger'
                              : 'bg-warning'
                          }`}
                        >
                          {inv.trangThai}
                        </span>
                      </td>
                      <td>{inv.tongTien?.toLocaleString()} VND</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openDetail(inv)}
                        >
                          <i className="bi bi-eye me-1"></i> Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <i className="bi bi-inbox display-4 text-muted"></i>
                      <p className="text-muted mt-2">Không tìm thấy hóa đơn nào.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination giống MovieManagement */}
        {totalPages > 1 && (
          <div className="card-footer bg-white">
            <nav>
              <ul className="pagination pagination-sm justify-content-center mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <li
                    key={pageNum}
                    className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                      {pageNum}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManager;
