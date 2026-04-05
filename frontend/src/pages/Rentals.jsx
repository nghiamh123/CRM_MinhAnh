import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { rentalService, customerService, deviceService } from '../services/api';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { formatVND } from '../utils/format';

const Rentals = () => {
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [deviceFilterType, setDeviceFilterType] = useState('all');
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', identityCard: '', email: '', notes: '' });
  const [formData, setFormData] = useState({ 
    customerId: '', 
    devices: [], 
    rentalDate: new Date().toISOString().split('T')[0],
    plannedReturnDate: '',
    status: 'renting'
  });

  const fetchRentals = async () => {
    const res = await rentalService.getAll();
    setRentals(res.data);
  };

  const fetchSupportData = async () => {
    const [cRes, dRes] = await Promise.all([
      customerService.getAll(),
      deviceService.getAll()
    ]);
    setCustomers(cRes.data);
    setDevices(dRes.data);
  };

  useEffect(() => {
    fetchRentals();
    fetchSupportData();
  }, []);

  const handleOpenModal = (rental = null) => {
    setEditingRental(rental);
    if (rental) {
      const cId = rental.customerId?.id || rental.customerId?._id || rental.customerId;
      const cust = customers.find(c => c.id === cId || c._id === cId);
      
      setFormData({
        customerId: cId,
        devices: rental.devices ? JSON.parse(JSON.stringify(rental.devices)) : [],
        rentalDate: rental.rentalDate ? new Date(rental.rentalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        plannedReturnDate: rental.plannedReturnDate ? new Date(rental.plannedReturnDate).toISOString().split('T')[0] : '',
        status: rental.status
      });

      if (cust) {
        setCustomerFormData({
          name: cust.name || '',
          phone: cust.phone || '',
          identityCard: cust.identityCard || '',
          email: cust.email || '',
          notes: cust.notes || ''
        });
      }
    } else {
      setFormData({ 
        customerId: '', 
        devices: [], 
        rentalDate: new Date().toISOString().split('T')[0],
        plannedReturnDate: '',
        status: 'renting'
      });
      setCustomerFormData({ name: '', phone: '', identityCard: '', email: '', notes: '' });
    }
    setDeviceFilterType('all');
    setDeviceSearchTerm('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalCustomerId = formData.customerId;

    // Nếu người dùng điền tên khách mới và không chọn khách cũ
    if (customerFormData.name && !finalCustomerId) {
      try {
        const cRes = await customerService.create(customerFormData);
        finalCustomerId = cRes.data.id;
      } catch (err) {
        alert("Lỗi khi tạo khách hàng mới: " + err.message);
        return;
      }
    }

    if (!finalCustomerId) {
      alert("Vui lòng chọn khách hàng có sẵn hoặc nhập tên khách mới!");
      return;
    }

    if (formData.devices.length === 0) {
      alert("Vui lòng chọn ít nhất 1 thiết bị cho đơn thuê!");
      return;
    }

    const payload = { 
      ...formData, 
      customerId: finalCustomerId,
      devices: formData.devices.map(d => ({
        device: d.device.id || d.device._id || d.device,
        quantity: d.quantity,
        pricePerDay: d.pricePerDay
      }))
    };

    // Cập nhật thông tin khách hàng nếu có thay đổi (nếu là khách cũ)
    if (formData.customerId) {
        await customerService.update(formData.customerId, customerFormData);
    }

    if (editingRental) {
      await rentalService.update(editingRental.id, payload);
    } else {
      await rentalService.create(payload);
    }
    
    setIsModalOpen(false);
    fetchRentals();
    fetchSupportData(); 
  };

  const handleReturn = async (rental) => {
    if (window.confirm('Xác nhận trả thiết bị?')) {
      await rentalService.update(rental.id, { status: 'returned' });
      fetchRentals();
      fetchSupportData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xoá đơn thuê này?')) {
      await rentalService.remove(id);
      fetchRentals();
      fetchSupportData();
    }
  };

  const getCustomerName = (cust) => {
    if (cust && cust.name) return cust.name;
    const found = customers.find(c => c.id === cust);
    return found ? found.name : 'Khách lạ';
  };
  const getDeviceName = (dev) => {
    if (dev && dev.name) return dev.name;
    const found = devices.find(d => d.id === dev);
    return found ? found.name : 'Thiết bị lạ';
  };

  const handleUpdateQty = (idx, delta) => {
    const newDevices = [...formData.devices];
    newDevices[idx].quantity += delta;
    if (newDevices[idx].quantity < 1) newDevices[idx].quantity = 1;
    
    // Optional: Validate against stock
    const dObj = newDevices[idx].device;
    const stock = dObj.availableQuantity || 0;
    if (!editingRental && newDevices[idx].quantity > stock) {
      alert(`Chỉ còn ${stock} máy trong kho!`);
      newDevices[idx].quantity = stock;
    }
    
    setFormData({...formData, devices: newDevices});
  };

  const handleRemoveDevice = (idx) => {
    const newDevices = [...formData.devices];
    newDevices.splice(idx, 1);
    setFormData({...formData, devices: newDevices});
  };

  const calculateTotal = () => {
    if (!formData.rentalDate || !formData.plannedReturnDate || formData.devices.length === 0) return 0;
    const d1 = new Date(formData.rentalDate);
    const d2 = new Date(formData.plannedReturnDate);
    let days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    if (days < 1) days = 1;
    
    return formData.devices.reduce((acc, item) => {
      return acc + (item.pricePerDay * item.quantity * days);
    }, 0);
  };

  const getStatusClass = (status) => `status-badge status-${status}`;

  const availableDevices = devices.filter(d => {
    const isAvailable = d.status === 'available' || (editingRental && d.id === editingRental.deviceId);
    const matchesFilter = deviceFilterType === 'all' || d.type === deviceFilterType;
    const matchesSearch = d.name.toLowerCase().includes(deviceSearchTerm.toLowerCase());
    return isAvailable && matchesFilter && matchesSearch;
  });

  return (
    <div className="container">
      <div className="flex-between">
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Quản lý đơn thuê</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>Tạo đơn thuê</span>
        </button>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Khách hàng</th>
                <th>Thiết bị</th>
                <th>Ngày thuê</th>
                <th>Hẹn trả</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map(rental => (
                <tr key={rental.id}>
                  <td>#{rental.id}</td>
                  <td style={{ fontWeight: 600 }}>{getCustomerName(rental.customerId)}</td>
                  <td>
                    {rental.devices && rental.devices.map((dItem, i) => {
                      const name = getDeviceName(dItem.device);
                      return (
                        <div key={i} style={{ fontSize: '0.85rem', marginBottom: '2px' }}>
                          • {name} (x{dItem.quantity})
                        </div>
                      );
                    })}
                  </td>
                  <td>{rental.rentalDate ? new Date(rental.rentalDate).toLocaleDateString('vi-VN') : ''}</td>
                  <td>{rental.plannedReturnDate ? new Date(rental.plannedReturnDate).toLocaleDateString('vi-VN') : ''}</td>
                  <td>
                    <span className={getStatusClass(rental.status)}>
                      {rental.status === 'renting' ? 'Đang thuê' : 
                       rental.status === 'returned' ? 'Đã trả' : 'Trễ hạn'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {rental.status !== 'returned' && (
                        <button onClick={() => handleReturn(rental)} style={{ color: 'var(--success)' }} title="Trả máy"><CheckCircle size={18} /></button>
                      )}
                      <button onClick={() => handleOpenModal(rental)} style={{ color: 'var(--primary)' }}><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(rental.id)} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
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
        title={editingRental ? "Cập nhật đơn thuê" : "Tạo đơn thuê mới"}
      >
        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>1. Khách hàng (Chọn có sẵn)</label>
            <SearchableSelect 
              options={customers}
              value={formData.customerId}
              onChange={val => {
                setFormData({...formData, customerId: val});
                if (val) {
                  const cust = customers.find(c => c.id === val || c._id === val);
                  if (cust) {
                    setCustomerFormData({
                      name: cust.name || '',
                      phone: cust.phone || '',
                      identityCard: cust.identityCard || '',
                      email: cust.email || '',
                      notes: cust.notes || ''
                    });
                  }
                } else {
                  setCustomerFormData({ name: '', phone: '', identityCard: '', email: '', notes: '' });
                }
              }}
              placeholder="Chọn khách hàng..."
              searchPlaceholder="Tìm tên hoặc số điện thoại..."
            />
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', marginTop: '1rem' }}>
            <label style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
              {formData.customerId ? 'THÔNG TIN CHI TIẾT KHÁCH HÀNG' : 'HOẶC TẠO KHÁCH HÀNG MỚI'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input 
                placeholder="Tên khách hàng *"
                value={customerFormData.name}
                onChange={e => {
                  setCustomerFormData({...customerFormData, name: e.target.value});
                  if (e.target.value) setFormData({...formData, customerId: ''});
                }}
              />
              <input 
                placeholder="Số điện thoại"
                value={customerFormData.phone}
                onChange={e => {
                  setCustomerFormData({...customerFormData, phone: e.target.value});
                  if (e.target.value) setFormData({...formData, customerId: ''});
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <input 
                placeholder="Số căn cước"
                value={customerFormData.identityCard}
                onChange={e => {
                  setCustomerFormData({...customerFormData, identityCard: e.target.value});
                  if (e.target.value) setFormData({...formData, customerId: ''});
                }}
              />
              <input 
                placeholder="Ghi chú thêm..."
                value={customerFormData.notes}
                onChange={e => {
                  setCustomerFormData({...customerFormData, notes: e.target.value});
                  if (e.target.value) setFormData({...formData, customerId: ''});
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <label style={{ display:' block', marginBottom: '8px', fontWeight: '600' }}>2. Chọn thiết bị (Giỏ hàng)</label>
            <SearchableSelect 
              options={availableDevices}
              value={''} // always reset
              onChange={val => {
                if(!val) return;
                const d = availableDevices.find(dev => dev.id === val);
                if(d) {
                  // Add to array
                  const existingIdx = formData.devices.findIndex(item => {
                    const id1 = item.device?.id || item.device?._id || item.device;
                    return id1 === val;
                  });
                  if (existingIdx >= 0) {
                    handleUpdateQty(existingIdx, 1);
                  } else {
                    if (!editingRental && d.availableQuantity < 1) {
                      alert('Thiết bị này đã hết hàng trong kho!');
                      return;
                    }
                    setFormData({...formData, devices: [...formData.devices, { device: d, quantity: 1, pricePerDay: d.pricePerDay }]});
                  }
                }
              }}
              placeholder="Thêm máy vào đơn thuê..."
              searchPlaceholder="Tìm tên thiết bị..."
              categories={[
                { value: 'all', label: 'Tất cả' },
                { value: 'camera', label: 'Camera' },
                { value: 'lens', label: 'Lens' },
                { value: 'tripod', label: 'Tripod' },
                { value: 'accessory', label: 'Phụ kiện' }
              ]}
              selectedCategory={deviceFilterType}
              onCategoryChange={setDeviceFilterType}
              renderOption={(opt) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px'}}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{opt.type}</span>
                    <span style={{ fontWeight: 500 }}>{opt.name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>
                      {formatVND(opt.pricePerDay)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: opt.availableQuantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      Kho: {opt.availableQuantity || 0}
                    </span>
                  </div>
                </div>
              )}
            />

            {/* Cart UI */}
            {formData.devices.length > 0 && (
              <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {formData.devices.map((item, idx) => {
                   const dObj = item.device;
                   return (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: 'white' }}>
                       <div>
                         <div style={{ fontWeight: 600 }}>{dObj.name || dObj}</div>
                         <div style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{formatVND(item.pricePerDay)}/ngày</div>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                           <button type="button" onClick={() => handleUpdateQty(idx, -1)} style={{ padding: '4px 8px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}>-</button>
                           <span style={{ padding: '0 12px', fontSize: '0.9rem', fontWeight: 600, minWidth: '32px', textAlign: 'center' }}>{item.quantity}</span>
                           <button type="button" onClick={() => handleUpdateQty(idx, 1)} style={{ padding: '4px 8px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer' }}>+</button>
                         </div>
                         <button type="button" onClick={() => handleRemoveDevice(idx)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                       </div>
                     </div>
                   );
                })}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label>Ngày thuê</label>
              <input 
                type="date"
                required
                value={formData.rentalDate}
                onChange={e => setFormData({...formData, rentalDate: e.target.value})}
              />
            </div>
            <div>
              <label>Ngày trả dự kiến</label>
              <input 
                type="date"
                required
                value={formData.plannedReturnDate}
                onChange={e => setFormData({...formData, plannedReturnDate: e.target.value})}
              />
            </div>
          </div>
          <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>Tổng tiền dự kiến:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
              {formatVND(calculateTotal())}
            </span>
          </div>
          <div className="flex-between" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu đơn thuê</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rentals;
