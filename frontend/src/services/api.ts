 
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 errors (token expired/invalid)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token invalid or expired, clear storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);


// Residents API
export const residentsAPI = {
    getAll: async () => {
        const res = await api.get('/residents');
        // Unwrap paginated response format for backward compatibility
        if (res.data && res.data.data && res.data.pagination) {
            return { ...res, data: res.data.data, pagination: res.data.pagination };
        }
        return res;
    },
    create: (data: unknown) => api.post('/residents', data),
    update: (id: string, data: unknown) => api.put(`/residents/${id}`, data),
    delete: (id: string) => api.delete(`/residents/${id}`),
};

// Dashboard API
export const dashboardAPI = {
    getSummary: () => api.get('/dashboard'),
    getIntelligence: () => api.get('/dashboard/intelligence'),
};

// Rooms API
export const roomsAPI = {
    getAll: () => api.get('/rooms'),
    create: (data: unknown) => api.post('/rooms', data),
    update: (id: string, data: unknown) => api.put(`/rooms/${id}`, data),
    delete: (id: string) => api.delete(`/rooms/${id}`),
};

// Attendance API
export const attendanceAPI = {
    getAll: (params?: Record<string, unknown>) => api.get('/attendance', { params }),
    mark: (data: unknown) => api.post('/attendance', data),
};

// Summary API
export const summaryAPI = {
    getSummary: () => api.get('/summary'),
};

// Visitors API
export const visitorsAPI = {
    getAll: (params?: Record<string, unknown>) => api.get('/visitors', { params }),
    create: (data: unknown) => api.post('/visitors', data),
    checkout: (id: string) => api.post(`/visitors/${id}/checkout`),
};

// Fees API
export const feesAPI = {
    getInvoices: (params?: Record<string, unknown>) => api.get('/fees/invoices', { params }),
    createInvoice: (data: unknown) => api.post('/fees/invoices', data),
    createPayment: (data: unknown) => api.post('/fees/payments', data),
};

// Analytics API
export const analyticsAPI = {
    getOccupancy: () => api.get('/analytics/occupancy'),
    getFees: () => api.get('/analytics/fees'),
    getForecast: () => api.get('/analytics/forecast'),
};

// Assets API
export const assetsAPI = {
    getAll: (params?: Record<string, unknown>) => api.get('/assets', { params }),
    create: (data: unknown) => api.post('/assets', data),
    update: (id: string, data: unknown) => api.put(`/assets/${id}`, data),
    delete: (id: string) => api.delete(`/assets/${id}`),
};

// Maintenance API
export const maintenanceAPI = {
    getAll: (params?: Record<string, unknown>) => api.get('/maintenance', { params }),
    create: (data: unknown) => api.post('/maintenance', data),
    updateStatus: (id: string, status: string) => api.put(`/maintenance/${id}`, { status }),
};

// Mess Subscriptions API
export const messAPI = {
    getAll: (params?: Record<string, unknown>) => api.get('/mess/subscriptions', { params }),
    getById: (id: string) => api.get(`/mess/subscriptions/${id}`),
    create: (data: unknown) => api.post('/mess/subscriptions', data),
    update: (id: string, data: unknown) => api.put(`/mess/subscriptions/${id}`, data),
    deactivate: (id: string) => api.patch(`/mess/subscriptions/${id}/deactivate`),
};

// Student Portal API (STUDENT role only — auto-scoped to logged-in student)
export const studentAPI = {
    getDashboard: () => api.get('/student/dashboard'),
    getRoom: () => api.get('/student/room'),
    getAttendance: (params?: { month?: number; year?: number }) => api.get('/student/attendance', { params }),
    getFees: () => api.get('/student/fees'),
    getVisitors: () => api.get('/student/visitors'),
    createVisitor: (data: unknown) => api.post('/student/visitors', data),
    createMaintenance: (data: unknown) => api.post('/student/maintenance', data),
    /** Student AI — answers questions grounded in own data + knowledge corpus. Session-only. */
    ask: (question: string) => api.post('/student/ask', { question }),
};

// Knowledge API
export const knowledgeAPI = {
    getAll: () => api.get('/knowledge'),
    create: (data: unknown) => api.post('/knowledge', data),
    update: (id: string, data: unknown) => api.put(`/knowledge/${id}`, data),
    delete: (id: string) => api.delete(`/knowledge/${id}`),
    ask: (question: string) => api.post('/knowledge/ask', { question }),
};

// Copilot API
export const copilotAPI = {
    chat: (message: string, conversationId?: string) => api.post('/copilot/chat', { message, conversationId }),
    getConversations: () => api.get('/copilot/conversations'),
    getConversation: (id: string) => api.get(`/copilot/conversations/${id}`),
    getBriefing: () => api.get('/copilot/briefing'),
};

// Timeline & Alerts API
export const timelineAPI = {
    getEvents: (params?: Record<string, unknown>) => api.get('/timeline', { params }),
    getAlerts: (params?: Record<string, unknown>) => api.get('/alerts', { params }),
    acknowledgeAlert: (id: string) => api.patch(`/alerts/${id}`, { status: 'ACKNOWLEDGED' }),
    resolveAlert: (id: string) => api.patch(`/alerts/${id}`, { status: 'RESOLVED' }),
    dismissAlert: (id: string) => api.patch(`/alerts/${id}`, { status: 'DISMISSED' }),
};

// Digital Twin API
export const twinAPI = {
    getOverview: () => api.get('/twin/overview'),
    getRoomProfile: (id: string) => api.get(`/twin/room/${id}`),
    getHeatmap: (type: 'occupancy' | 'maintenance' | 'cost') => api.get(`/twin/heatmap/${type}`),
};

// Auth API
export const authAPI = {
    forgotPassword: (data: { username: string; resetCode: string; newPassword: string }) =>
        api.post('/auth/forgot-password', data),
};

export default api;
