export const getApiDomain = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '');
  }
  if (process.env.REACT_APP_AUTH_API_BASE_URL) {
    return process.env.REACT_APP_AUTH_API_BASE_URL.replace(/\/$/, '');
  }
  if (process.env.REACT_APP_USE_LOCAL_BACKEND === 'true') {
    return 'http://localhost:5000';
  }
  return 'https://shyamagrotools.com';
};
