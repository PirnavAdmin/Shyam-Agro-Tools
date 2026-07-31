import { getApiDomain } from "../utils/apiConfig";
import apiClient from '../api/axios';
import { getToken } from '../utils/auth';

const getAuthApiBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_AUTH_API_BASE_URL;
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '');
  return getApiDomain();
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

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getFirstValue = (source, keys) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source[key] !== '') return source[key];
  }
  return '';
};

const findNestedValue = (source, keys, depth = 0) => {
  if (!source || typeof source !== 'object' || depth > 4) return '';

  const directValue = getFirstValue(source, keys);
  if (directValue) return directValue;

  for (const value of Object.values(source)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedValue = findNestedValue(item, keys, depth + 1);
        if (nestedValue) return nestedValue;
      }
    } else if (value && typeof value === 'object') {
      const nestedValue = findNestedValue(value, keys, depth + 1);
      if (nestedValue) return nestedValue;
    }
  }

  return '';
};

const PROFILE_IMAGE_KEYS = [
  'profileImageUrl',
  'ProfileImageUrl',
  'profileImage',
  'ProfileImage',
  'profile_picture',
  'profilePicture',
  'profilePhoto',
  'ProfilePhoto',
  'photoUrl',
  'PhotoUrl',
  'avatar',
  'avatarUrl',
  'imageUrl',
  'ImageUrl',
  'image',
  'photo',
  'url',
];

export const normalizeProfileImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  const baseUrl = getAuthApiBaseUrl();
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

export const getProfileImageFromSource = (source) =>
  normalizeProfileImageUrl(findNestedValue(source, PROFILE_IMAGE_KEYS));

export const withImageCacheBust = (url, version = Date.now()) => {
  const normalizedUrl = normalizeProfileImageUrl(url);
  if (!normalizedUrl || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) return normalizedUrl;
  return normalizedUrl.includes('?') ? `${normalizedUrl}&v=${version}` : `${normalizedUrl}?v=${version}`;
};

export const withoutImageCacheBust = (url) => {
  const normalizedUrl = normalizeProfileImageUrl(url);
  if (!normalizedUrl || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:')) return normalizedUrl;

  try {
    const parsedUrl = new URL(normalizedUrl);
    parsedUrl.searchParams.delete('v');
    parsedUrl.searchParams.delete('t');
    return parsedUrl.toString();
  } catch {
    return normalizedUrl
      .replace(/([?&])(v|t)=[^&]*&?/g, '$1')
      .replace(/[?&]$/, '');
  }
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
    const uploadedUrl = normalizeProfileImageUrl(typeof data === 'string' ? data : findNestedValue(data, PROFILE_IMAGE_KEYS));
    if (!uploadedUrl) {
      throw new Error('Profile image upload succeeded but no image URL was returned.');
    }
    return uploadedUrl;
  } catch (error) {
    console.warn("Upload profile image failed:", error.message);
    throw new Error(getApiErrorMessage(error, 'Unable to upload profile image.'));
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

    const profile = getResponseData(response.data);
    const profileImage = getProfileImageFromSource(profile);
    return profileImage ? { ...profile, profileImage, profileImageUrl: profileImage } : profile;
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
    profileImageUrl: withoutImageCacheBust(String(values.profileImageUrl || values.profileImage || '').trim()),
    profileImage: withoutImageCacheBust(String(values.profileImage || values.profileImageUrl || '').trim()),
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

    const updatedProfile = getResponseData(response.data) || payload;
    const profileImage = getProfileImageFromSource(updatedProfile) || normalizeProfileImageUrl(payload.profileImageUrl);
    return profileImage ? { ...updatedProfile, profileImage, profileImageUrl: profileImage } : updatedProfile;
  } catch (error) {
    console.warn("Update user profile fallback:", error.message);
    throw new Error(getApiErrorMessage(error, 'Unable to update profile.'));
  }
};
