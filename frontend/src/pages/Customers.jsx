import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { customerService, rentalService, deviceService } from '../services/api';
import Modal from '../components/Modal';
import { formatVND } from '../utils/format';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', identityCard: '', email: '', notes: '', isRental: false });

  const [rentals, setRentals] = useState([]);
  const [devices, setDevices] = useState([]);

  const fetchData = async () => {
    const [cRes, rRes, dRes] = await Promise.all([
      customerService.getAll(),
      rentalService.getAll(),
      deviceService.getAll()
    ]);
    setCustomers(cRes.data);
    setRentals(rRes.data);
    setDevices(dRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCustomerStats = (customerId) => {
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
  };

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
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Theo dõi Khách hàng</h1>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Phân loại</th>
                <th>Số điện thoại</th>
                <th>Căn cước</th>
                <th>Số lần thuê</th>
                <th>Tổng chi tiêu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>#{customer.id}</td>
                  <td style={{ fontWeight: 600 }}>{customer.name}</td>
                  <td>
                    {customer.isRental ? (
                      <span className="status-badge status-available" style={{ fontSize: '0.7rem' }}>Rental</span>
                    ) : (
                      <span className="status-badge" style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569' }}>Cá nhân</span>
                    )}
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.identityCard}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{getCustomerStats(customer.id).count} lần</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatVND(getCustomerStats(customer.id).spent)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleOpenModal(customer)} style={{ color: 'var(--primary)' }} title="Sửa thông tin"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(customer.id)} style={{ color: 'var(--danger)' }} title="Xóa khách"><Trash2 size={18} /></button>
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
          <div style={{ marginTop: '1rem' }}>
            <label>Số điện thoại</label>
            <input 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label>Số căn cước</label>
            <input 
              value={formData.identityCard || ''}
              onChange={e => setFormData({...formData, identityCard: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label>Email</label>
            <input 
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label>Ghi chú</label>
            <textarea 
              rows="3"
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox"
              id="isRentalCheck"
              checked={formData.isRental}
              onChange={e => setFormData({...formData, isRental: e.target.checked})}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="isRentalCheck" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>Đánh dấu là Rental (Cửa hàng/Đối tác)</label>
          </div>
          <div className="flex-between" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu thay đổi</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
