import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, Users, ClipboardList, LayoutDashboard, Menu, X, Calendar } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Camera size={24} />
          <span>CamCRM</span>
        </div>
        
        <button className="nav-mobile-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
            <Users size={20} />
            <span>Khách hàng</span>
          </NavLink>
          <NavLink to="/devices" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
            <Camera size={20} />
            <span>Thiết bị</span>
          </NavLink>
          <NavLink to="/rentals" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
            <ClipboardList size={20} />
            <span>Đơn thuê</span>
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
            <Calendar size={20} />
            <span>Lịch</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
