import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login');
        setLoading(false);
        return;
      }
      
      try {
        setUser(JSON.parse(userData));
        setLoading(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        navigate('/login');
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return { user, loading };
};

export default useAuth;
