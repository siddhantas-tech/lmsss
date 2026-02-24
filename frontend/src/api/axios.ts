import axios from "axios";

// Use Vercel proxy in development, direct backend URL in production
const BASE_URL = typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
