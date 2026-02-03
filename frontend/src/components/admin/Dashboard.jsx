import React, { useState, useEffect } from "react";
import movieService from "../../services/movieService";
import invoiceService from "../../services/invoiceService";
import scheduleService from "../../services/scheduleService";
import {
  Film,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { useToast } from "../common/Toast.jsx";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    nowShowing: 0,
    comingSoon: 0,
    ended: 0,
  });

  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    totalSchedules: 0,
    avgTicketPrice: 0,
  });

  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);



  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMovieStats(),
        fetchRevenueStats(),
        fetchTopMovies(),
        fetchRecentActivities()
      ]);
    } catch (error) {
      console.error("Error:", error);
      showError("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStats = async () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const result = await invoiceService.getAllInvoice(startDate, endDate);
    if (result.success) {
      const invoices = result.data;

      // Tính tổng doanh thu và vé
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.tongTien, 0);
      const totalTickets = invoices.reduce((sum, inv) => sum + inv.soLuongVe, 0);
      const totalSchedules = new Set(invoices.map(inv => inv.thoiGianBatDau)).size;
      const avgTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;

      setRevenueStats({
        totalRevenue,
        totalTickets,
        totalSchedules,
        avgTicketPrice
      });

      // Tính doanh thu theo ngày
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayInvoices = invoices.filter(inv => inv.ngayLap.startsWith(dateStr));
        const dayRevenue = dayInvoices.reduce((sum, inv) => sum + inv.tongTien, 0);
        const dayTickets = dayInvoices.reduce((sum, inv) => sum + inv.soLuongVe, 0);

        dailyData.push({
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          doanhThu: dayRevenue,
          soVe: dayTickets
        });
      }

      setDailyRevenue(dailyData);
    }
  };

  const fetchTopMovies = async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDate = thirtyDaysAgo.toLocaleDateString("en-CA");
    const endDate = today.toLocaleDateString("en-CA");

    const result = await invoiceService.getAllPhimInvoice(startDate, endDate);
    if (result.success) {
      setTopMovies(result.data.slice(0, 5));
    }
  };

  const fetchRecentActivities = async () => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const startDate = threeDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const result = await invoiceService.getAllInvoiceStatus(startDate, endDate);
    console.log(result);
    if (result.success) {
      const activities = result.data
        .sort((a, b) => new Date(b.ngayLap) - new Date(a.ngayLap))
        .slice(0, 5)
        .map(inv => (
            (inv.trangThai === 'PAID') ? (
            {
          type: 'ticket',
          message: `Đã bán ${inv.soLuongVe} vé cho phim "${inv.tenPhim}"`,
          time: formatTimeAgo(new Date(inv.ngayLap)),
          icon: 'ticket',
          color: 'primary'
            }): (inv.trangThai === "REFUNDED") ?  (
            {
                type: 'ticket',
                message: `Người dùng đã trả ${inv.soLuongVe} vé cho phim "${inv.tenPhim}"`,
                time: formatTimeAgo(new Date(inv.ngayLap)),
                icon: 'ticket',
                color: 'danger'
            }
            ) : (
            {
                type: 'ticket',
                message: `Đã hủy ${inv.soLuongVe} vé cho phim "${inv.tenPhim}"`,
                time: formatTimeAgo(new Date(inv.ngayLap)),
                icon: 'ticket',
                color: 'warning'
            }
            )
        ));

      setRecentActivities(activities);
    }
  };


  const fetchMovieStats =  async () => {
        const result =  await movieService.getAllMovies();
        if (result.success) {
            const movies = result.data;
            const nowShowing = movies.filter(m => m.trangThai === 'Đang chiếu').length;
            const comingSoon = movies.filter(m => m.trangThai === 'Sắp chiếu').length;
            const ended = movies.filter(m => m.trangThai === 'Đã chiếu').length;
            setStats({
                totalMovies: movies.length,
                comingSoon: comingSoon,
                nowShowing: nowShowing,
                ended: ended
            })
        }
        else showError("Không thể tải thống kê phim");

  }

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatCompactCurrency = (value) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    else {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />

      <div className="bg-light min-vh-100 py-4">
        <div className="container-fluid" style={{ maxWidth: '1800px' }}>
          {/* Header */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary text-white p-3 rounded">
                    <Activity size={32} />
                  </div>
                  <div>
                    <h1 className="mb-0 h3">Dashboard Quản Lý</h1>
                    <p className="text-muted mb-0">Tổng quan hoạt động hệ thống</p>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={fetchDashboardData}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Làm mới
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards Row 1 - Doanh thu */}
          <div className="row g-3 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <p className="text-muted mb-1 small">Tổng Doanh Thu (7 ngày)</p>
                      <h3 className="mb-0 text-success fw-bold">{formatCurrency(revenueStats.totalRevenue)}</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded">
                      <DollarSign size={32} className="text-success" />
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2">
                    <span className="badge bg-success bg-opacity-25 text-success">
                      <ChevronUp size={14} style={{ verticalAlign: 'middle' }} />
                      7 ngày gần nhất
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <p className="text-muted mb-1 small">Vé Đã Bán</p>
                      <h3 className="mb-0 text-primary fw-bold">{formatNumber(revenueStats.totalTickets)}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                      <Users size={32} className="text-primary" />
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2">
                    <small className="text-muted">7 ngày qua</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <p className="text-muted mb-1 small">Giá Vé Trung Bình</p>
                      <h3 className="mb-0 text-info fw-bold">{formatCurrency(revenueStats.avgTicketPrice)}</h3>
                    </div>
                    <div className="bg-info bg-opacity-10 p-3 rounded">
                      <DollarSign size={32} className="text-info" />
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2">
                    <small className="text-muted">Trung bình mỗi vé</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <p className="text-muted mb-1 small">Suất Chiếu</p>
                      <h3 className="mb-0 text-warning fw-bold">{revenueStats.totalSchedules}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                      <Calendar size={32} className="text-warning" />
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2">
                    <small className="text-muted">7 ngày qua</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards Row 2 - Phim */}
          <div className="row g-3 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center py-4">
                  <div
                    className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <Film size={32} className="text-primary" />
                  </div>
                  <h3 className="fw-bold mb-0">{stats.totalMovies}</h3>
                  <p className="text-muted mb-0">Tổng số phim</p>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center py-4">
                  <div
                    className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className="bi bi-play-circle fs-1 text-success"></i>
                  </div>
                  <h3 className="fw-bold mb-0">{stats.nowShowing}</h3>
                  <p className="text-muted mb-0">Đang chiếu</p>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center py-4">
                  <div
                    className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className="bi bi-clock fs-1 text-warning"></i>
                  </div>
                  <h3 className="fw-bold mb-0">{stats.comingSoon}</h3>
                  <p className="text-muted mb-0">Sắp chiếu</p>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center py-4">
                  <div
                    className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className="bi bi-stop-circle fs-1 text-secondary"></i>
                  </div>
                  <h3 className="fw-bold mb-0">{stats.ended}</h3>
                  <p className="text-muted mb-0">Đã kết thúc</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-4 mb-4">
            {/* Biểu đồ doanh thu */}
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-0 pt-3">
                  <h5 className="mb-0">Doanh Thu 7 Ngày Gần Nhất</h5>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        yAxisId="left"
                        tickFormatter={formatCompactCurrency}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === 'doanhThu') return [formatCurrency(value), 'Doanh thu'];
                          return [value + ' vé', 'Số vé'];
                        }}
                      />
                      <Legend
                        formatter={(value) => {
                          if (value === 'doanhThu') return 'Doanh thu (VNĐ)';
                          return 'Số vé';
                        }}
                        verticalAlign="top"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="doanhThu"
                        stroke="#198754"
                        strokeWidth={3}
                        name="doanhThu"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="soVe"
                        stroke="#0d6efd"
                        strokeWidth={2}
                        name="soVe"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Movies */}
            <div className="col-lg-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-0 pt-3">
                  <h5 className="mb-0">Top 5 Phim (30 ngày)</h5>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {topMovies.map((movie, index) => (
                      <div key={index} className="list-group-item border-start-0 border-end-0">
                        <div className="d-flex align-items-center gap-3">
                          <div className="fw-bold text-primary" style={{ fontSize: '1.5rem', minWidth: '30px' }}>
                            #{index + 1}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                              {movie.tenPhim}
                            </div>
                            <small className="text-success fw-bold">
                              {formatCurrency(movie.tongDoanhThu)}
                            </small>
                            <small className="text-muted ms-2">
                              {movie.soLuongVeDaBan} vé
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                    {topMovies.length === 0 && (
                      <div className="list-group-item text-center text-muted py-5">
                        <Film size={48} className="mb-2 opacity-50" />
                        <p>Chưa có dữ liệu</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-0 pt-3">
                  <h5 className="mb-0">Hoạt Động Gần Đây</h5>
                </div>
                <div className="card-body p-0">
                  <ul className="list-group list-group-flush">
                    {recentActivities.map((activity, index) => (
                      <li key={index} className="list-group-item d-flex align-items-center border-start-0 border-end-0">
                        <div
                          className={`bg-${activity.color} rounded-circle me-3`}
                          style={{ width: "10px", height: "10px" }}
                        ></div>
                        <div className="flex-grow-1">
                          <p className="mb-0">{activity.message}</p>
                          <small className="text-muted">{activity.time}</small>
                        </div>
                      </li>
                    ))}
                    {recentActivities.length === 0 && (
                      <li className="list-group-item text-center text-muted py-5">
                        <Activity size={48} className="mb-2 opacity-50" />
                        <p>Chưa có hoạt động gần đây</p>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
