import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/auth/useAuth'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ProtectedRoute = ({ component: Component, allowedRoles = [], restrictFromRole, ...rest }) => {
    const { user, isAuthenticating } = useAuth();

    useEffect(() => {
        if (user && restrictFromRole && user.role === restrictFromRole) {
            toast.error('You do not have permission to access this page', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        }
    }, [user, restrictFromRole]);

    if (isAuthenticating) {
        return null;
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (restrictFromRole && user.role === restrictFromRole) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return <Component />;
}

export default ProtectedRoute
