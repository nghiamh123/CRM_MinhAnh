import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { deviceService } from '../services/api';
import { formatVND, formatDots, parseDots } from '../utils/format';
import '../styles/Breadcrumbs.css';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'camera', status: 'available', pricePerDay: 0, description: '', totalQuantity: 1 });

  const fetchDevices = async () => {
    const res = await deviceService.getAll();
    setDevices(res.data);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleOpenForm = (device = null) => {
    setEditingDevice(device);
    setFormData(device || { name: '', type: 'camera', status: 'available', pricePerDay: 0, description: '', totalQuantity: 1 });
    setView(device ? 'edit' : 'add');
  };

  const handleBack = () => {
    setView('list');
    setEditingDevice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingDevice) {
      // Handle adjusting available stock based on total quantity changes
      const diff = parseInt(formData.totalQuantity) - (editingDevice.totalQuantity || 1);
      const newAvail = (editingDevice.availableQuantity || 1) + diff;
      await deviceService.update(editingDevice.id, { 
        ...formData, 
        availableQuantity: newAvail >= 0 ? newAvail : 0 
      });
    } else {
      await deviceService.create({ 
        ...formData, 
        availableQuantity: formData.totalQuantity 
      });
    }
    handleBack();
    fetchDevices();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      await deviceService.remove(id);
      fetchDevices();
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  if (view !== 'list') {
    return (
      <div className="container">
        <div className="breadcrumb-container">
          <span className="breadcrumb-item" onClick={handleBack}>Thiết bị</span>
          <ChevronRight className="breadcrumb-separator" size={16} />
          <span className="breadcrumb-item active">{view === 'add' ? 'Thêm mới' : 'Cập nhật'}</span>
        </div>

        <div className="form-section-card">
          <div className="back-button" onClick={handleBack}>
            <ChevronLeft size={18} />
            Quay lại danh sách
          </div>
          
          <h2 style={{ marginBottom: '1.5rem' }}>{view === 'add' ? 'Thêm thiết bị mới' : `Sửa thiết bị: ${editingDevice.name}`}</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label>Tên thiết bị</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label>Số lượng</label>
                <input 
                  type="number"
                  min="1"
                  required
                  value={formData.totalQuantity}
                  onChange={e => setFormData({...formData, totalQuantity: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label>Loại</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="camera">Camera</option>
                <option value="lens">Lens</option>
                <option value="tripod">Tripod</option>
                <option value="accessory">Phụ kiện khác</option>
              </select>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label>Giá thuê/ngày (VNĐ)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text"
                  required
                  className="input-currency"
                  value={formatDots(formData.pricePerDay)}
                  onChange={e => setFormData({...formData, pricePerDay: parseDots(e.target.value)})}
                  placeholder="Nhập giá tiền..."
                  style={{ paddingRight: '50px' }}
                />
                <span style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-light)', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  pointerEvents: 'none',
                  opacity: 0.7
                }}>
                  VNĐ
                </span>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label>Mô tả thiết bị</label>
              <textarea 
                rows="3"
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Nhập mô tả chi tiết, tình trạng máy..."
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label>Tình trạng</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="available">Có sẵn</option>
                <option value="renting">Đang thuê</option>
                <option value="maintenance">Bảo trì</option>
                <option value="late">Trễ hạn</option>
              </select>
            </div>
            <div className="flex-between" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn-outline" onClick={handleBack}>Hủy</button>
              <button type="submit" className="btn-primary">Lưu thiết bị</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between">
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Danh sách thiết bị</h1>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={20} />
          <span>Thêm thiết bị</span>
        </button>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên thiết bị</th>
                <th>Loại</th>
                <th>Tồn kho</th>
                <th>Giá thuê/ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr key={device.id}>
                  <td>#{device.id}</td>
                  <td style={{ fontWeight: 600 }}>{device.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{device.type}</td>
                  <td>
                    <span className={device.availableQuantity > 0 ? getStatusClass('available') : getStatusClass('late')}>
                      {device.availableQuantity || 0} / {device.totalQuantity || 1}
                    </span>
                  </td>
                  <td>{formatVND(device.pricePerDay)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleOpenForm(device)} style={{ color: 'var(--primary)' }}><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(device.id)} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
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

export default Devices;
