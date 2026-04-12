import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, X, Image as ImageIcon, Camera } from 'lucide-react';
import { customerService, uploadService } from '../services/api';
import Modal from '../components/Modal';

import { formatVND } from '../utils/format';
import { useDataContext } from '../context/DataContext';
import '../styles/Breadcrumbs.css';
import '../styles/Forms.css';


const Customers = () => {
  const { customers, rentals, devices, refreshData, loading } = useDataContext();
  const [view, setView] = useState('list'); // 'list', 'edit'
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    identityCard: '', 
    idCardFront: '',
    idCardBack: '',
    idCardSelfie: '',
    email: '', 
    notes: '', 
    isRental: false 
  });

  const [uploadStatus, setUploadStatus] = useState({
    idCardFront: "idle",
    idCardBack: "idle",
    idCardSelfie: "idle",
  });


  const getCustomerStats = useCallback((customerId) => {
    const customerRentals = rentals.filter(r => r.customerId?.id === customerId || r.customerId === customerId);
    let totalSpent = 0;
    
    customerRentals.forEach(r => {
      const d1 = new Date(r.rentalDate);
      const d2 = new Date(r.plannedReturnDate);
      let days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      if (days < 1) days = 1;

      if (r.devices && r.devices.length > 0) {
        r.devices.forEach(item => {
          totalSpent += days * (item.pricePerDay || 0) * (item.quantity || 1);
        });
      } else if (r.deviceId) {
        // Fallback cho đơn hệ cũ
        const deviceId = r.deviceId?.id || r.deviceId;
        const device = devices.find(d => d.id === deviceId);
        if (device) totalSpent += days * (device.pricePerDay || 0);
      }
    });

    return {
      count: customerRentals.length,
      spent: totalSpent
    };
  }, [rentals, devices]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'default';
      key = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key || sortConfig.direction === 'default') {
      return <ArrowUpDown size={14} className="sort-icon" />;
    }
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="sort-icon-active" />;
    if (sortConfig.direction === 'desc') return <ArrowDown size={14} className="sort-icon-active" />;
  };

  const sortedCustomers = useMemo(() => {
    let sortableItems = customers.map(c => ({ ...c, _stats: getCustomerStats(c.id) }));
    if (sortConfig.key !== null && sortConfig.direction !== 'default') {
      sortableItems.sort((a, b) => {
        let valA = sortConfig.key === 'name' ? (a.name || '').toLowerCase() :
                   sortConfig.key === 'rentals' ? a._stats.count :
                   sortConfig.key === 'spent' ? a._stats.spent : '';
        let valB = sortConfig.key === 'name' ? (b.name || '').toLowerCase() :
                   sortConfig.key === 'rentals' ? b._stats.count :
                   sortConfig.key === 'spent' ? b._stats.spent : '';
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [customers, sortConfig, getCustomerStats]);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus((prev) => ({ ...prev, [field]: "uploading" }));
    try {
      const res = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, [field]: res.data.url }));
      setUploadStatus((prev) => ({ ...prev, [field]: "success" }));
    } catch (err) {
      console.error(err);
      alert("Lỗi khi upload ảnh: " + (err.response?.data?.error || err.message));
      setUploadStatus((prev) => ({ ...prev, [field]: "error" }));
    }
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      identityCard: customer.identityCard || '',
      idCardFront: customer.idCardFront || '',
      idCardBack: customer.idCardBack || '',
      idCardSelfie: customer.idCardSelfie || '',
      email: customer.email || '',
      notes: customer.notes || '',
      isRental: customer.isRental || false
    });
    setUploadStatus({
      idCardFront: "idle",
      idCardBack: "idle",
      idCardSelfie: "idle",
    });
    setView('edit');
  };

  const handleBack = () => {
    setView('list');
    setEditingCustomer(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      await customerService.update(editingCustomer.id, formData);
    }
    handleBack();
    refreshData();
  };


  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      await customerService.remove(id);
      refreshData();
    }
  };

  if (loading && customers.length === 0) return <div className="container">Đang tải dữ liệu khách hàng...</div>;

  if (view !== 'list') {
    return (
      <div className="container">
        <div className="breadcrumb-container">
          <span className="breadcrumb-item" onClick={handleBack}>Khách hàng</span>
          <ChevronRight className="breadcrumb-separator" size={16} />
          <span className="breadcrumb-item active">Chỉnh sửa khách hàng</span>
        </div>

        <div className="form-section-card">
          <div className="back-button" onClick={handleBack}>
            <ChevronLeft size={18} />
            Quay lại danh sách
          </div>

          <h2 className="form-title">Chỉnh sửa khách hàng: {editingCustomer.name}</h2>

          <form onSubmit={handleSubmit}>
            <div className="customer-detail-box" style={{ background: 'white', border: '1px solid #e2e8f0', borderStyle: 'solid' }}>
              <div className="customer-grid-2">
                <div>
                  <label>Tên khách hàng *</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label>Số điện thoại *</label>
                  <input 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label>Số căn cước</label>
                  <input 
                    value={formData.identityCard || ''}
                    onChange={e => setFormData({...formData, identityCard: e.target.value})}
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group-mt">
                <label>Ghi chú</label>
                <textarea 
                  rows="3"
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="rental-checkbox-wrapper" style={{ marginBottom: '1.5rem' }}>
                <input 
                  type="checkbox"
                  id="isRentalCheckEdit"
                  checked={formData.isRental}
                  onChange={e => setFormData({...formData, isRental: e.target.checked})}
                  className="checkbox-inline"
                />
                <label htmlFor="isRentalCheckEdit" className="rental-checkbox-label">Đánh dấu là Rental (Cửa hàng/Đối tác)</label>
              </div>

              <label className="upload-label">Ảnh căn cước & Chân dung</label>
              <div className="upload-grid">
                {/* Front */}
                <div className="upload-box">
                  <div className="file-input-wrapper">
                    {formData.idCardFront ? (
                      <div className="image-preview-container">
                        <img src={formData.idCardFront} className="image-preview" alt="Front" />
                        <div className="remove-image-btn" onClick={() => setFormData(prev => ({ ...prev, idCardFront: "" }))}>
                          <X size={14} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={24} color="#94a3b8" />
                        <span className="file-input-label">Mặt trước</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "idCardFront")} />
                      </>
                    )}
                  </div>
                  <div className={`upload-status status-${uploadStatus.idCardFront}`}>
                    {uploadStatus.idCardFront === "uploading" && "Đang tải..."}
                    {uploadStatus.idCardFront === "success" && "Hoàn tất"}
                    {uploadStatus.idCardFront === "error" && "Lỗi"}
                  </div>
                </div>

                {/* Back */}
                <div className="upload-box">
                  <div className="file-input-wrapper">
                    {formData.idCardBack ? (
                      <div className="image-preview-container">
                        <img src={formData.idCardBack} className="image-preview" alt="Back" />
                        <div className="remove-image-btn" onClick={() => setFormData(prev => ({ ...prev, idCardBack: "" }))}>
                          <X size={14} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={24} color="#94a3b8" />
                        <span className="file-input-label">Mặt sau</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "idCardBack")} />
                      </>
                    )}
                  </div>
                  <div className={`upload-status status-${uploadStatus.idCardBack}`}>
                    {uploadStatus.idCardBack === "uploading" && "Đang tải..."}
                    {uploadStatus.idCardBack === "success" && "Hoàn tất"}
                    {uploadStatus.idCardBack === "error" && "Lỗi"}
                  </div>
                </div>

                {/* Selfie */}
                <div className="upload-box">
                  <div className="file-input-wrapper">
                    {formData.idCardSelfie ? (
                      <div className="image-preview-container">
                        <img src={formData.idCardSelfie} className="image-preview" alt="Selfie" />
                        <div className="remove-image-btn" onClick={() => setFormData(prev => ({ ...prev, idCardSelfie: "" }))}>
                          <X size={14} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera size={24} color="#94a3b8" />
                        <span className="file-input-label">Chân dung</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "idCardSelfie")} />
                      </>
                    )}
                  </div>
                  <div className={`upload-status status-${uploadStatus.idCardSelfie}`}>
                    {uploadStatus.idCardSelfie === "uploading" && "Đang tải..."}
                    {uploadStatus.idCardSelfie === "success" && "Hoàn tất"}
                    {uploadStatus.idCardSelfie === "error" && "Lỗi"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-between form-actions-wrapper">
              <button type="button" className="btn-outline btn-cancel" onClick={handleBack}>Hủy bỏ</button>
              <button type="submit" className="btn-primary btn-confirm">Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between">
        <h1 className="page-title">Theo dõi Khách hàng</h1>
      </div>

      <div className="card card-mt">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="table-header-cursor">Tên {getSortIcon('name')}</th>
                <th>Phân loại</th>
                <th>Số điện thoại</th>
                <th>Căn cước</th>
                <th onClick={() => handleSort('rentals')} className="table-header-cursor">Số lần thuê {getSortIcon('rentals')}</th>
                <th onClick={() => handleSort('spent')} className="table-header-cursor">Tổng chi tiêu {getSortIcon('spent')}</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="cell-bold">{customer.name}</td>
                  <td>
                    {customer.isRental ? (
                      <span className="status-badge status-available badge-rental">Rental</span>
                    ) : (
                      <span className="status-badge badge-personal">Cá nhân</span>
                    )}
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.identityCard}</td>
                  <td className="cell-bold customer-color-primary">{customer._stats.count} lần</td>
                  <td className="cell-bold customer-color-success">{formatVND(customer._stats.spent)}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleOpenEdit(customer)} className="btn-icon-primary" title="Sửa thông tin"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(customer.id)} className="btn-icon-danger" title="Xóa khách"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

};

export default Customers;
