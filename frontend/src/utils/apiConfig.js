export const getApiDomain = () => {
  // If running locally in the browser (localhost or 127.0.0.1)
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    if (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.includes('localhost')) {
      return process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '');
    }
    return 'http://localhost:5000';
  }

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
