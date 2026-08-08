import axios from 'axios';
import { Customer, Product, StockLog, Challan, Pagination } from '../types';

const API = axios.create({
  baseURL: '/api',
});

// Interceptor to attach Bearer token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) => API.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role?: string }) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
};

export const customerAPI = {
  getCustomers: (params?: { page?: number; limit?: number; search?: string; status?: string; customerType?: string }) =>
    API.get<{ customers: Customer[]; pagination: Pagination }>('/customers', { params }),
  getCustomerById: (id: string) => API.get<Customer>(`/customers/${id}`),
  createCustomer: (data: Partial<Customer>) => API.post('/customers', data),
  updateCustomer: (id: string, data: Partial<Customer>) => API.put(`/customers/${id}`, data),
  addFollowUpNote: (id: string, note: string) => API.post(`/customers/${id}/notes`, { note }),
};

export const productAPI = {
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; lowStock?: boolean }) =>
    API.get<{ products: Product[]; pagination: Pagination }>('/products', { params }),
  getProductById: (id: string) => API.get<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) => API.post('/products', data),
  updateProduct: (id: string, data: Partial<Product>) => API.put(`/products/${id}`, data),
};

export const stockAPI = {
  adjustStock: (data: { productId: string; quantityChanged: number; movementType: 'IN' | 'OUT'; reason: string }) =>
    API.post('/stock/adjust', data),
  getStockLogs: (params?: { page?: number; limit?: number; productId?: string; movementType?: string }) =>
    API.get<{ logs: StockLog[]; pagination: Pagination }>('/stock/logs', { params }),
};

export const challanAPI = {
  getChallans: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    API.get<{ challans: Challan[]; pagination: Pagination }>('/challans', { params }),
  getChallanById: (id: string) => API.get<Challan>(`/challans/${id}`),
  createChallan: (data: { customerId: string; status: 'DRAFT' | 'CONFIRMED'; items: { productId: string; quantity: number }[] }) =>
    API.post('/challans', data),
  updateChallanStatus: (id: string, status: 'CONFIRMED' | 'CANCELLED') => API.put(`/challans/${id}/status`, { status }),
  getPDFUrl: (id: string) => {
    const token = localStorage.getItem('erp_token');
    return `/api/challans/${id}/pdf${token ? `?token=${token}` : ''}`;
  },
};
