import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { deviceService } from '../services/api';
import { formatVND, formatDots, parseDots } from '../utils/format';
import { useDataContext } from '../context/DataContext';
import '../styles/Breadcrumbs.css';
import '../styles/Forms.css';

const Devices = () => {
  const { devices, refreshData, loading } = useDataContext();
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [editingDevice, setEditingDevice] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [formData, setFormData] = useState({ name: '', type: 'camera', pricePerDay: 0, description: '', totalQuantity: 1 });

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
      return <ArrowUpDown size={14} className="sort-icon" />;
    }
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="sort-icon-active" />;
    if (sortConfig.direction === 'desc') return <ArrowDown size={14} className="sort-icon-active" />;
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
    refreshData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      await deviceService.remove(id);
      refreshData();
    }
  };

  if (loading && devices.length === 0) return <div className="container">Đang tải danh sách thiết bị...</div>;

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
          
          <h2 className="form-title">{view === 'add' ? 'Thêm thiết bị mới' : `Sửa thiết bị: ${editingDevice.name}`}</h2>

          <form onSubmit={handleSubmit}>
            <div className="devices-grid-2">
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
            <div className="form-group-mt">
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
            <div className="form-group-mt">
              <label>Giá thuê/ngày (VNĐ)</label>
              <div className="input-currency-wrapper">
                <input 
                  type="text"
                  required
                  className="input-currency input-currency-field"
                  value={formatDots(formData.pricePerDay)}
                  onChange={e => setFormData({...formData, pricePerDay: parseDots(e.target.value)})}
                  placeholder="Nhập giá tiền..."
                />
                <span className="input-currency-label">
                  VNĐ
                </span>
              </div>
            </div>
            <div className="form-group-mt">
              <label>Mô tả thiết bị</label>
              <textarea 
                rows="3"
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Nhập mô tả chi tiết, tình trạng máy..."
              />
            </div>
            
            <div className="sn-container">
              <div className="flex-between sn-header">
                <label className="sn-label">Số seri (S/N) thiết bị - Đăng ký {formData.totalQuantity} máy</label>
              </div>
              <div className="sn-grid">
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
                    className="sn-input"
                  />
                ))}
              </div>
              <p className="sn-note">
                * Thay đổi số lượng phía trên để thấy danh sách S/N thay đổi tương ứng.
              </p>
            </div>
            <div className="flex-between form-actions-mt">
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
        <h1 className="page-title">Danh sách thiết bị</h1>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={20} />
          <span>Thêm thiết bị</span>
        </button>
      </div>

      <div className="card card-mt">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="table-header-cursor">Tên thiết bị {getSortIcon('name')}</th>
                <th>Loại</th>
                <th>Tồn kho</th>
                <th>Giá thuê/ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedDevices.map(device => (
                <tr key={device.id}>
                  <td className="cell-bold">{device.name}</td>

                  <td className="cell-capitalize">{device.type}</td>
                  <td>
                    <span className={`cell-nowrap ${device.availableQuantity > 0 ? getStatusClass('available') : getStatusClass('late')}`}>
                      {device.availableQuantity > 0 ? 'Có sẵn ' : 'Hết hàng '} 
                      ({device.availableQuantity || 0}/{device.totalQuantity || 1})
                    </span>
                    {device.units && device.units.length > 0 && (
                      <div className="device-rảnh-text">
                        {device.units.filter(u => u.status === 'available').length} rảnh
                      </div>
                    )}
                  </td>
                  <td>{formatVND(device.pricePerDay)}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleOpenForm(device)} className="btn-icon-primary"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(device.id)} className="btn-icon-danger"><Trash2 size={18} /></button>
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
