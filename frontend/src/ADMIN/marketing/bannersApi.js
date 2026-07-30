import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

const API_BASE = `${getApiDomain()}/api/Banners`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
});

export const fetchAdminBanners = async () => {
  const response = await api.get('/admin');
  return response.data;
};

export const fetchActiveBanners = async (type = '') => {
  const response = await api.get(type ? `?type=${type}` : '');
  return response.data;
};

export const createBanner = async (bannerData) => {
  const response = await api.post('', bannerData);
  return response.data;
};

export const updateBanner = async (id, bannerData) => {
  const response = await api.put(`/${id}`, bannerData);
  return response.data;
};

export const toggleBannerActive = async (id) => {
  const response = await api.put(`/${id}/toggle`);
  return response.data;
};

export const deleteBanner = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export const uploadBannerImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
