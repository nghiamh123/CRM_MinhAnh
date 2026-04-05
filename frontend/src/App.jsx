import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Devices from './pages/Devices';
import Rentals from './pages/Rentals';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/rentals" element={<Rentals />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
