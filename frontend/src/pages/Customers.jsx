import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { customerService, rentalService, deviceService } from '../services/api';
import Modal from '../components/Modal';
import { formatVND } from '../utils/format';
import '../styles/Forms.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', identityCard: '', email: '', notes: '', isRental: false });

  const [rentals, setRentals] = useState([]);
  const [devices, setDevices] = useState([]);

  const fetchData = useCallback(async () => {
    const [cRes, rRes, dRes] = await Promise.all([
      customerService.getAll(),
      rentalService.getAll(),
      deviceService.getAll()
    ]);
    setCustomers(cRes.data);
    setRentals(rRes.data);
    setDevices(dRes.data);
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

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

  const handleOpenModal = (customer = null) => {
    setEditingCustomer(customer);
    setFormData(customer || { name: '', phone: '', identityCard: '', email: '', notes: '', isRental: false });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      await customerService.update(editingCustomer.id, formData);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      await customerService.remove(id);
      fetchData();
    }
  };

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
                <th>ID</th>
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
                  <td>#{customer.id}</td>
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
                      <button onClick={() => handleOpenModal(customer)} className="btn-icon-primary" title="Sửa thông tin"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(customer.id)} className="btn-icon-danger" title="Xóa khách"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCustomer ? "Sửa khách hàng" : "Thêm mới khách hàng"}
      >
        <form onSubmit={handleSubmit}>
          <div>
            <label>Tên khách hàng</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="form-group-mt">
            <label>Số điện thoại</label>
            <input 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="form-group-mt">
            <label>Số căn cước</label>
            <input 
              value={formData.identityCard || ''}
              onChange={e => setFormData({...formData, identityCard: e.target.value})}
            />
          </div>
          <div className="form-group-mt">
            <label>Email</label>
            <input 
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="form-group-mt">
            <label>Ghi chú</label>
            <textarea 
              rows="3"
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="rental-checkbox-wrapper">
            <input 
              type="checkbox"
              id="isRentalCheck"
              checked={formData.isRental}
              onChange={e => setFormData({...formData, isRental: e.target.checked})}
              className="checkbox-inline"
            />
            <label htmlFor="isRentalCheck" className="rental-checkbox-label">Đánh dấu là Rental (Cửa hàng/Đối tác)</label>
          </div>
          <div className="flex-between form-actions-mt">
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu thay đổi</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
