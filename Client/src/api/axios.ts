// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Optional: Add request interceptor (e.g., add auth token)
api.interceptors.request.use(
  (config) => {
    // Example: Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add response interceptor for error handling globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here (like 401 logout)
    if (error.response?.status === 401) {
      // e.g. logout user, redirect, show message
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const GetAllCompanies = async () => {
  try {
    const response = await api.get("/api/company");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const GetBranchesByUser = async () => {
  try {
    const response = await api.get(
      "/api/branch/user/157b8fdf-ecd9-4b87-b87c-f560e2e96757"
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export default api;
