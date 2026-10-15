import api from "./api";

export const login = (credentials) => {
  return api.post("/auth/login", credentials);
};

export const logout = (token) => api.post('/auth/logout', undefined, {
  headers: { Authorization: `Bearer ${token}` },
});
