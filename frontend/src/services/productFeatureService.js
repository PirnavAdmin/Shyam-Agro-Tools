import axios from '../api/axios';
import { PRODUCT_API_BASE_URL } from './productService';

const FEATURE_ENDPOINT = `${PRODUCT_API_BASE_URL}/api/features`;
const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

export const normalizeFeature = (feature = {}) => ({
  ...feature,
  id: feature.id,
  productId: feature.productId,
  feature: feature.feature || feature.text || '',
});

export const createProductFeature = async (data) => {
  const response = await axios.post(FEATURE_ENDPOINT, data, requestConfig);
  return normalizeFeature(response.data);
};

export const getProductFeatures = async (productId) => {
  const response = await axios.get(`${FEATURE_ENDPOINT}/${productId}`, requestConfig);
  if (!Array.isArray(response.data)) throw new Error('Invalid Product Features API response');
  return response.data.map(normalizeFeature);
};

export const deleteProductFeature = async (id) => {
  const response = await axios.delete(`${FEATURE_ENDPOINT}/${id}`, requestConfig);
  return response.data;
};
