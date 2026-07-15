import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/axios';
import {
  clearSession,
  getAuthSession,
  getTokenExpiry,
  isTokenExpired,
  setAuthSession,
} from '../../utils/auth';

const AuthContext = createContext(null);

const getResponseValue = (source, keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
  }
  return undefined;
};

export const normalizeAuthResponse = (data = {}, fallback = {}) => {
  const responseData = data?.data || data;
  const userData = responseData?.user || responseData?.data?.user || responseData?.data || fallback.user || {};
  const token = getResponseValue(responseData, ['token', 'accessToken', 'jwtToken', 'authToken'])
    || getResponseValue(userData, ['token', 'accessToken', 'jwtToken', 'authToken']) || fallback.token || '';
  const refreshToken = getResponseValue(responseData, ['refreshToken'])
    || getResponseValue(userData, ['refreshToken']) || fallback.refreshToken || '';
  const phone = getResponseValue(userData, ['phone', 'mobileNumber', 'MobileNumber']) || fallback.phone || '';
  const user = {
    ...userData,
    phone,
    name: getResponseValue(userData, ['name', 'fullName', 'FullName']) || fallback.name || 'User',
    email: getResponseValue(userData, ['email', 'Email']) || fallback.email || '',
    role: userData.role || fallback.role || 'Grower',
    wallet: getResponseValue(userData, ['wallet', 'walletBalance']) || 0,
    id: getResponseValue(userData, ['id', 'userId', 'customerId']) || fallback.id || phone,
    token,
    refreshToken,
    loggedIn: true,
  };
  return {
    user,
    token,
    refreshToken,
    expiresAt: getTokenExpiry(token),
    loginTime: Date.now(),
  };
};

export const isSuccessfulAuthResponse = (data) => Boolean(data && data.success !== false);
export const readStoredUser = () => getAuthSession()?.user || null;

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChallenge, setAuthChallenge] = useState(null);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: null }));
  }, []);

  const restoreSession = useCallback(() => {
    setLoading(true);
    const stored = getAuthSession();
    if (stored?.token && isTokenExpired(stored.token) && !stored.refreshToken) {
      clearSession();
      setSession(null);
    } else {
      setSession(stored);
    }
    setLoading(false);
    return stored;
  }, []);

  const login = useCallback((authData, fallback = {}) => {
    const next = authData?.user && Object.prototype.hasOwnProperty.call(authData, 'loginTime')
      ? authData
      : normalizeAuthResponse(authData, fallback);
    const saved = setAuthSession(next);
    localStorage.setItem('isLoggedIn', 'true');
    setSession(saved);
    setAuthChallenge(null);
    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: saved.user }));
    return saved.user;
  }, []);

  const refreshSession = useCallback(async () => {
    const current = getAuthSession();
    if (!current?.refreshToken) return null;
    try {
      const baseUrl = (process.env.REACT_APP_AUTH_API_BASE_URL || 'https://wildlife-unwieldy-devotee.ngrok-free.dev').replace(/\/$/, '');
      const response = await apiClient.post(`${baseUrl}/test-auth/refresh-token`, {
        refreshToken: current.refreshToken,
      }, { skipAuth: true });
      return login(response.data, current.user);
    } catch (error) {
      logout();
      throw error;
    }
  }, [login, logout]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const syncSession = () => setSession(getAuthSession());
    const handleUnauthorized = (event) => {
      setSession(null);
      setLoading(false);
      setAuthChallenge({ returnTo: event.detail?.returnTo || '/' });
    };
    window.addEventListener('storage', syncSession);
    window.addEventListener('auth:user-updated', syncSession);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('auth:user-updated', syncSession);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || '',
    refreshToken: session?.refreshToken || '',
    expiresAt: session?.expiresAt || null,
    isLoggedIn: Boolean(session?.user?.loggedIn || session?.user?.id || session?.user?.phone || session?.token),
    isAuthenticated: Boolean(session?.user?.loggedIn || session?.user?.id || session?.user?.phone || session?.token),
    loading,
    login,
    logout,
    restoreSession,
    refreshSession,
    authChallenge,
    clearAuthChallenge: () => setAuthChallenge(null),
  }), [session, loading, login, logout, restoreSession, refreshSession, authChallenge]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
