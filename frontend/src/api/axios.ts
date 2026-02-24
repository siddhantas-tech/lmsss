import axios from "axios";
import { ensureDevToken } from "./auth";

// Use Vercel proxy in production, Vite dev proxy in development
const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT automatically
api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem("token");
  
  // If no token exists, try to generate one for development
  if (!token && import.meta.env.DEV) {
    try {
      token = await ensureDevToken();
    } catch (error) {
      console.warn('Could not generate dev token:', error);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
