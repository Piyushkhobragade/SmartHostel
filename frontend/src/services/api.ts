import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
    getAll: () => api.get('/residents'),
    create: (data: any) => api.post('/residents', data),
    update: (id: string, data: any) => api.put(`/residents/${id}`, data),
    delete: (id: string) => api.delete(`/residents/${id}`),
};

// Rooms API
export const roomsAPI = {
    getAll: () => api.get('/rooms'),
    create: (data: any) => api.post('/rooms', data),
    update: (id: string, data: any) => api.put(`/rooms/${id}`, data),
    delete: (id: string) => api.delete(`/rooms/${id}`),
};

// Attendance API
export const attendanceAPI = {
    getAll: (params?: any) => api.get('/attendance', { params }),
    mark: (data: any) => api.post('/attendance', data),
};

// Summary API
export const summaryAPI = {
    getSummary: () => api.get('/summary'),
};

// Visitors API
export const visitorsAPI = {
    getAll: (params?: any) => api.get('/visitors', { params }),
    create: (data: any) => api.post('/visitors', data),
    checkout: (id: string) => api.post(`/visitors/${id}/checkout`),
};

// Fees API
export const feesAPI = {
    getInvoices: (params?: any) => api.get('/fees/invoices', { params }),
    createInvoice: (data: any) => api.post('/fees/invoices', data),
    createPayment: (data: any) => api.post('/fees/payments', data),
};

// Analytics API
export const analyticsAPI = {
    getOccupancy: () => api.get('/analytics/occupancy'),
    getFees: () => api.get('/analytics/fees'),
    getForecast: () => api.get('/analytics/forecast'),
};

// Assets API
export const assetsAPI = {
    getAll: (params?: any) => api.get('/assets', { params }),
    create: (data: any) => api.post('/assets', data),
    update: (id: string, data: any) => api.put(`/assets/${id}`, data),
    delete: (id: string) => api.delete(`/assets/${id}`),
};

// Maintenance API
export const maintenanceAPI = {
    getAll: (params?: any) => api.get('/maintenance', { params }),
    create: (data: any) => api.post('/maintenance', data),
    updateStatus: (id: string, status: string) => api.put(`/maintenance/${id}`, { status }),
};

// Mess Subscriptions API
export const messAPI = {
    getAll: (params?: any) => api.get('/mess/subscriptions', { params }),
    getById: (id: string) => api.get(`/mess/subscriptions/${id}`),
    create: (data: any) => api.post('/mess/subscriptions', data),
    update: (id: string, data: any) => api.put(`/mess/subscriptions/${id}`, data),
    deactivate: (id: string) => api.patch(`/mess/subscriptions/${id}/deactivate`),
};

export default api;
