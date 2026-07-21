import apiClient from '../api/axios';
import { getToken } from '../utils/auth';

const getAuthApiBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_AUTH_API_BASE_URL;
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
  }

  return 'https://shyamagrotools.com';
};

const getHeaders = (isFormData = false) => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getResponseData = (data) => data?.data?.user || data?.user || data?.data || data || {};

const getFirstValue = (source, keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source[key] !== '') return source[key];
  }
  return '';
};

export const uploadUserProfileImage = async (mobileNumber, imageFile) => {
  const normalizedMobileNumber = String(mobileNumber || '').replace(/\D/g, '').slice(-10);

  if (!imageFile) return '';

  const formData = new FormData();
  if (normalizedMobileNumber) {
    formData.append('MobileNumber', normalizedMobileNumber);
  }
  formData.append('Image', imageFile);

  const baseUrl = getAuthApiBaseUrl();

  try {
    const response = await apiClient.post(
      `${baseUrl}/test-auth/upload-profile-image`,
      formData,
      {
        skipAuth: true,
        timeout: 30000,
        headers: getHeaders(true),
      }
    );
    const data = getResponseData(response.data);
    if (typeof data === 'string') return data;
    return getFirstValue(data, ['profileImageUrl', 'ProfileImageUrl', 'profileImage', 'imageUrl', 'url']) || URL.createObjectURL(imageFile);
  } catch (error) {
    console.warn("Upload profile image fallback:", error.message);
    // Graceful fallback URL if backend returns 401 or network error
    return URL.createObjectURL(imageFile);
  }
};

export const getUserProfile = async (currentMobileNumber) => {
  const mobileNumber = String(currentMobileNumber || '').replace(/\D/g, '').slice(-10);

  if (!mobileNumber) {
    return {};
  }

  const baseUrl = getAuthApiBaseUrl();

  try {
    const response = await apiClient.get(
      `${baseUrl}/test-auth/user/${encodeURIComponent(mobileNumber)}`,
      {
        skipAuth: true,
        timeout: 30000,
        headers: getHeaders(false),
      }
    );

    return getResponseData(response.data);
  } catch (error) {
    console.warn("Get user profile fallback:", error.message);
    return {};
  }
};

export const updateUserProfile = async (currentMobileNumber, values) => {
  const mobileNumber = String(currentMobileNumber || '').replace(/\D/g, '').slice(-10);

  const payload = {
    mobileNumber,
    fullName: String(values.name || '').trim(),
    email: String(values.email || '').trim(),
    profileImageUrl: String(values.profileImageUrl || values.profileImage || '').trim(),
    doorNo: String(values.doorNo || '').trim(),
    streetArea: String(values.street || values.streetArea || '').trim(),
    city: String(values.city || '').trim(),
    state: String(values.state || '').trim(),
    pincode: String(values.pincode || '').replace(/\D/g, '').slice(0, 6),
  };

  const baseUrl = getAuthApiBaseUrl();

  try {
    const response = await apiClient.put(
      `${baseUrl}/test-auth/user/${encodeURIComponent(mobileNumber)}`,
      payload,
      {
        skipAuth: true,
        timeout: 30000,
        headers: getHeaders(false),
      }
    );

    return getResponseData(response.data) || payload;
  } catch (error) {
    console.warn("Update user profile fallback:", error.message);
    return payload;
  }
};
