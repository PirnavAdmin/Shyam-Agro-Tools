import axios from 'axios';
import { clearSession, getRefreshToken, getToken, setAuthSession } from '../utils/auth';

const apiClient = axios.create();
let refreshRequest = null;

const authBaseUrl = () => (process.env.REACT_APP_AUTH_API_BASE_URL || 'https://shyamagrotools.com').replace(/\/$/, '');

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.skipAuth) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const recoverSession = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (!refreshRequest) {
    refreshRequest = axios.post(
      `${authBaseUrl()}/test-auth/refresh-token`,
      { refreshToken },
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    ).then((response) => {
      const data = response.data?.data ?? response.data ?? {};
      const token = data.token || data.accessToken || data.jwtToken || data.authToken;
      if (!token) throw new Error('Refresh response did not contain a token.');
      return setAuthSession({
        ...(JSON.parse(localStorage.getItem('authSession') || '{}')),
        token,
        refreshToken: data.refreshToken || refreshToken,
      });
    }).finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config || {};
    const status = error.response?.status;
    if ((status === 401 || status === 403) && !request.skipAuth && !request._authRetried) {
      request._authRetried = true;
      try {
        const session = await recoverSession();
        if (session?.token) {
          request.headers = request.headers || {};
          request.headers.Authorization = `Bearer ${session.token}`;
          return apiClient(request);
        }
      } catch {
        // Fall through to the shared unauthorized handler.
      }
      clearSession();
      window.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: { returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}` },
      }));
    }
    return Promise.reject(error);
  }
);

export default apiClient;

