import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VNPayRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to our payment return page with all query parameters
    const currentSearch = location.search;
    navigate(`/payment/return${currentSearch}`, { replace: true });
  }, [navigate, location.search]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
        <h5>Đang xử lý kết quả thanh toán...</h5>
        <p className="text-muted">Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  );
};

export default VNPayRedirect;