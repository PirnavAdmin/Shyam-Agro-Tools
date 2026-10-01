import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPopup from './LoginPopup';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-semibold text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    const requestedPath = `${location.pathname}${location.search}${location.hash}`;

    return (
      <div className="min-h-screen bg-slate-900/10 relative">
        <LoginPopup
          isOpen
          onClose={() => navigate('/', { replace: true })}
          redirectTo={requestedPath}
        />
      </div>
    );
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
