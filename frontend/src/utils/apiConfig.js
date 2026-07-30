export const getApiDomain = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  if (process.env.REACT_APP_AUTH_API_BASE_URL) {
    return process.env.REACT_APP_AUTH_API_BASE_URL;
  }
  return 'https://shyamagrotools.com';
};
