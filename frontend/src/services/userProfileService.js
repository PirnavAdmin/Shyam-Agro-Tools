import apiClient from '../api/axios';

export const USER_PROFILE_API_BASE_URL = (
  process.env.REACT_APP_AUTH_API_BASE_URL ||
  'https://wildlife-unwieldy-devotee.ngrok-free.dev'
).replace(/\/$/, '');

const requestConfig = {
  skipAuth: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

const getApiErrorMessage = (error) => {
  const errors = error?.response?.data?.errors;
  const firstValidationError = errors && Object.values(errors).flat().find(Boolean);
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.response?.data?.error ||
    firstValidationError ||
    error?.message ||
    'Unable to update profile.'
  );
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

  if (!normalizedMobileNumber || !imageFile) return '';

  const formData = new FormData();
  formData.append('MobileNumber', normalizedMobileNumber);
  formData.append('Image', imageFile);

  try {
    const response = await apiClient.post(
      `${USER_PROFILE_API_BASE_URL}/test-auth/upload-profile-image`,
      formData,
      {
        skipAuth: true,
        timeout: 30000,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Accept: 'application/json',
        },
      }
    );
    const data = getResponseData(response.data);
    if (typeof data === 'string') return data;
    return getFirstValue(data, ['profileImageUrl', 'ProfileImageUrl', 'profileImage', 'imageUrl', 'url']);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getUserProfile = async (currentMobileNumber) => {
  const mobileNumber = String(currentMobileNumber || '').replace(/\D/g, '').slice(-10);

  if (!mobileNumber) {
    throw new Error('Mobile number is required to load profile.');
  }

  try {
    const response = await apiClient.get(
      `${USER_PROFILE_API_BASE_URL}/test-auth/user/${encodeURIComponent(mobileNumber)}`,
      requestConfig
    );

    return getResponseData(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const updateUserProfile = async (currentMobileNumber, values) => {
  const mobileNumber = String(currentMobileNumber || '').replace(/\D/g, '').slice(-10);

  if (!mobileNumber) {
    throw new Error('Mobile number is required to update profile.');
  }

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

  try {
    const response = await apiClient.put(
      `${USER_PROFILE_API_BASE_URL}/test-auth/user/${encodeURIComponent(mobileNumber)}`,
      payload,
      requestConfig
    );

    return getResponseData(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};
