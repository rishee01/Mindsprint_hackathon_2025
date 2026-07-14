/**
 * API Client
 * Axios instance configured for backend API calls
 */

import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===================
// Auth API
// ===================
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  // Admin login endpoint
  adminLogin: (data: { email: string; password: string }) =>
    api.post('/auth/admin/login', data),
  
  firebaseAuth: (data: { firebaseUid: string; email: string; name: string; avatar?: string }) =>
    api.post('/auth/firebase', data),
  
  getMe: () =>
    api.get('/auth/me'),
  
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
    api.patch('/auth/me', data),
  
  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  
  // Admin user management
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get('/auth/admin/users', { params }),
  
  createAdmin: (data: { name: string; email: string; password: string; role: 'admin' | 'authority'; department?: string }) =>
    api.post('/auth/admin/create', data),
  
  updateUserRole: (userId: string, data: { role: string; department?: string }) =>
    api.patch(`/auth/admin/users/${userId}/role`, data),
};

// ===================
// Issues API
// ===================
export interface IssueFilters {
  status?: string;
  category?: string;
  severity?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface CreateIssueData {
  imageUrl: string;
  latitude: number;
  longitude: number;
  description: string;
  category?: string;
  address?: string;
  aiConfidence?: number;
}

export const issuesAPI = {
  getAll: (filters?: IssueFilters) =>
    api.get('/issues', { params: filters }),
  
  getMapData: (filters?: { status?: string; category?: string; severity?: string }) =>
    api.get('/issues/map', { params: filters }),
  
  getHeatmapData: () =>
    api.get('/issues/heatmap'),
  
  getById: (id: string) =>
    api.get(`/issues/${id}`),
  
  create: (data: CreateIssueData) =>
    api.post('/issues', data),
  
  createWithImage: (formData: FormData) =>
    api.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: string, data: { status?: string; assignedTo?: string; note?: string }) =>
    api.patch(`/issues/${id}`, data),
  
  verify: (id: string, isReal: boolean = true) =>
    api.post(`/issues/${id}/verify`, { isReal }),
  
  resolve: (id: string, data: { notes?: string; proofImageUrl?: string }) =>
    api.post(`/issues/${id}/resolve`, data),
  
  addComment: (id: string, text: string) =>
    api.post(`/issues/${id}/comment`, { text }),
  
  delete: (id: string) =>
    api.delete(`/issues/${id}`),
  
  getMyIssues: (filters?: { page?: number; limit?: number; status?: string }) =>
    api.get('/issues/user/my-issues', { params: filters }),
};

// ===================
// Classification API
// ===================
export const classifyAPI = {
  classify: (data: { imageUrl?: string; imageBase64?: string; description?: string }) =>
    api.post('/classify', data),
  
  getCategories: () =>
    api.get('/classify/categories'),
};

// ===================
// Statistics API
// ===================
export const statsAPI = {
  getOverview: () =>
    api.get('/stats/overview'),
  
  getTrends: (days?: number) =>
    api.get('/stats/trends', { params: { days } }),
  
  getLeaderboard: (limit?: number) =>
    api.get('/stats/leaderboard', { params: { limit } }),
  
  getDepartments: () =>
    api.get('/stats/departments'),
  
  getResolutionTime: () =>
    api.get('/stats/resolution-time'),
};

export default api;
