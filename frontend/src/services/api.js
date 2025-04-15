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
  getAllDepartments: () => {
    return apiClient.get('/departments');
  },
  createDepartment: (name) => {
    return apiClient.post('/departments', { departmentName: name });
  },
  updateDepartmentStatus: (id, status) => {
    return apiClient.patch(`/departments/${id}`, { status });
  }
};