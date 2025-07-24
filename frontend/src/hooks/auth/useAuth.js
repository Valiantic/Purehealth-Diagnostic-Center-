import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Keep a global cache of authentication state to persist between navigations
let authCache = {
  user: null,
  isChecked: false
};

const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authCache.user);
  const [isAuthenticating, setIsAuthenticating] = useState(!authCache.isChecked);

  // Create a refreshUser function to get fresh user data from localStorage
  const refreshUser = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        if (!parsedUser.middleName && parsedUser.middleName !== '') {
        }
        
        setUser(parsedUser);
        authCache.user = parsedUser;
        return parsedUser;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Skip the check if we're on the login page
    if (window.location.pathname === '/login') {
      setIsAuthenticating(false);
      return;
    }

    const checkAuth = () => {
      setIsAuthenticating(true);
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        // No user data, redirect to login
        navigate('/login');
        authCache.isChecked = true;
        authCache.user = null;
        setIsAuthenticating(false);
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        // Update both local state and global cache
        setUser(parsedUser);
        authCache.user = parsedUser;
        authCache.isChecked = true;
        setIsAuthenticating(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        authCache.isChecked = true;
        authCache.user = null;
        navigate('/login');
        setIsAuthenticating(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Add login function to set user data and update cache
  const login = (userData) => {
    try {
      // Log the received user data
      console.log('User data received during login:', userData);
      
      const completeUserData = {
        ...userData,
        middleName: userData.middleName !== undefined ? userData.middleName : ''
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(completeUserData));
      
      // Update state and cache
      setUser(completeUserData);
      authCache.user = completeUserData;
      authCache.isChecked = true;
      setIsAuthenticating(false);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // Add logout function to clear cache
  const logout = () => {
    localStorage.removeItem('user');
    authCache = { user: null, isChecked: false };
    setUser(null);
    navigate('/login');
  };

  return { user, isAuthenticating, login, logout, refreshUser };
};

export default useAuth;
