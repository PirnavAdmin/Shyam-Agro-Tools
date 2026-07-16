import axios from '../api/axios';
import { normalizeAssetUrl } from '../utils/assetUrl';

export const CATEGORY_API_BASE_URL = (
  process.env.REACT_APP_CATEGORY_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');
export const DEFAULT_CATEGORY_IMAGE = '/hero_banner.png';
const CATEGORY_ENDPOINT = `${CATEGORY_API_BASE_URL}/api/Category`;
const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};
let categoriesRequest;

export const getCategoryImage = (image) => {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return DEFAULT_CATEGORY_IMAGE;
  }

  return normalizeAssetUrl(image, CATEGORY_API_BASE_URL, DEFAULT_CATEGORY_IMAGE);
};

export const getCategories = async () => {
  if (!categoriesRequest) {
    categoriesRequest = axios.get(CATEGORY_ENDPOINT, requestConfig).finally(() => {
      categoriesRequest = null;
    });
  }
  const response = await categoriesRequest;

  if (!Array.isArray(response.data)) {
    throw new Error('Invalid Category API response');
  }

  const categories = response.data.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    slug: category.slug,
  }));

  return Array.from(
    new Map(categories.map((category) => [category.id, category])).values()
  );
};

export const createCategory = async (data) => {
  const response = await axios.post(CATEGORY_ENDPOINT, data, requestConfig);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await axios.put(`${CATEGORY_ENDPOINT}/${id}`, data, requestConfig);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await axios.delete(`${CATEGORY_ENDPOINT}/${id}`, requestConfig);
  return response.data;
};
