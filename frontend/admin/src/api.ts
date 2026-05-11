import axios from 'axios';

export const BASE_URL = 'http://localhost:8000';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getToken() { return localStorage.getItem('admin_token'); }
export function setToken(t: string) { localStorage.setItem('admin_token', t); }
export function clearToken() { localStorage.removeItem('admin_token'); }
export function getAdminName() { return localStorage.getItem('admin_name') ?? 'Admin'; }
export function setAdminName(n: string) { localStorage.setItem('admin_name', n); }
