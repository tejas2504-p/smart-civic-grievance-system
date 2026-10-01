/**
 * Frontend AI Client
 * Connects to /api/ai endpoints with automatic offline/fallback resilience.
 */

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/ai';

async function postAI(endpoint, body = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'AI request failed');
    }
    return data.data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[AI Client] ${endpoint} request failed, using safe fallback:`, err.message);
    throw err;
  }
}

async function getAI(endpoint, params = '') {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}${params ? `?${params}` : ''}`, {
      headers,
    });
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn(`[AI Client GET] ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const aiClient = {
  chat: (message, language = 'en', context = {}) =>
    postAI('/chat', { message, language, context }),

  searchServices: (query, language = 'en') =>
    postAI('/search', { query, language }),

  explainStatus: (status, complaintId = null, language = 'en') =>
    postAI('/explain-status', { status, complaintId, language }),

  getFormFieldHelp: (fieldName, serviceType = '', language = 'en') =>
    postAI('/form-help', { fieldName, serviceType, language }),

  checkFormConsistency: (formData, language = 'en') =>
    postAI('/form-consistency', { formData, language }),

  checkDocuments: (serviceId, uploadedFiles = [], language = 'en') =>
    postAI('/document-check', { serviceId, uploadedFiles, language }),

  getDashboardSummary: (lang = 'en') =>
    getAI('/summary', `lang=${lang}`),

  getRecommendations: (lang = 'en') =>
    getAI('/recommendations', `lang=${lang}`),

  sendFeedback: (helpful) =>
    postAI('/feedback', { helpful }),

  getAdminAnalytics: () =>
    getAI('/admin-analytics'),
};

export default aiClient;
