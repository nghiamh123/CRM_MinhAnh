import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const customerService = {
  getAll: () => api.get("/customers"),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const deviceService = {
  getAll: () => api.get("/devices"),
  create: (data) => api.post("/devices", data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  remove: (id) => api.delete(`/devices/${id}`),
};

export const rentalService = {
  getAll: () => api.get("/rentals"),
  create: (data) => api.post("/rentals", data),
  update: (id, data) => api.put(`/rentals/${id}`, data),
  remove: (id) => api.delete(`/rentals/${id}`),
};

export default api;
