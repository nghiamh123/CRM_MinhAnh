import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, ChevronLeft, ChevronRight, Minus, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { rentalService, customerService, deviceService } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import { formatVND } from '../utils/format';
import '../styles/Breadcrumbs.css';

const Rentals = () => {
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [editingRental, setEditingRental] = useState(null);
  const [deviceFilterType, setDeviceFilterType] = useState('all');
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', identityCard: '', email: '', notes: '', isRental: false });
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

  const handleOpenForm = (rental = null) => {
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
          notes: cust.notes || '',
          isRental: cust.isRental || false
        });
      }
      setView('edit');
    } else {
      setFormData({ 
        customerId: '', 
        devices: [], 
        rentalDate: new Date().toISOString().split('T')[0],
        plannedReturnDate: '',
        status: 'renting'
      });
      setCustomerFormData({ name: '', phone: '', identityCard: '', email: '', notes: '', isRental: false });
      setView('add');
    }
    setDeviceFilterType('all');
    setDeviceSearchTerm('');
  };

  const handleBack = () => {
    setView('list');
    setEditingRental(null);
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

  const sortedRentals = useMemo(() => {
    let sortableItems = [...rentals];
    if (sortConfig.key !== null && sortConfig.direction !== 'default') {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'rentalDate') {
          valA = new Date(a.rentalDate || 0).getTime();
          valB = new Date(b.rentalDate || 0).getTime();
        } else if (sortConfig.key === 'plannedReturnDate') {
          valA = new Date(a.plannedReturnDate || 0).getTime();
          valB = new Date(b.plannedReturnDate || 0).getTime();
        } else if (sortConfig.key === 'customerName') {
          const getName = c => (c && c.name) ? c.name : ((customers.find(x => x.id === c || x._id === c))?.name || 'Khách lạ');
          valA = getName(a.customerId).toLowerCase();
          valB = getName(b.customerId).toLowerCase();
        } else if (sortConfig.key === 'status') {
          valA = a.status || '';
          valB = b.status || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [rentals, sortConfig, customers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalCustomerId = formData.customerId;

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

    for (const item of formData.devices) {
      const unitsInDB = (item.device?.units || []).length;
      if (unitsInDB > 0 && (!item.selectedSerials || item.selectedSerials.length !== item.quantity)) {
        // Nếu thiết bị chưa cập nhật đủ S/N cho số lượng kho, bỏ qua check ngặt nghèo hoặc yêu cầu update
        const availableUnits = (item.device?.units || []).filter(u => u.status === 'available').length;
        if (availableUnits >= item.quantity) {
          alert(`Bạn chưa chọn đủ số seri cho thiết bị: ${item.device?.name || 'Không rõ'}`);
          return;
        }
      }
    }

    const payload = { 
      ...formData, 
      customerId: finalCustomerId,
      devices: formData.devices.map(d => {
        let serials = d.selectedSerials || [];
        // Tự cấp phát các serial ảo đối với các unit legacy chưa có thông tin trong db
        if (serials.length < d.quantity) {
           const lacking = d.quantity - serials.length;
           for(let i=0; i<lacking; i++) {
              serials.push(`LEGACY-SN-${Date.now()}-${i}`);
           }
        }
        return {
          device: d.device.id || d.device._id || d.device,
          quantity: d.quantity,
          pricePerDay: d.pricePerDay,
          selectedSerials: serials
        };
      })
    };

    if (formData.customerId) {
        await customerService.update(formData.customerId, customerFormData);
    }

    if (editingRental) {
      await rentalService.update(editingRental.id, payload);
    } else {
      await rentalService.create(payload);
    }
    
    handleBack();
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
    let newQ = newDevices[idx].quantity + delta;
    if (newQ < 1) newQ = 1;
    
    const dObj = newDevices[idx].device;
    const stock = dObj.availableQuantity || 0;
    if (!editingRental && newQ > stock) {
      alert(`Chỉ còn ${stock} máy trong kho!`);
      newQ = stock;
    }
    
    newDevices[idx].quantity = newQ;
    
    let currentSerials = newDevices[idx].selectedSerials || [];
    if (currentSerials.length > newQ) {
       currentSerials = currentSerials.slice(0, newQ);
    } else if (currentSerials.length < newQ) {
       const availableUnits = (dObj.units || [])
         .filter(u => u.status === 'available' && !currentSerials.includes(u.serialNumber))
         .map(u => u.serialNumber);
       const needed = newQ - currentSerials.length;
       currentSerials = [...currentSerials, ...availableUnits.slice(0, needed)];
    }
    newDevices[idx].selectedSerials = currentSerials;
    
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

  if (view !== 'list') {
    return (
      <div className="container">
        <div className="breadcrumb-container">
          <span className="breadcrumb-item" onClick={handleBack}>Đơn thuê</span>
          <ChevronRight className="breadcrumb-separator" size={16} />
          <span className="breadcrumb-item active">{view === 'add' ? 'Tạo đơn mới' : 'Cập nhật đơn'}</span>
        </div>

        <div className="form-section-card">
          <div className="back-button" onClick={handleBack}>
            <ChevronLeft size={18} />
            Quay lại danh sách
          </div>
          
          <h2 style={{ marginBottom: '1.5rem' }}>{view === 'add' ? 'Tạo đơn thuê mới' : `Cập nhật đơn: #${editingRental.id}`}</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
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
                            notes: cust.notes || '',
                            isRental: cust.isRental || false
                          });
                        }
                      } else {
                        setCustomerFormData({ name: '', phone: '', identityCard: '', email: '', notes: '', isRental: false });
                      }
                    }}
                    placeholder="Chọn khách hàng..."
                    searchPlaceholder="Tìm tên hoặc số điện thoại..."
                  />
                </div>

                <div style={{ padding: '1.25rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <label style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {formData.customerId ? 'Chi tiết khách hàng' : 'Thông tin khách hàng mới'}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                      onChange={e => setCustomerFormData({...customerFormData, phone: e.target.value})}
                    />
                    <input 
                      placeholder="Số căn cước"
                      value={customerFormData.identityCard}
                      onChange={e => setCustomerFormData({...customerFormData, identityCard: e.target.value})}
                    />
                    <input 
                      placeholder="Ghi chú thêm..."
                      value={customerFormData.notes}
                      onChange={e => setCustomerFormData({...customerFormData, notes: e.target.value})}
                    />
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <input 
                      type="checkbox"
                      id="isRental"
                      checked={customerFormData.isRental}
                      onChange={e => setCustomerFormData({...customerFormData, isRental: e.target.checked})}
                      style={{ width: 'auto', cursor: 'pointer', scale: '1.2' }}
                    />
                    <label htmlFor="isRental" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>Đánh dấu là Rental (Cửa hàng/Đối tác)</label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>2. Ngày thuê</label>
                    <input 
                      type="date" 
                      required
                      value={formData.rentalDate}
                      onChange={e => setFormData({...formData, rentalDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>3. Hẹn ngày trả</label>
                    <input 
                      type="date" 
                      required
                      value={formData.plannedReturnDate}
                      onChange={e => setFormData({...formData, plannedReturnDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem',fontWeight: 600  }}>4. Giỏ hàng thiết bị</label>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                  <select 
                    style={{ width: '130px' }}
                    value={deviceFilterType}
                    onChange={e => setDeviceFilterType(e.target.value)}
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="camera">Camera</option>
                    <option value="lens">Lens</option>
                    <option value="tripod">Tripod</option>
                  </select>
                  <input 
                    placeholder="Tìm thiết bị nhanh..."
                    style={{ flex: 1 }}
                    value={deviceSearchTerm}
                    onChange={e => setDeviceSearchTerm(e.target.value)}
                  />
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', marginBottom: '1.5rem', background: '#fff' }}>
                  {availableDevices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>Không tìm thấy thiết bị phù hợp</div>
                  ) : (
                    availableDevices.map(device => (
                      <div 
                        key={device.id} 
                        className="flex-between"
                        style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => {
                          if (formData.devices.find(d => d.device.id === device.id)) return;
                          
                          // Tự động gán Serial Number rảnh đầu tiên
                          const availableUnits = (device.units || []).filter(u => u.status === 'available').map(u => u.serialNumber);
                          const autoAssigned = availableUnits.slice(0, 1);
                          
                          setFormData({
                            ...formData,
                            devices: [...formData.devices, { device: device, quantity: 1, pricePerDay: device.pricePerDay, selectedSerials: autoAssigned }]
                          });
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{device.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Loại: {device.type} | Kho: {device.availableQuantity}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatVND(device.pricePerDay)}</span>
                          <Plus size={18} color="var(--primary)" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ minHeight: '180px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '10px', display: 'block', textTransform: 'uppercase' }}>Danh sách đã chọn</label>
                  {formData.devices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                      Giỏ hàng đang trống. Chọn thiết bị bên trên để thêm vào đơn.
                    </div>
                  ) : (
                    formData.devices.map((item, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.device.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Đơn giá: {formatVND(item.pricePerDay)}/ngày</div>
                          
                          {/* Phân bổ Số Seri */}
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
                              Chọn SN ({item.selectedSerials?.length || 0}/{item.quantity}):
                            </div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {(item.device.units || []).filter(u => u.status === 'available' || (editingRental && item.selectedSerials?.includes(u.serialNumber))).map(u => {
                                const isSelected = item.selectedSerials?.includes(u.serialNumber);
                                return (
                                  <button
                                    key={u.serialNumber}
                                    type="button"
                                    style={{
                                      padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer',
                                      border: isSelected ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                                      background: isSelected ? '#eff6ff' : 'white',
                                      color: isSelected ? 'var(--primary)' : '#475569',
                                      borderRadius: '4px'
                                    }}
                                    onClick={() => {
                                      const newDevs = [...formData.devices];
                                      let currentSerials = newDevs[idx].selectedSerials || [];
                                      if (isSelected) {
                                        currentSerials = currentSerials.filter(sn => sn !== u.serialNumber);
                                      } else {
                                        if (currentSerials.length < newDevs[idx].quantity) {
                                          currentSerials.push(u.serialNumber);
                                        } else {
                                          alert(`Chỉ được chọn tối đa ${newDevs[idx].quantity} S/N! Tăng số lượng nếu cần.`);
                                        }
                                      }
                                      newDevs[idx].selectedSerials = currentSerials;
                                      setFormData({...formData, devices: newDevs});
                                    }}
                                  >
                                    {u.serialNumber}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                            <button type="button" onClick={() => handleUpdateQty(idx, -1)} style={{ padding: '4px 10px', border: 'none', background: 'none' }}><Minus size={16} /></button>
                            <span style={{ padding: '0 10px', fontWeight: 700, minWidth: '35px', textAlign: 'center', fontSize: '1rem' }}>{item.quantity}</span>
                            <button type="button" onClick={() => handleUpdateQty(idx, 1)} style={{ padding: '4px 10px', border: 'none', background: 'none' }}><Plus size={16} /></button>
                          </div>
                          <button type="button" onClick={() => handleRemoveDevice(idx)} style={{ color: 'var(--danger)', background: 'none', border: 'none', padding: '5px' }}><X size={20} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0' }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>TỔNG TIỀN DỰ KIẾN:</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>
                      {formatVND(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-between" style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <button type="button" className="btn-outline" onClick={handleBack} style={{ padding: '0.8rem 2.5rem', fontWeight: 600 }}>Hủy bỏ</button>
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem 4rem', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>Xác nhận & Lưu đơn hàng</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between">
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Quản lý đơn thuê</h1>
        <button className="btn-primary" onClick={() => handleOpenForm()}>
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
                <th onClick={() => handleSort('customerName')} style={{ cursor: 'pointer', userSelect: 'none' }}>Khách hàng {getSortIcon('customerName')}</th>
                <th>Thiết bị</th>
                <th onClick={() => handleSort('rentalDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>Ngày thuê {getSortIcon('rentalDate')}</th>
                <th onClick={() => handleSort('plannedReturnDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>Hẹn trả {getSortIcon('plannedReturnDate')}</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>Trạng thái {getSortIcon('status')}</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedRentals.map(rental => (
                <tr key={rental.id}>
                  <td>#{rental.id}</td>
                  <td style={{ fontWeight: 600 }}>{getCustomerName(rental.customerId)}</td>
                  <td>
                    {rental.devices && rental.devices.map((dItem, i) => {
                      const name = getDeviceName(dItem.device);
                      return (
                        <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>• {name}</span> (x{dItem.quantity})
                          {dItem.selectedSerials && dItem.selectedSerials.length > 0 && (
                            <div style={{ paddingLeft: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                              SN: {dItem.selectedSerials.join(', ')}
                            </div>
                          )}
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
                      <button onClick={() => handleOpenForm(rental)} style={{ color: 'var(--primary)' }}><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(rental.id)} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
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

export default Rentals;
