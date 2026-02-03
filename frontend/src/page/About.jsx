import React from "react";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

const About = () => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#181a20" }}>
      <Header />

      {/* Banner */}
      <section
        className="position-relative text-white d-flex align-items-center justify-content-center text-center"
        style={{
          height: "400px",
          background:
            "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1920&auto=format&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div>
          <h1 className="display-4 fw-bold text-danger">Về SuperMovie</h1>
          <p className="lead text-light">
            Trải nghiệm điện ảnh đỉnh cao – nơi cảm xúc và nghệ thuật hòa quyện
          </p>
        </div>
      </section>

      {/* Giới thiệu chính */}
      <main className="container py-5 text-light">
        <div className="row align-items-center mb-5">
          <div className="col-md-6 mb-4">
            <img
              src="https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=800&auto=format&fit=crop"
              alt="Cinema"
              className="img-fluid rounded shadow-lg"
            />
          </div>
          <div className="col-md-6">
            <h2 className="fw-bold text-danger mb-3">Hành trình của chúng tôi</h2>
            <p>
              SuperMovie được thành lập với sứ mệnh mang đến trải nghiệm xem phim trực tuyến và đặt vé rạp nhanh chóng, tiện lợi.
              Chúng tôi luôn cập nhật các bộ phim mới nhất, đa dạng thể loại – từ bom tấn Hollywood đến phim Việt đặc sắc.
            </p>
            <p>
              Với nền tảng thân thiện, SuperMovie giúp bạn tìm kiếm, đặt vé, và theo dõi các phim yêu thích chỉ trong vài giây.
            </p>
          </div>
        </div>

        {/* Giá trị cốt lõi */}
        <div className="row text-center">
          {[
            { icon: "fa-ticket-alt", title: "Đặt vé dễ dàng", desc: "Chỉ vài cú nhấp chuột để chọn phim, suất chiếu và vị trí yêu thích." },
            { icon: "fa-film", title: "Phim mới mỗi ngày", desc: "Cập nhật liên tục, mang đến trải nghiệm điện ảnh sống động nhất." },
            { icon: "fa-users", title: "Cộng đồng yêu phim", desc: "Kết nối người hâm mộ, chia sẻ cảm xúc và review phim chân thật." },
          ].map((item, idx) => (
            <div key={idx} className="col-md-4 mb-4">
              <div className="p-4 rounded bg-dark h-100 shadow-sm">
                <i className={`fas ${item.icon} fa-3x text-danger mb-3`}></i>
                <h5 className="fw-bold text-white mb-2">{item.title}</h5>
                <p className="text-secondary small">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
