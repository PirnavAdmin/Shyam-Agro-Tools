import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const fetchAdminBanners = async () => {
  const response = await axios.get(`${API_URL}/Banners/admin`);
  return response.data;
};

export const fetchActiveBanners = async (type = '') => {
  const response = await axios.get(`${API_URL}/Banners${type ? `?type=${type}` : ''}`);
  return response.data;
};

export const createBanner = async (bannerData) => {
  const response = await axios.post(`${API_URL}/Banners`, bannerData);
  return response.data;
};

export const updateBanner = async (id, bannerData) => {
  const response = await axios.put(`${API_URL}/Banners/${id}`, bannerData);
  return response.data;
};

export const toggleBannerActive = async (id) => {
  const response = await axios.put(`${API_URL}/Banners/${id}/toggle`);
  return response.data;
};

export const deleteBanner = async (id) => {
  const response = await axios.delete(`${API_URL}/Banners/${id}`);
  return response.data;
};

export const uploadBannerImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/Banners/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
