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
    const timestamp = `?_t=${new Date().getTime()}`;
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
  },
  updateDepartment: async (departmentId, departmentName, dateCreated, status, currentUserId) => {
    return apiClient.put(`/departments/${departmentId}`, {
      departmentName,
      dateCreated,
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

export const testAPI = {
  getAllTests: (forceRefresh = false) => {
    const timestamp = forceRefresh ? `?_t=${new Date().getTime()}` : '';
    return apiClient.get(`/tests${timestamp}`);
  },
  createTest: (testData, currentUserId) => {
    return apiClient.post('/tests', {
      ...testData,
      currentUserId: currentUserId 
    });
  },
  updateTest: (id, testData, currentUserId) => {
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
  },
  updateTestDetail: async (testDetailId, data) => {
    return apiClient.put(`/test-details/${testDetailId}`, data);
  },
  getTestDetails: async (transactionId) => {
    return apiClient.get(`/test-details/transaction/${transactionId}`);
  }
};

export const referrerAPI = {
  getAllReferrers: (forceRefresh = false) => {
    const timestamp = forceRefresh ? `?_t=${new Date().getTime()}` : '';
    return apiClient.get(`/referrers${timestamp}`);
  },
  searchReferrers: (params = {}) => {
    return apiClient.get('/referrers/search', { params });
  },
  createReferrer: (referrerData, currentUserId) => {
    return apiClient.post('/referrers', {
      ...referrerData,
      currentUserId: currentUserId 
    });
  },
  updateReferrer: (id, referrerData, currentUserId) => {
    return apiClient.put(`/referrers/${id}`, {
      ...referrerData,
      currentUserId: currentUserId 
    });
  },
  updateReferrerStatus: async (id, status, userId, actionType) => {
    try {
      const response = await apiClient.put(`/referrers/${id}`, { 
        status,
        currentUserId: userId,
        actionType
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Transaction API
export const transactionAPI = {
  getAllTransactions: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status); // Only include if explicitly set
    if (params.date) queryParams.append('date', params.date);
    
    return apiClient.get(`/transactions?${queryParams}`);
  },
  getTransactionById: async (id) => {
    try {
      const response = await apiClient.get(`/transactions/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching transaction by ID:', error);
      throw error;
    }
  },
  getTransactionSummary: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/transactions/summary?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      throw error;
    }
  },
  createTransaction: (transactionData, userId) => {
    return apiClient.post('/transactions', {
      ...transactionData,
      userId
    }).catch(error => {
      console.error('Transaction API error:', error.response?.data || error.message);
      throw error;
    });
  },
  updateTransactionStatus: (transactionId, status, userId) => {
    // Validate inputs before making request
    if (!transactionId) {
      return Promise.reject(new Error('Transaction ID is required'));
    }
    
    if (!status) {
      return Promise.reject(new Error('Status is required'));  
    }
    
    if (!userId) {
      return Promise.reject(new Error('User ID is required'));
    }
    
    return apiClient.patch(`/transactions/${transactionId}/status`, {
      status,
      currentUserId: userId
    }).catch(error => {
      console.error('Error updating transaction status:', error.response?.data || error.message);
      
      // Create more user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Server error occurred';
                          
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      throw enhancedError;
    });
  },
  searchTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/transactions/search?${queryString}`);
  },
  updateTransaction: async (transactionId, transactionData) => {
    try {
      const response = await apiClient.put(`/transactions/${transactionId}`, transactionData);
      return response.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },
  
  // Fix the checkMcNoExists function to properly handle parameters
  checkMcNoExists: async (mcNo, currentTransactionId = null) => {
    try {
      // Build URL manually to ensure correct format
      let url = `${API_BASE_URL}/transactions/check-mcno?mcNo=${encodeURIComponent(mcNo)}`;
      if (currentTransactionId) {
        url += `&currentId=${encodeURIComponent(currentTransactionId)}`;
      }
      
      // Use axios directly instead of apiClient for better debugging
      const response = await axios.get(url);
      
      return response.data;
    } catch (error) {
      console.error('MC# validation error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to check MC#',
        exists: false
      };
    }
  },
};

// Extend the revenue API to handle cancelled transactions
export const revenueAPI = {
  getRevenueByDepartment: (params = {}) => {
    // Add a default flag to exclude cancelled transactions
    const updatedParams = { 
      ...params, 
      excludeCancelled: params.excludeCancelled !== false, // Default to true if not specified
    };
    
    const queryString = new URLSearchParams(updatedParams).toString();
    return apiClient.get(`/department-revenue/by-department?${queryString}`);
  },
  
  getRevenueTrend: (params = {}) => {
    // Add a default flag to exclude cancelled transactions
    const updatedParams = { 
      ...params, 
      excludeCancelled: params.excludeCancelled !== false, // Default to true if not specified
    };
    
    const queryString = new URLSearchParams(updatedParams).toString();
    return apiClient.get(`/department-revenue/trend?${queryString}`);
  },
  
  getRefundsByDepartment: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/department-revenue/refunds?${queryString}`);
  }
};

