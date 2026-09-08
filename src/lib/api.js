const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

async function fetchJSON(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[API] ${endpoint} failed:`, error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to the server. Please check your connection or try again later.');
    }
    
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
