import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    config.headers['X-Pharmacy-Id'] ??= localStorage.getItem('pharmacy_active') || '1';
    const token = localStorage.getItem("pharmacy_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const isUnauthorized = error.response?.status === 401;

    const isLoginRequest = error.config?.url?.includes("/auth/login");

    const requestToken = error.config?.headers?.Authorization;
    const currentToken = localStorage.getItem("pharmacy_token");

    if (isUnauthorized && !isLoginRequest && currentToken && requestToken === `Bearer ${currentToken}`) {
      localStorage.removeItem("pharmacy_user");
      localStorage.removeItem("pharmacy_token");

      window.dispatchEvent(new Event("pharmacy:session-expired"));
    }

    return Promise.reject(error);
  },
);

export default api;
