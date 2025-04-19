import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User API
export const userAPI = {
  register: (userData) => {
    return apiClient.post('/users/register', userData);
  },
  findByEmail: (email) => {
    return apiClient.post('/users/find', { email });
  },
  getAllUsers: () => {
    return apiClient.get('/users/all');
  },
  updateUserStatus: (userId, status) => {
    return apiClient.patch(`/users/${userId}/status`, { status });
  },
  updateUserDetails: (userId, userData) => {
    return apiClient.put(`/users/${userId}`, userData);
  },
  getUserById: (userId) => {
    return apiClient.get(`/users/${userId}`);
  }
};

// WebAuthn API
export const webauthnAPI = {
  // Temporary Registration (user not yet created)
  getTempRegistrationOptions: (userData) => {
    return apiClient.post('/webauthn/registration/temp/options', userData);
  },
  verifyTempRegistration: (tempRegistrationId, response, userData) => {
    return apiClient.post('/webauthn/registration/temp/verify', { 
      tempRegistrationId, 
      response, 
      userData 
    });
  },
  
  // Registration
  getRegistrationOptions: (userId, isPrimary = true) => {
    return apiClient.post('/webauthn/registration/options', { userId, isPrimary });
  },
  verifyRegistration: (userId, response, isPrimary = true) => {
    return apiClient.post('/webauthn/registration/verify', { userId, response, isPrimary });
  },
  
  // Authentication
  getAuthenticationOptions: (email) => {
    return apiClient.post('/webauthn/authentication/options', { email });
  },
  verifyAuthentication: (userId, response) => {
    return apiClient.post('/webauthn/authentication/verify', { userId, response });
  }
};

// Department API
export const departmentAPI = {
  getAllDepartments: (forceRefresh = false) => {
    // Add cache-busting timestamp parameter to prevent caching
    const timestamp = forceRefresh ? `?_t=${new Date().getTime()}` : '';
    return apiClient.get(`/departments${timestamp}`);
  },
  createDepartment: (name, currentUserId) => {
    return apiClient.post('/departments', { 
      departmentName: name,
      currentUserId 
    });
  },
  updateDepartmentStatus: (id, status, currentUserId) => {
    return apiClient.patch(`/departments/${id}`, { 
      status,
      currentUserId 
    });
  }
};

// Activity Log API
export const activityLogAPI = {
  getAllLogs: (params = {}) => {
    return apiClient.get('/activity-logs', { params });
  }
};

// Test API
export const testAPI = {
  getAllTests: () => {
    return apiClient.get('/tests');
  },
  createTest: (testData, currentUserId) => {
    // Ensure currentUserId is explicitly included in both the data AND the URL parameters
    return apiClient.post('/tests', {
      ...testData,
      currentUserId: currentUserId 
    });
  },
  updateTest: (id, testData, currentUserId) => {
    // Ensure currentUserId is explicitly included in both the data AND the URL parameters
    return apiClient.put(`/tests/${id}`, {
      ...testData,
      currentUserId: currentUserId 
    });
  },
  updateTestStatus: (id, status, currentUserId) => {
    return apiClient.patch(`/tests/${id}`, {
      status,
      currentUserId
    });
  }
};