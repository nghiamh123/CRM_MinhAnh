import React, { useState, useEffect } from 'react';
import { Users, Camera, ClipboardCheck, AlertCircle } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { customerService, deviceService, rentalService } from '../services/api';
import '../styles/Forms.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDevices: 0,
    rentingDevices: 0,
    lateRentals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customers, devices, rentals] = await Promise.all([
          customerService.getAll(),
          deviceService.getAll(),
          rentalService.getAll()
        ]);

        setStats({
          totalCustomers: customers.data.length,
          totalDevices: devices.data.reduce((sum, d) => sum + (d.totalQuantity || 0), 0),
          rentingDevices: devices.data.reduce((sum, d) => {
            const total = d.totalQuantity || 0;
            const available = d.availableQuantity !== undefined ? d.availableQuantity : total;
            return sum + (total - available);
          }, 0),
          lateRentals: rentals.data.filter(r => r.status === 'late').length
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="container">Đang tải dashboard...</div>;

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>Tổng quan hệ thống</h1>
      
      <div className="dashboard-grid">
        <StatsCard 
          title="Tổng khách hàng" 
          value={stats.totalCustomers} 
          icon={Users} 
          color="#3b82f6" 
        />
        <StatsCard 
          title="Tổng thiết bị" 
          value={stats.totalDevices} 
          icon={Camera} 
          color="#10b981" 
        />
        <StatsCard 
          title="Thiết bị đang thuê" 
          value={stats.rentingDevices} 
          icon={ClipboardCheck} 
          color="#f59e0b" 
        />
        <StatsCard 
          title="Đơn trễ hạn" 
          value={stats.lateRentals} 
          icon={AlertCircle} 
          color="#ef4444" 
        />
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Chào mừng trở lại</h2>
        <p style={{ color: 'var(--text-light)', lineHeight: '1.5' }}>
          Hệ thống CRM quản lý thiết bị ảnh của bạn đang hoạt động ổn định. 
          Sử dụng các thanh điều hướng phía trên để quản lý khách hàng, thiết bị và đơn thuê.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
