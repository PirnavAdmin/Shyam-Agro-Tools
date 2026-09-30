import axios from '../api/axios';
import { normalizeAssetUrl } from '../utils/assetUrl';

import { getApiDomain } from '../utils/apiConfig';

export const CATEGORY_API_BASE_URL = getApiDomain();
export const DEFAULT_CATEGORY_IMAGE = '/hero_banner.png';
const CATEGORY_ENDPOINT = `${CATEGORY_API_BASE_URL}/api/Category`;
const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};
let categoriesRequest;

export const getCategoryFallbackImage = (nameOrSlug) => {
  const normalized = String(nameOrSlug || '').toLowerCase();
  if (normalized.includes('kitchen')) return '/commercial-kitchen-category.jpg';
  if (normalized.includes('fertilizer')) return '/fertilizers-category.jpg';
  if (normalized.includes('sprayer')) return '/product-images/sprayer-field-hero.png';
  return DEFAULT_CATEGORY_IMAGE;
};

export const getCategoryImage = (image, nameOrSlug) => {
  const fallback = getCategoryFallbackImage(nameOrSlug);
  if (!image || typeof image !== 'string' || !image.trim()) {
    return fallback;
  }

  return normalizeAssetUrl(image, CATEGORY_API_BASE_URL, fallback);
};

export const getCategories = async () => {
  if (!categoriesRequest) {
    categoriesRequest = axios.get(CATEGORY_ENDPOINT, requestConfig).finally(() => {
      categoriesRequest = null;
    });
  }
  const response = await categoriesRequest;
  const rawList = Array.isArray(response.data)
    ? response.data
    : (Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data?.value) ? response.data.value : []));

  const categories = rawList.map((category) => ({
    id: category.id,
    name: category.name || category.categoryName || '',
    description: category.description || '',
    imageUrl: category.imageUrl || category.image || '',
    isActive: category.isActive !== false,
    slug: category.slug || '',
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
