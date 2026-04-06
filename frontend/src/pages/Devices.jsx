import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Camera, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { deviceService } from '../services/api';
import { formatVND, formatDots, parseDots } from '../utils/format';
import '../styles/Breadcrumbs.css';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [editingDevice, setEditingDevice] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [formData, setFormData] = useState({ name: '', type: 'camera', pricePerDay: 0, description: '', totalQuantity: 1 });

  const fetchDevices = async () => {
    const res = await deviceService.getAll();
    setDevices(res.data);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleOpenForm = (device = null) => {
    setEditingDevice(device);
    setFormData(device || { name: '', type: 'camera', pricePerDay: 0, description: '', totalQuantity: 1 });
    if (device && device.units) {
      setSerialNumbers(device.units.map(u => u.serialNumber));
    } else {
      setSerialNumbers(['']);
    }
    setView(device ? 'edit' : 'add');
  };

  const handleBack = () => {
    setView('list');
    setEditingDevice(null);
  };

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
      return <ArrowUpDown size={14} style={{ marginLeft: '5px', opacity: 0.4, display: 'inline-block', verticalAlign: 'middle' }} />;
    }
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} style={{ marginLeft: '5px', color: 'var(--primary)', display: 'inline-block', verticalAlign: 'middle' }} />;
    if (sortConfig.direction === 'desc') return <ArrowDown size={14} style={{ marginLeft: '5px', color: 'var(--primary)', display: 'inline-block', verticalAlign: 'middle' }} />;
  };

  const sortedDevices = useMemo(() => {
    let sortableItems = [...devices];
    if (sortConfig.key !== null && sortConfig.direction !== 'default') {
      sortableItems.sort((a, b) => {
        let valA = (a.name || '').toLowerCase();
        let valB = (b.name || '').toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [devices, sortConfig]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalTotalQuantity = parseInt(formData.totalQuantity) || 1;
    const existingUnits = editingDevice?.units || [];
    const formattedUnits = Array.from({ length: finalTotalQuantity }).map((_, idx) => {
      const sn = serialNumbers[idx] || `SN-TEMP-${Date.now()}-${idx}`;
      const existing = existingUnits.find(u => u.serialNumber === sn) || existingUnits[idx];
      return {
        serialNumber: sn,
        status: existing ? existing.status : 'available'
      };
    });

    if (editingDevice) {
      // Calculate available quantity if totalQuantity changes
      const rentedCount = existingUnits.filter(u => u.status === 'renting').length;
      const maintenanceCount = existingUnits.filter(u => u.status === 'maintenance').length;
      const newAvail = finalTotalQuantity - rentedCount - maintenanceCount;
      
      await deviceService.update(editingDevice.id, { 
        ...formData, 
        units: formattedUnits,
        availableQuantity: newAvail >= 0 ? newAvail : 0 
      });
    } else {
      await deviceService.create({ 
        ...formData, 
        units: formattedUnits,
        availableQuantity: finalTotalQuantity 
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
            
            <div style={{ marginTop: '1.5rem', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div className="flex-between" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 0 }}>Số seri (S/N) thiết bị - Đăng ký {formData.totalQuantity} máy</label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {Array.from({ length: formData.totalQuantity }).map((_, idx) => (
                  <input 
                    key={idx}
                    placeholder={`Serial Number máy ${idx + 1}`}
                    required
                    value={serialNumbers[idx] || ''}
                    onChange={(e) => {
                       const newSNs = [...serialNumbers];
                       newSNs[idx] = e.target.value;
                       setSerialNumbers(newSNs);
                    }}
                    style={{ background: 'white' }}
                  />
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px', fontStyle: 'italic' }}>
                * Thay đổi số lượng phía trên để thấy danh sách S/N thay đổi tương ứng.
              </p>
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
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>Tên thiết bị {getSortIcon('name')}</th>
                <th>Loại</th>
                <th>Tồn kho</th>
                <th>Giá thuê/ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedDevices.map(device => (
                <tr key={device.id}>
                  <td>#{device.id}</td>
                  <td style={{ fontWeight: 600 }}>{device.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{device.type}</td>
                  <td>
                    <span style={{ whiteSpace: 'nowrap' }} className={device.availableQuantity > 0 ? getStatusClass('available') : getStatusClass('late')}>
                      {device.availableQuantity > 0 ? 'Có sẵn ' : 'Hết hàng '} 
                      ({device.availableQuantity || 0}/{device.totalQuantity || 1})
                    </span>
                    {device.units && device.units.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
                        {device.units.filter(u => u.status === 'available').length} rảnh
                      </div>
                    )}
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
