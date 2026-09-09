const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

async function fetchJSON(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    console.warn(`[API] ${endpoint} failed:`, error.message);
    throw error;
  }
}

export const api = {
  // Complaints - User Isolated & Role-Based
  getComplaints: (params = '') => fetchJSON(`/complaints${params ? `?${params}` : ''}`),
  getMyComplaints: (params = '') => fetchJSON(`/complaints/my${params ? `?${params}` : ''}`),
  getMyStats: () => fetchJSON('/complaints/stats/my'),
  getComplaintById: (id) => fetchJSON(`/complaints/${id}`),
  trackComplaint: (id) => fetchJSON(`/complaints/track/${id}`),
  createComplaint: (data) => fetchJSON('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  deleteComplaint: (id) => fetchJSON(`/complaints/${id}`, { method: 'DELETE' }),
  updateComplaintStatus: (id, data) => fetchJSON(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  addRemark: (id, data) => fetchJSON(`/complaints/${id}/remarks`, { method: 'POST', body: JSON.stringify(data) }),
  getOfficerComplaints: (params = '') => fetchJSON(`/complaints/officer${params ? `?${params}` : ''}`),
  getAdminComplaints: (params = '') => fetchJSON(`/complaints/admin${params ? `?${params}` : ''}`),

  // Notifications
  getNotifications: () => fetchJSON('/complaints/notifications/my'),
  markNotificationRead: (id) => fetchJSON(`/complaints/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => fetchJSON('/complaints/notifications/read-all', { method: 'PATCH' }),

  // Real OTP Verification Services (SMS & Email)
  sendOTP: (payload) => fetchJSON('/auth/send-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPhoneOTP: (payload) => fetchJSON('/auth/verify-phone-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmailOTP: (payload) => fetchJSON('/auth/verify-email-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resendOTP: (payload) => fetchJSON('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),

  // Auth & Password Reset
  getCaptcha: () => fetchJSON('/auth/captcha'),
  login: (credentials) => fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  resetPassword: (payload) => fetchJSON('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => fetchJSON('/auth/me'),

  // Analytics
  getAnalytics: () => fetchJSON('/analytics/overview'),
};

export default api;
