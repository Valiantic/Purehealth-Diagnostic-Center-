import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Skip the check if we're on the login page
    if (window.location.pathname === '/login') {
      setIsAuthenticating(false);
      return;
    }

    // If we've already checked auth status and user is authenticated, don't check again
    if (authCache.isChecked && authCache.user) {
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
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state and cache
      setUser(userData);
      authCache.user = userData;
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

  return { user, isAuthenticating, login, logout };
};

export default useAuth;
