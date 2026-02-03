import React, {useState, useEffect, use} from 'react';
import {Film, Plus, Utensils} from "lucide-react";
import {serviceService} from "../../services/index.js";
import {useToast} from "../common/Toast.jsx";

const AdminFoodManagement = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true);
    const [currentProducts, setCurrentProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [errors, setErrors] = useState({});
    const [totalPages, setTotalPages] = useState(1);
    const {showError, showSuccess} = useToast();
    const [filterCategory, setFilterCategory] = useState('all');
    const [formData, setFormData] = useState({
        maDv: '',
        tenDv: '',
        danhMuc: 'combo',
        donGia: '',
        moTa: '',
        urlHinh: '',
        trangThai: true
    });
    const [search, setSearch] = useState(false)

    useEffect(()=>{
        fetchProduct();
    },[])

    useEffect(() => {
        fetchPageProducts(currentPage);
    }, [currentPage]);

    const fetchProduct = async () =>  {
        const result = await serviceService.getAllServices();
        if (result.success) setProducts(result.data);
    }

    const fetchPageProducts = async (page = 1) => {
        try {
            setLoading(true);
            const result = await serviceService.getServicesPaginated(page);
            if (result.success) {
                const { currentItems, totalPages, currentPage } = result.data;
                setCurrentProducts(currentItems);
                setTotalPages(totalPages);
                setCurrentPage(currentPage);
            } else {
                setCurrentProducts([]);
                setTotalPages(1);
                setCurrentPage(1);
            }
        } catch (error) {
            showError("Lỗi kết nối API: " + error.message);
            setCurrentProducts([]);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }

    const categories = [
        { id: 'all', name: 'Tất Cả' },
        { id: 'combo', name: 'Combo', badge: 'primary' },
        { id: 'popcorn', name: 'Bỏng Ngô', badge: 'warning' },
        { id: 'drink', name: 'Nước Uống', badge: 'info' },
        { id: 'snack', name: 'Đồ Ăn Vặt', badge: 'secondary' },
        { id: 'other', name: 'Khác', badge: 'dark' }
    ];

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                maDv: null,
                tenDv: '',
                danhMuc: 'combo',
                donGia: '',
                moTa: '',
                urlHinh: '',
                trangThai: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.tenDv.trim()) newErrors.tenDv = 'Vui lòng nhập tên dịch vụ';
        if (!formData.donGia)
            newErrors.donGia = 'Vui lòng nhập đơn giá';
        if (formData.donGia < 0)
            newErrors.donGia = 'Đơn giá phải lớn hơn 0';
        if (formData.trangThai === null || formData.trangThai === undefined) {
            newErrors.trangThai = 'Vui lòng chọn trạng thái';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({})

        if (editingProduct) {
            const result = await serviceService.updateService(editingProduct.maDv, formData)
            if (!result.success) {
                showError(result.message);
                return;
            }
            else {
                showSuccess("Chỉnh sửa dịch vụ thành công");
                setProducts(products.map(p =>
                    p.maDv === editingProduct.maDv ? {...formData, maDv: p.maDv} : p
                ));
            }
        } else {
            const  result = await serviceService.createService(formData)
            if (result.success) {
                setProducts([...products, result.data]);
                showSuccess("Thêm mới dịch vụ thành công");
            } else {
                showError(result.message);
            }
        }

        handleCloseModal();
    };

    const handleDelete = (id) => {
        if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            const result = serviceService.deleteService(id);
            try {
                showSuccess("Xóa dịch vụ thành công");
                setProducts(products.filter(p => p.maDv !== id));
            }
            catch (e) {
                showError(e.message);
            }
        }
    };

    const handleToggleStatus = async (id) => {
        const newProduct = products.find(p => p.maDv === id);
        const result = await serviceService.updateService(id, {...newProduct, trangThai: newProduct.trangThai !== true});
        if (!result.success) {
            showError(result.message);
            setProducts(products.map(p =>
                p.maDv === id ? newProduct : p
            ));
        }
        else {
            setProducts(products.map(p =>
                p.maDv === id ? result.data : p
            ));
        }
    };

    const searchProducts = async (tenDv = '', danhMuc = '', page = 1) => {
        const result = await serviceService.searchServices(tenDv, danhMuc, page = 1);
        if (result.success) {
            const { currentItems, totalPages, currentPage } = result.data;
            setCurrentProducts(currentItems);
            setTotalPages(totalPages);
            setCurrentPage(currentPage);
        } else {
            setCurrentProducts([]);
            setTotalPages(1);
            setCurrentPage(1);
        }
    }

    const filteredProducts = products.filter(product => {
        const matchSearch = product.tenDv.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = filterCategory === 'all' || product.danhMuc === filterCategory;
        return matchSearch && matchCategory;
    });


    const getCategoryBadge = (category) => {
        const cat = categories.find(c => c.id === category);
        return cat?.badge || 'secondary';
    };

    const stats = {
        total: products.length,
        active: products.filter(p => p.trangThai === true).length,
        inactive: products.filter(p => p.trangThai === false).length,
        totalValue: products.reduce((sum, p) => sum + (p.donGia), 0)
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <link
                href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css"
                rel="stylesheet"
            />
            <link
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
                rel="stylesheet"
            />
            <div className="container-fluid px-4">
            <div className="card shadow-sm mb-4 mt-4">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white p-3 rounded">
                                <Utensils size={32}/>
                            </div>
                            <div>
                                <h1 className="mb-0 h3">Quản Lý Dịch vụ</h1>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => handleOpenModal(null)}
                        >
                            <Plus size={20} className="me-2" style={{verticalAlign: 'middle'}}/>
                            Thêm Dịch vụ
                        </button>
                    </div>
                </div>
            </div>

                <div className="row mb-4">
                    <div className="col-md-3 mb-3">
                        <div className="card shadow-sm h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-2">Tổng Sản Phẩm</h6>
                                        <h3 className="mb-0">{stats.total}</h3>
                                    </div>
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                                        <i className="fas fa-box fa-2x text-primary"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3 mb-3">
                        <div className="card shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-2">Đang Bán</h6>
                                        <h3 className="mb-0 text-success">{stats.active}</h3>
                                    </div>
                                    <div className="bg-success bg-opacity-10 rounded-circle p-3">
                                        <i className="fas fa-check-circle fa-2x text-success"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3 mb-3">
                        <div className="card shadow-sm h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-2">Ngừng Bán</h6>
                                        <h3 className="mb-0 text-danger">{stats.inactive}</h3>
                                    </div>
                                    <div className="bg-danger bg-opacity-10 rounded-circle p-3">
                                        <i className="fas fa-times-circle fa-2x text-danger"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-3 mb-3">
                        <div className="card shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-2">Tổng Giá Trị Dịch Vụ</h6>
                                        <h3 className="mb-0 text-warning">{(stats.totalValue / 1000000).toFixed(1)}M</h3>
                                    </div>
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                                        <i className="fas fa-dollar-sign fa-2x text-warning"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-8">
                                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Tìm kiếm theo tên sản phẩm..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-filter"></i>
                  </span>
                                    <select
                                        className="form-select"
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>Sản Phẩm</th>
                                    <th>Danh mục</th>
                                    <th>Giá Bán</th>
                                    <th>Trạng thái</th>
                                    <th className="text-end pe-4">Thao Tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.maDv}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={product.urlHinh}
                                                    alt={product.tenDv}
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                                    className="me-3"
                                                />
                                                <div>
                                                    <div className="fw-bold">{product.tenDv}</div>
                                                    <small className="text-muted">{product.moTa}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge bg-${getCategoryBadge(product.danhMuc)}`}>
                                              {categories.find(c => c.id === product.danhMuc)?.name}
                                            </span>
                                        </td>
                                        <td className="fw-bold">{product.donGia.toLocaleString('vi-VN')}đ</td>
                                        <td>
                        <span
                            className={`badge ${product.trangThai === true ? 'bg-success' : 'bg-secondary'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleToggleStatus(product.maDv)}
                        >
                          {product.trangThai === true ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                                        </td>
                                        <td className="text-end pe-4">   {/* pe-4 = padding-end: 1.5rem */}
                                            <div className="d-flex gap-2 justify-content-end">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenModal(product)}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product.maDv)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-5">
                                <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                                <p className="text-muted">Không tìm thấy sản phẩm nào</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination giữ nguyên */}
            {totalPages && totalPages > 1 && (
                <div className="card-footer bg-white mt-4">
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
                                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
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

            {isModalOpen && (
                <>
                    <div
                        className="modal show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={handleCloseModal}
                    >
                        <div
                            className="modal-dialog modal-lg modal-dialog-scrollable"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className={`fas ${editingProduct ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                                        {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={handleCloseModal}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            Tên Sản Phẩm <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.tenDv ? 'is-invalid' : ''}`}
                                            placeholder="VD: Combo 1 Người"
                                            value={formData.tenDv}
                                            onChange={(e) => setFormData({ ...formData, tenDv: e.target.value })}
                                        />
                                        {errors.tenDv && (
                                            <div className="invalid-feedback">{errors.tenDv}</div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            Danh Mục <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={formData.danhMuc}
                                            onChange={(e) => setFormData({ ...formData, danhMuc: e.target.value })}
                                        >
                                            {categories.filter(c => c.id !== 'all').map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">
                                                Giá Bán (VNĐ) <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.donGia ? 'is-invalid' : ''}`}
                                                placeholder="99000"
                                                value={formData.donGia}
                                                onChange={(e) => setFormData({ ...formData, donGia: parseInt(e.target.value) || '' })}
                                                required
                                            />
                                            {errors.donGia && (
                                                <div className="invalid-feedback">{errors.donGia}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Mô Tả</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="Mô tả chi tiết về sản phẩm..."
                                            value={formData.moTa}
                                            onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">URL Hình Ảnh</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.urlHinh}
                                            onChange={(e) => setFormData({ ...formData, urlHinh : e.target.value })}
                                        />
                                        {formData.urlHinh && (
                                            <img
                                                src={formData.urlHinh}
                                                alt="Preview"
                                                className="mt-3"
                                                style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                                            />
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Trạng Thái</label>
                                        <div>
                                            <div className="form-check form-check-inline">
                                                <input
                                                    className={`form-check-input ${errors.trangThai ? 'is-invalid' : ''}`}
                                                    type="radio"
                                                    id="statusActive"
                                                    value="active"
                                                    checked={formData.trangThai === true}
                                                    onChange={(e) => setFormData({ ...formData, trangThai : true })}
                                                />
                                                {errors.trangThai && (
                                                    <div className="invalid-feedback">{errors.trangThai}</div>
                                                )}
                                                <label className="form-check-label" htmlFor="statusActive">
                                                    Đang bán
                                                </label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    id="statusInactive"
                                                    value="inactive"
                                                    checked={formData.trangThai === false}
                                                    onChange={(e) => setFormData({ ...formData, trangThai: false })}
                                                />
                                                <label className="form-check-label" htmlFor="statusInactive">
                                                    Ngừng bán
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCloseModal}
                                    >
                                        <i className="fas fa-times me-2"></i>Hủy
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSubmit}
                                    >
                                        <i className="fas fa-save me-2"></i>
                                        {editingProduct ? 'Cập Nhật' : 'Thêm Mới'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
            <style jsx>{`
                .modal-title,
                .form-label,
                .form-check-label    
                {
                  display: flex;
                  gap: 0.2rem;
                  color: black;  
                }
            `}</style>
        </div>
    );
};

export default AdminFoodManagement;
