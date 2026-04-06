import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerService, deviceService, rentalService } from '../services/api';

const DataContext = createContext();

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, dRes, rRes] = await Promise.all([
        customerService.getAll(),
        deviceService.getAll(),
        rentalService.getAll()
      ]);
      setCustomers(cRes.data);
      setDevices(dRes.data);
      setRentals(rRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching global data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = {
    customers,
    devices,
    rentals,
    loading,
    error,
    refreshData,
    setCustomers,
    setDevices,
    setRentals
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
