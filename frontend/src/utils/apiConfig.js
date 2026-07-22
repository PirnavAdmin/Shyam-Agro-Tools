export const getApiDomain = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  if (process.env.REACT_APP_AUTH_API_BASE_URL) {
    return process.env.REACT_APP_AUTH_API_BASE_URL;
  }
  return 'https://shyamagrotools.com';
};
