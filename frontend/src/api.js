// API configuration and utilities

import axios from 'axios';

// Read API URL from environment or use local fallback.
// Supports either:
// - http://localhost:8000
// - http://localhost:8000/api/
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api/').trim();
const normalizedApiUrl = API_URL.replace(/\/+$/, '');
const API_BASE_URL = normalizedApiUrl.endsWith('/api')
  ? `${normalizedApiUrl}/`
  : `${normalizedApiUrl}/api/`;

// Validate URL format
if (!API_URL) {
  console.warn(
    '⚠️  Invalid REACT_APP_API_URL detected.\n' +
    `   Current value: "${API_URL}"\n` +
    '   For local development, use: REACT_APP_API_URL=http://localhost:8000/api/'
  );
}

// Axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const shouldSkipAuth = (url = '') => {
  return url.includes('/auth/login/') || url.includes('/auth/token/refresh/') || url.includes('/auth/token/verify/');
};

// Request interceptor to add CSRF token
apiClient.interceptors.request.use(
  (config) => {
    // Attach JWT token for authenticated API calls.
    const token = localStorage.getItem('token');
    if (token && !shouldSkipAuth(config.url || '')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token if available (for Django)
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error);
    console.error('API URL:', API_BASE_URL);

    const originalRequest = error.config || {};

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipAuth(originalRequest.url || '')
    ) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}auth/token/refresh/`, { refresh });
          const newAccess = refreshResponse.data?.access;
          if (newAccess) {
            localStorage.setItem('token', newAccess);
            apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${newAccess}`,
            };
            return apiClient(originalRequest);
          }
        } catch (_refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || `HTTP ${error.response.status}: ${error.response.statusText}`;
      throw new Error(message);
    } else if (error.request) {
      // Network error - likely connection issue or invalid URL
      const errorMsg = 
        `Network error connecting to API.\n` +
        `API URL: ${API_BASE_URL}\n` +
        `Make sure:\n` +
        `  1. Backend is running at ${API_URL}\n` +
        `  2. Ensure REACT_APP_API_URL in frontend/.env is set correctly\n` +
        `  3. For local dev: Ensure Django backend is running on port 8000`;
      throw new Error(errorMsg);
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Helper function to get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// API endpoints object - combines axios client with custom methods
export const api = {
  // Axios client methods (for direct HTTP calls like in AuthContext)
  post: (url, data, config) => apiClient.post(url, data, config),
  get: (url, config) => apiClient.get(url, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
  
  // Leads endpoints
  getDashboardData: () => apiClient.get('dashboard/'),
  getLeads: (params = {}) => apiClient.get('leads/', { params }),
  getLead: (id) => apiClient.get(`leads/${id}/`),
  updateLead: (id, data) => apiClient.patch(`leads/${id}/`, data),
  assignLead: (id, userId) => apiClient.post(`leads/${id}/assign/`, { user_id: userId }),
  addNote: (id, text) => apiClient.post(`leads/${id}/add_note/`, { text }),
  getConversions: (params = {}) => apiClient.get('leads/conversions/', { params }),


  // Marketing endpoints
  getCampaigns: (params = {}) => apiClient.get('campaigns/', { params }),
  createCampaign: (data) => apiClient.post('campaigns/', data),
  updateCampaign: (id, data) => apiClient.patch(`campaigns/${id}/`, data),
  deleteCampaign: (id) => apiClient.delete(`campaigns/${id}/`),

  getBroadcasts: (params = {}) => apiClient.get('broadcasts/', { params }),
  createBroadcast: (data) => apiClient.post('broadcasts/', data),
  deleteBroadcast: (id) => apiClient.delete(`broadcasts/${id}/`),

  getEngagementActivities: (params = {}) => apiClient.get('engagement-activities/', { params }),
  createEngagementActivity: (data) => apiClient.post('engagement-activities/', data),
  updateEngagementActivity: (id, data) => apiClient.patch(`engagement-activities/${id}/`, data),
  deleteEngagementActivity: (id) => apiClient.delete(`engagement-activities/${id}/`),

  getAutomationRules: (params = {}) => apiClient.get('automation-rules/', { params }),
  createAutomationRule: (data) => apiClient.post('automation-rules/', data),
  updateAutomationRule: (id, data) => apiClient.patch(`automation-rules/${id}/`, data),
  deleteAutomationRule: (id) => apiClient.delete(`automation-rules/${id}/`),

  // Tasks endpoints
  getTasks: (params = {}) => apiClient.get('tasks/', { params }),
  createTask: (data) => apiClient.post('tasks/', data),
  updateTask: (id, data) => apiClient.patch(`tasks/${id}/`, data),
  deleteTask: (id) => apiClient.delete(`tasks/${id}/`),

  // Follow-ups endpoints
  getFollowUps: (params = {}) => apiClient.get('followups/', { params }),
  createFollowUp: (data) => apiClient.post('followups/', data),
  updateFollowUp: (id, data) => apiClient.patch(`followups/${id}/`, data),
  deleteFollowUp: (id) => apiClient.delete(`followups/${id}/`),

  // Customers endpoints
  getCustomers: (params = {}) => apiClient.get('customers/', { params }),
  getCustomer: (id) => apiClient.get(`customers/${id}/`),
  uploadCustomerDocument: (id, formData) => apiClient.post(`customers/${id}/upload_document/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getCustomerDocuments: (params = {}) => apiClient.get('customer-documents/', { params }),

  // Operations endpoints
  getSurveys: (params = {}) => apiClient.get('surveys/', { params }),
  createSurvey: (data) => apiClient.post('surveys/', data),
  updateSurvey: (id, data) => apiClient.patch(`surveys/${id}/`, data),
  deleteSurvey: (id) => apiClient.delete(`surveys/${id}/`),

  getInstallations: (params = {}) => apiClient.get('installations/', { params }),
  createInstallation: (data) => apiClient.post('installations/', data),
  updateInstallation: (id, data) => apiClient.patch(`installations/${id}/`, data),
  deleteInstallation: (id) => apiClient.delete(`installations/${id}/`),
  markInstallationCompleted: (id) => apiClient.post(`installations/${id}/mark_completed/`),

  // Finance endpoints
  getLoans: (params = {}) => apiClient.get('loans/', { params }),
  createLoan: (data) => apiClient.post('loans/', data),
  updateLoan: (id, data) => apiClient.patch(`loans/${id}/`, data),
  deleteLoan: (id) => apiClient.delete(`loans/${id}/`),

  getSubsidies: (params = {}) => apiClient.get('subsidies/', { params }),
  createSubsidy: (data) => apiClient.post('subsidies/', data),
  updateSubsidy: (id, data) => apiClient.patch(`subsidies/${id}/`, data),
  deleteSubsidy: (id) => apiClient.delete(`subsidies/${id}/`),

  // Inventory endpoints
  getProducts: (params = {}) => apiClient.get('products/', { params }),
  createProduct: (data) => apiClient.post('products/', data),
  updateProduct: (id, data) => apiClient.patch(`products/${id}/`, data),
  deleteProduct: (id) => apiClient.delete(`products/${id}/`),
  getStocks: (params = {}) => apiClient.get('stocks/', { params }),
  increaseStock: (id, amount) => apiClient.post(`stocks/${id}/increase/`, { amount }),
  decreaseStock: (id, amount) => apiClient.post(`stocks/${id}/decrease/`, { amount }),
  getSuppliers: (params = {}) => apiClient.get('suppliers/', { params }),
  createSupplier: (data) => apiClient.post('suppliers/', data),
  updateSupplier: (id, data) => apiClient.patch(`suppliers/${id}/`, data),
  deleteSupplier: (id) => apiClient.delete(`suppliers/${id}/`),

  // Users endpoints
  getUsers: () => apiClient.get('users/'),
  getManagedUsers: () => apiClient.get('auth/users/'),
  createManagedUser: (data) => apiClient.post('auth/users/', data),
  updateManagedUser: (id, data) => apiClient.patch(`auth/users/${id}/`, data),

  // Sales Products (pricing catalogue) endpoints
  getSalesProducts: (params = {}) => apiClient.get('sales-products/', { params }),
  createSalesProduct: (data) => apiClient.post('sales-products/', data),
  updateSalesProduct: (id, data) => apiClient.patch(`sales-products/${id}/`, data),
  deleteSalesProduct: (id) => apiClient.delete(`sales-products/${id}/`),

  // Reports endpoints
  getSalesReport: (params = {}) => apiClient.get('reports/sales/', { params }),
  getLeadsReport: (params = {}) => apiClient.get('reports/leads/', { params }),
  getTasksReport: (params = {}) => apiClient.get('reports/tasks/', { params }),
  getInventoryReport: (params = {}) => apiClient.get('reports/inventory/', { params }),
  getFinanceReport: (params = {}) => apiClient.get('reports/finance/', { params }),

  // Audit logs endpoint
  getAuditLogs: (params = {}) => apiClient.get('audit-logs/', { params }),
  
  // Axios instance for advanced usage
  defaults: apiClient.defaults,
  interceptors: apiClient.interceptors,
};

// Diagnostic utility for troubleshooting
export function diagnoseAPI() {
  const diagnostics = {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || '(not set)',
    API_URL_USED: API_URL,
    API_BASE_URL: API_BASE_URL,
    LOCALHOST_8000_ACCESSIBLE: 'Check browser Network tab',
    ENV_FILE_STATUS: API_URL === 'http://localhost:8000/api/' ? 
      'Using local default' : 
      'Custom URL configured',
  };
  
  return diagnostics;
}

// Export for direct axios usage if needed
export { API_BASE_URL, API_URL };
export default apiClient;