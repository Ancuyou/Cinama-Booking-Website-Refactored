import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ background: '#23272f', color: '#f1f1f1', borderTop: '1px solid rgba(255,255,255,0.05)' }} className="pt-5">
      <div className="container">
        <div className="row g-4">
          {/* Logo & Intro */}
          <div className="col-md-3">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <img
                src="/images/cinema_logo.png"
                alt="CineTickets"
                style={{ height: '100px' }}
                className="me-2"
              />
              <span className="fw-bold fs-4" style={{ color: '#FFC107' }}>CineTickets</span>
            </div>
            <div className="d-flex gap-2 mt-3 media align-items-center justify-content-center">
              <a href="#" className="btn text-light d-flex align-items-center justify-content-center" style={{
                background: 'rgba(255,255,255,0.1)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                padding: 0
              }}>
                <Facebook size={25} />
              </a>
              <a href="#" className="btn text-light d-flex align-items-center justify-content-center" style={{
                background: 'rgba(255,255,255,0.1)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                padding: 0
              }}>
                <Twitter size={25} />
              </a>
              <a href="#" className="btn text-light d-flex align-items-center justify-content-center" style={{
                background: 'rgba(255,255,255,0.1)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                padding: 0
              }}>
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Phim */}
          <div className="col-md-3">
            <h6 className="fw-bold mb-4" style={{ color: '#ff4b2b' }}>PHIM</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="#now-showing-section" className="text-light text-decoration-none small">Phim đang chiếu</a></li>
              <li className="mb-2"><a href="#coming-soon-section" className="text-light text-decoration-none small">Phim sắp chiếu</a></li>
              <li className="mb-2"><a href="#" className="text-light text-decoration-none small">Suất chiếu đặc biệt</a></li>
            </ul>
          </div>

          {/* Rạp */}
          <div className="col-md-3">
            <h6 className="fw-bold mb-4" style={{ color: '#ff4b2b' }}>RẠP CHIẾU</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="#" className="text-light text-decoration-none small">Danh sách rạp</a></li>
              <li className="mb-2"><a href="#" className="text-light text-decoration-none small">Rạp đặc biệt</a></li>
              <li className="mb-2"><a href="#" className="text-light text-decoration-none small">Lịch chiếu</a></li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div className="col-md-3">
            <h6 className="fw-bold mb-4" style={{ color: '#ff4b2b' }}>HỖ TRỢ KHÁCH HÀNG</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="#" className="text-light text-decoration-none small">Hướng dẫn đặt vé</a></li>
              <li className="mb-2"><a href="#" className="text-light text-decoration-none small">Chính sách hoàn vé</a></li>
              <li className="mb-2"><a href="#cinema-info-section" className="text-light text-decoration-none small">Liên hệ</a></li>
            </ul>
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="row mt-4" style={{
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px'
        }}>
          <div className="col-12" style={{
              textAlign: 'center'
          }}>
            <h6 className="fw-bold mb-3 text-light" >
                PHƯƠNG THỨC THANH TOÁN</h6>
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-center">
              {/* Visa SVG */}
              <div className="payment-icon">
                <svg fill="#1a1f71" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" height="45" width="70">
                  <path d="M15.854 11.329l-2.003 9.367h-2.424l2.006-9.367zM26.051 17.377l1.275-3.518 0.735 3.518zM28.754 20.696h2.242l-1.956-9.367h-2.069c-0.003-0-0.007-0-0.010-0-0.459 0-0.853 0.281-1.019 0.68l-0.003 0.007-3.635 8.68h2.544l0.506-1.4h3.109zM22.429 17.638c0.010-2.473-3.419-2.609-3.395-3.714 0.008-0.336 0.327-0.694 1.027-0.785 0.13-0.013 0.28-0.021 0.432-0.021 0.711 0 1.385 0.162 1.985 0.452l-0.027-0.012 0.425-1.987c-0.673-0.261-1.452-0.413-2.266-0.416h-0.001c-2.396 0-4.081 1.275-4.096 3.098-0.015 1.348 1.203 2.099 2.122 2.549 0.945 0.459 1.262 0.754 1.257 1.163-0.006 0.63-0.752 0.906-1.45 0.917-0.032 0.001-0.071 0.001-0.109 0.001-0.871 0-1.691-0.219-2.407-0.606l0.027 0.013-0.439 2.052c0.786 0.315 1.697 0.497 2.651 0.497 0.015 0 0.030-0 0.045-0h-0.002c2.546 0 4.211-1.257 4.22-3.204zM12.391 11.329l-3.926 9.367h-2.562l-1.932-7.477c-0.037-0.364-0.26-0.668-0.57-0.82l-0.006-0.003c-0.688-0.338-1.488-0.613-2.325-0.786l-0.066-0.011 0.058-0.271h4.124c0 0 0.001 0 0.001 0 0.562 0 1.028 0.411 1.115 0.948l0.001 0.006 1.021 5.421 2.522-6.376z"></path>
                </svg>
              </div>

              {/* Mastercard SVG */}
              <div className="payment-icon">
                <svg viewBox="0 -9 58 58" fill="none" xmlns="http://www.w3.org/2000/svg" height="45" width="70">
                  <path d="M34.3102 28.9765H23.9591V10.5122H34.3102V28.9765Z" fill="#FF5F00"></path>
                  <path d="M24.6223 19.7429C24.6223 15.9973 26.3891 12.6608 29.1406 10.5107C27.1285 8.93843 24.5892 7.99998 21.8294 7.99998C15.2961 7.99998 10 13.2574 10 19.7429C10 26.2283 15.2961 31.4857 21.8294 31.4857C24.5892 31.4857 27.1285 30.5473 29.1406 28.975C26.3891 26.8249 24.6223 23.4884 24.6223 19.7429" fill="#EB001B"></path>
                  <path d="M48.2706 19.7429C48.2706 26.2283 42.9745 31.4857 36.4412 31.4857C33.6814 31.4857 31.1421 30.5473 29.1293 28.975C31.8815 26.8249 33.6483 23.4884 33.6483 19.7429C33.6483 15.9973 31.8815 12.6608 29.1293 10.5107C31.1421 8.93843 33.6814 7.99998 36.4412 7.99998C42.9745 7.99998 48.2706 13.2574 48.2706 19.7429" fill="#F79E1B"></path>
                </svg>
              </div>

              {/* VNPay - file local */}
              <div className="payment-icon">
                <img src="/images/payments/vnpay-logo-inkythuatso.svg" alt="VNPay"
                     style={{ width: "50px", height: "auto" }} />
              </div>

              {/* MoMo */}
              <div className="payment-icon">
                <img src="/images/payments/momo.svg" alt="MoMo"
                     style={{ width: "50px", height: "auto" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <div className="text-center text-secondary small pb-4">
          <p className="mb-1">Công ty TNHH CineTickets Việt Nam</p>
          <p className="mb-1">Địa chỉ: Tòa nhà Innovation, 24 Quang Trung, Quận Gò Vấp, TP. Hồ Chí Minh</p>
          <p className="mb-0">&copy; {new Date().getFullYear()} CineTickets. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
          .payment-icon svg {
              width: 50px;
              height: 50px;
          }

          .payment-icon {
          padding: 10px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          //background: rgba(255, 255, 255, 0.05);
          //border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .payment-icon:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }
        .media {
            width: 300px;
            height: auto;
        }
        
        .media a:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </footer>
  );
};

export default Footer;

