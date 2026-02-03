import React, { useState, useEffect } from "react";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

const Blog = () => {
  const featured = [
    {
      title: "Bom tấn Avatar 3 – Trở lại với đại dương Pandora",
      image: "https://images.unsplash.com/photo-1581905764498-f1b60bae941a?q=80&w=1920&auto=format&fit=crop",
      desc: "James Cameron hứa hẹn phần ba của Avatar sẽ mở rộng thế giới dưới nước tuyệt đẹp cùng những câu chuyện mới.",
    },
    {
      title: "Top 5 bộ phim Việt gây tiếng vang 2025",
      image: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=1920&auto=format&fit=crop",
      desc: "Từ 'Đất Rừng Phương Nam' đến 'Mai', điện ảnh Việt đang có những bước tiến mạnh mẽ trên thị trường quốc tế.",
    },
    {
      title: "Marvel mở rộng vũ trụ mới với The Kang Dynasty",
      image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1920&auto=format&fit=crop",
      desc: "Sau Infinity Saga, Marvel Studios công bố kỷ nguyên mới đầy tham vọng – Multiverse Saga.",
    },
  ];

  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % featured.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const posts = [
    {
      title: "Phim hành động thống trị phòng vé tháng 10",
      date: "10/10/2025",
      image: "https://cdn2.tuoitre.vn/thumb_w/730/471584752817336320/2025/9/21/81f5e0ab45d3cf8d96c2-1758439775595565016102.jpg",
      desc: "Các tác phẩm hành động của thị trường phim Việt Nam tiếp tục chứng minh sức hút khổng lồ của mình tại các rạp phim.",
    },
    {
      title: "Phim tâm lý Việt Nam trở lại mạnh mẽ",
      date: "05/10/2025",
      image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=800&auto=format&fit=crop",
      desc: "Thay vì chạy theo dòng phim thương mại, nhiều đạo diễn trẻ đang tạo nên làn sóng nghệ thuật mới.",
    },
  ];

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "#181a20" }}>
      <Header />

      {/* Banner nổi bật (slide) */}
      <section
        className="position-relative text-white text-center"
        style={{
          height: "400px",
          overflow: "hidden",
        }}
      >
        {featured.map((f, i) => (
          <div
            key={i}
            className={`position-absolute w-100 h-100 transition ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.8)), url(${f.image}) center/cover`,
              transition: "opacity 1s ease-in-out",
            }}
          >
            <div className="d-flex flex-column align-items-center justify-content-center h-100 px-4">
              <h1 className="display-6 fw-bold text-danger">{f.title}</h1>
              <p className="lead text-light col-md-6">{f.desc}</p>
              <button className="btn btn-outline-light mt-3">
                <i className="fas fa-play me-2"></i>Đọc thêm
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Danh sách bài viết */}
      <main className="container py-5 text-light">
        <h2 className="fw-bold text-danger mb-4">Bài viết mới nhất</h2>
        <div className="row g-4">
          {posts.map((post, idx) => (
            <div key={idx} className="col-md-6">
              <div
                className="card h-100 border-0 shadow-lg"
                style={{ background: "#1f2129", color: "#fff" }}
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="card-img-top"
                  style={{ height: "240px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="fw-bold text-danger">{post.title}</h5>
                  <small className="text-secondary">{post.date}</small>
                  <p className="text-light mt-2 small">{post.desc}</p>
                  <a href="#" className="btn btn-outline-danger btn-sm mt-2">
                    Đọc thêm
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
