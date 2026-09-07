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
  // Complaints
  getComplaints: (params = '') => fetchJSON(`/complaints${params ? `?${params}` : ''}`),
  getComplaintById: (id) => fetchJSON(`/complaints/${id}`),
  createComplaint: (data) => fetchJSON('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaintStatus: (id, data) => fetchJSON(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  addRemark: (id, data) => fetchJSON(`/complaints/${id}/remarks`, { method: 'POST', body: JSON.stringify(data) }),

  // Real OTP Verification Services (SMS & Email)
  sendOTP: (payload) => fetchJSON('/auth/send-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPhoneOTP: (payload) => fetchJSON('/auth/verify-phone-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmailOTP: (payload) => fetchJSON('/auth/verify-email-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resendOTP: (payload) => fetchJSON('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),

  // Auth & Password Reset
  login: (credentials) => fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  resetPassword: (payload) => fetchJSON('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => fetchJSON('/auth/me'),

  // Analytics
  getAnalytics: () => fetchJSON('/analytics/overview'),
};

export default api;
