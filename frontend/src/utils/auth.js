const AUTH_SESSION_KEY = 'authSession';
const TOKEN_KEYS = ['token', 'authToken'];
const USER_KEYS = ['user', 'authUser'];

const readJson = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const decodeToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(normalized).split('').map(
      (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
    ).join('')));
  } catch {
    return null;
  }
};

export const getTokenExpiry = (token) => {
  const expiry = decodeToken(token)?.exp;
  return Number.isFinite(Number(expiry)) ? Number(expiry) * 1000 : null;
};

export const isTokenExpired = (token, clockSkewMs = 30000) => {
  if (!token) return true;
  const expiresAt = getTokenExpiry(token);
  return expiresAt ? Date.now() + clockSkewMs >= expiresAt : false;
};

export const getAuthSession = () => {
  const session = readJson(localStorage.getItem(AUTH_SESSION_KEY));
  if (session) return session;
  const user = readJson(localStorage.getItem('user')) || readJson(sessionStorage.getItem('user'));
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || user?.token || '';
  return user ? { user, token, refreshToken: localStorage.getItem('refreshToken') || user.refreshToken || '' } : null;
};

export const getToken = () => getAuthSession()?.token || '';
export const getRefreshToken = () => getAuthSession()?.refreshToken || '';

export const setToken = (token) => {
  TOKEN_KEYS.forEach((key) => token ? localStorage.setItem(key, token) : localStorage.removeItem(key));
};

export const setAuthSession = (session) => {
  const next = { ...session, expiresAt: session.expiresAt || getTokenExpiry(session.token) };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(next));
  USER_KEYS.forEach((key) => localStorage.setItem(key, JSON.stringify(next.user)));
  setToken(next.token || '');
  if (next.refreshToken) localStorage.setItem('refreshToken', next.refreshToken);
  else localStorage.removeItem('refreshToken');
  return next;
};

export const removeToken = () => setToken('');

export const clearSession = () => {
  [AUTH_SESSION_KEY, 'refreshToken', 'isLoggedIn', ...TOKEN_KEYS, ...USER_KEYS].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

