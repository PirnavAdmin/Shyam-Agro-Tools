import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPopup from './LoginPopup';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div role="status" aria-live="polite">Loading...</div>;
  }

  if (!isAuthenticated) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`;

    return (
      <LoginPopup
        isOpen
        onClose={() => navigate('/', { replace: true })}
        redirectTo={requestedPath}
      />
    );
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
