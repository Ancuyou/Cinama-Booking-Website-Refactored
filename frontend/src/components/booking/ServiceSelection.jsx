import React, { useState, useEffect } from 'react';
import serviceService from '../../services/serviceService';

const ServiceSelection = ({ onServicesSelect, selectedServices = [] }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceCategories, setServiceCategories] = useState({});
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    console.log('Fetching services with category:', selectedCategory);
    
    let result;
    if (selectedCategory && selectedCategory !== 'all') {
      result = await serviceService.getServicesByCategory(selectedCategory);
    } else {
      result = await serviceService.getAllServices();
    }

    if (result.success) {
      console.log('Services fetched:', result.data);
      result.data = result.data.filter(service => service.trangThai !== false);
      setServices(result.data);

      // Group services by category (use danhMuc or loaiDichVu)
      const categories = {};
      result.data.forEach(service => {
        // Đảm bảo có đầy đủ thông tin của dịch vụ
        console.log('Service detail:', {
          id: service.maDv,
          name: service.tenDv || service.tenDichVu,
          category: service.danhMuc || service.loaiDichVu,
          price: service.donGia || service.gia
        });
        
        const category = service.danhMuc || service.loaiDichVu || 'Khác';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(service);
      });
      
      console.log('Grouped services by categories:', Object.keys(categories));
      setServiceCategories(categories);
    } else {
      console.error('Failed to fetch services:', result.message);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      // The backend endpoint returns services for a category; here we call a dedicated endpoint
      const res = await serviceService.getServicesByCategory('all');
      if (res.success) {
        // Derive categories from returned services
        const cats = new Set();
        res.data.forEach(s => {
          cats.add(s.danhMuc || s.loaiDichVu || 'other');
        });
        const list = [
          { id: 'all', name: 'Tất Cả' },
          { id: 'combo', name: 'Combo' },
          { id: 'popcorn', name: 'Bỏng Ngô' },
          { id: 'drink', name: 'Nước Uống' },
          { id: 'snack', name: 'Đồ Ăn Vặt' },
          { id: 'other', name: 'Khác' },
        ].filter(c => c.id === 'all' || cats.has(c.id));

        setCategoriesList(list);
      }
    } catch (error) {
      console.error('Lỗi lấy danh mục dịch vụ:', error);
    }
  };

  const handleServiceQuantityChange = (service, quantity) => {
    try {
      console.log('Service object:', service); // Để debug dữ liệu dịch vụ
      
      const newSelectedServices = [...selectedServices];
      const existingServiceIndex = newSelectedServices.findIndex(
        s => s.maDv === service.maDv
      );

      if (quantity === 0) {
        // Remove service if quantity is 0
        if (existingServiceIndex !== -1) {
          newSelectedServices.splice(existingServiceIndex, 1);
        }
      } else {
        // Update or add service - đảm bảo tất cả thông tin cần thiết được lưu
        const serviceData = {
          maDv: service.maDv,
          soLuong: quantity,
          // Đảm bảo lưu tất cả tên dịch vụ có thể có
          tenDichVu: service.tenDv || service.tenDichVu,
          tenDv: service.tenDv || service.tenDichVu,
          // Đảm bảo lưu tất cả giá dịch vụ có thể có
          donGia: service.donGia || service.gia,
          gia: service.donGia || service.gia,
          urlHinh: service.urlHinh,
          danhMuc: service.danhMuc || service.loaiDichVu
        };

        if (existingServiceIndex !== -1) {
          newSelectedServices[existingServiceIndex] = serviceData;
        } else {
          newSelectedServices.push(serviceData);
        }
      }

      onServicesSelect(newSelectedServices);
      console.log('Updated selected services:', newSelectedServices);
    } catch (error) {
      console.error('Error updating service quantity:', error);
    }
  };

  const getServiceQuantity = (serviceId) => {
    const service = selectedServices.find(s => s.maDv === serviceId);
    return service ? service.soLuong : 0;
  };

  const calculateServicesTotal = () => {
    return selectedServices.reduce(
      (total, service) => total + ((service.donGia || 0) * service.soLuong),
      0
    );
  };

  const ServiceCard = ({ service }) => {
    const quantity = getServiceQuantity(service.maDv);

    return (
      <div className="col-md-6 col-lg-6 mb-4">
        <div className="card h-100 service-card">
          <div className="position-relative">
            <img
              src={service.urlHinh || '/images/default-service.jpg'}
              alt={service.tenDv}
              className="card-img-top"
              style={{ height: '200px', objectFit: 'cover' }}
            />
            {quantity > 0 && (
              <div className="position-absolute top-0 end-0 m-2">
                <span className="badge bg-success fs-6">
                  {quantity}
                </span>
              </div>
            )}
          </div>
          
          <div className="card-body d-flex flex-column">
            <h6 className="card-title">{service.tenDv}</h6>
            <p className="card-text text-muted small flex-grow-1">
              {service.moTa || 'Dịch vụ chất lượng cao'}
            </p>
            
            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold text-primary">
                  {service.donGia.toLocaleString('vi-VN')} VNĐ
                </span>
                {service.donVi && (
                  <span className="text-muted small">/{service.donVi}</span>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleServiceQuantityChange(service, Math.max(0, quantity - 1))}
                    disabled={quantity === 0}
                  >
                    <i className="bi bi-dash"></i>
                  </button>
                  <span className="btn btn-outline-primary btn-sm" style={{ minWidth: '50px' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleServiceQuantityChange(service, quantity + 1)}
                    disabled={quantity >= 10} // Max 10 items
                  >
                    <i className="bi bi-plus"></i>
                  </button>
                </div>

                {quantity > 0 && (
                  <span className="text-success fw-bold">
                    {(service.donGia * quantity).toLocaleString('vi-VN')} VNĐ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="service-selection">
      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-cup-straw me-2"></i>
                Chọn dịch vụ đi kèm
              </h5>
              <small className="text-muted">
                Tăng thêm trải nghiệm xem phim của bạn
              </small>
            </div>
            <div className="card-body">
                <div className="mb-3 d-flex align-items-center gap-3">
                  <label className="mb-0 fw-semibold">Danh mục:</label>
                  <select
                    className="form-select w-auto"
                    value={selectedCategory}
                    onChange={async (e) => {
                      const cat = e.target.value;
                      setSelectedCategory(cat);
                      setLoading(true);
                      try {
                        let r;
                        if (cat === 'all') {
                          r = await serviceService.getAllServices();
                        } else {
                          r = await serviceService.getServicesByCategory(cat);
                        }

                        if (r && r.success) {
                          // Use returned data (r.data) to keep UI in sync
                          r.data = r.data.filter(service => service.trangThai !== false);
                          setServices(r.data);

                          const grouped = {};
                          (Array.isArray(r.data) ? r.data : []).forEach(service => {
                            const category = service.danhMuc || service.loaiDichVu || 'Khác';
                            if (!grouped[category]) grouped[category] = [];
                            grouped[category].push(service);
                          });
                          setServiceCategories(grouped);
                        } else {
                          setServices([]);
                          setServiceCategories({});
                        }
                      } catch (err) {
                        console.error(err);
                        setServices([]);
                        setServiceCategories({});
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              {Object.keys(serviceCategories).length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-cup text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">Hiện tại chưa có dịch vụ nào</p>
                </div>
              ) : (
                Object.entries(serviceCategories).map(([category, categoryServices]) => (
                  <div key={category} className="mb-5">
                    <h6 className="text-primary mb-3 border-bottom pb-2">
                      <i className="bi bi-tag me-2"></i>
                      {category}
                    </h6>
                    <div className="row">
                      {categoryServices.map(service => (
                        <ServiceCard key={service.maDv} service={service} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Services Summary */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-basket me-2"></i>
                Dịch vụ đã chọn
              </h5>
            </div>
            <div className="card-body">
              {selectedServices.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-basket text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2 mb-0">Chưa chọn dịch vụ nào</p>
                  <small className="text-muted">
                    Bạn có thể bỏ qua bước này nếu không cần dịch vụ
                  </small>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    {selectedServices.map((service, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{service.tenDichVu}</h6>
                          <div className="d-flex align-items-center">
                            <span className="text-muted small me-2">
                              {(service.donGia || 0).toLocaleString('vi-VN')} VNĐ x {service.soLuong}
                            </span>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                  const newServices = services.find(s => s.maDv === service.maDv);
                                  if (newServices) {
                                    handleServiceQuantityChange(newServices, service.soLuong - 1);
                                  }
                                }}
                              >
                                <i className="bi bi-dash"></i>
                              </button>
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                  const newServices = services.find(s => s.maDv === service.maDv);
                                  if (newServices) {
                                    handleServiceQuantityChange(newServices, service.soLuong + 1);
                                  }
                                }}
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="fw-bold text-primary">
                            {((service.donGia || 0) * service.soLuong).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Tổng dịch vụ:</span>
                    <span className="fw-bold text-primary fs-5">
                      {calculateServicesTotal().toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>

                  <div className="mt-3">
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => onServicesSelect([])}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Xóa tất cả
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Popular Services */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-header bg-white py-3">
              <h6 className="card-title mb-0">
                <i className="bi bi-star me-2"></i>
                Gợi ý phổ biến
              </h6>
            </div>
            <div className="card-body">
              <small className="text-muted">
                <i className="bi bi-lightbulb me-1"></i>
                Bắp rang bơ + Nước ngọt là combo được yêu thích nhất
              </small>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .service-card {
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        
        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .btn-group .btn {
          border-radius: 0;
        }

        .btn-group .btn:first-child {
          border-top-left-radius: 0.375rem;
          border-bottom-left-radius: 0.375rem;
        }

        .btn-group .btn:last-child {
          border-top-right-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }

        .service-card .card-img-top {
          transition: transform 0.3s;
        }

        .service-card:hover .card-img-top {
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .service-card {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceSelection;