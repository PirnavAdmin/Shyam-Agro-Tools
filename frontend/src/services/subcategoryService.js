import { getApiDomain } from "../utils/apiConfig";
import axios from '../api/axios';
import { normalizeAssetUrl } from '../utils/assetUrl';

export const SUBCATEGORY_API_BASE_URL = (
  process.env.REACT_APP_SUBCATEGORY_API_BASE_URL ||
  process.env.REACT_APP_CATEGORY_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  getApiDomain()
).replace(/\/$/, '');

export const DEFAULT_SUBCATEGORY_IMAGE = '/hero_banner.png';
const SUBCATEGORY_ENDPOINT = `${SUBCATEGORY_API_BASE_URL}/api/Subcategory`;
const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};
let subcategoriesRequest;

export const getSubcategoryImage = (image) => {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return DEFAULT_SUBCATEGORY_IMAGE;
  }
  return normalizeAssetUrl(image, SUBCATEGORY_API_BASE_URL, DEFAULT_SUBCATEGORY_IMAGE);
};

export const getSubcategories = async () => {
  if (!subcategoriesRequest) {
    subcategoriesRequest = axios.get(SUBCATEGORY_ENDPOINT, requestConfig).finally(() => {
      subcategoriesRequest = null;
    });
  }
  const response = await subcategoriesRequest;
  const rawList = Array.isArray(response.data)
    ? response.data
    : (Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data?.value) ? response.data.value : []));

  const subcategories = rawList.map((subcategory) => ({
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    name: subcategory.name || subcategory.subcategoryName || '',
    description: subcategory.description || '',
    imageUrl:
      subcategory.imageUrl ||
      subcategory.image ||
      subcategory.coverImage ||
      subcategory.thumbnail ||
      subcategory.subCategoryImage ||
      subcategory.subcategoryImage ||
      subcategory.filePath ||
      subcategory.imagePath ||
      '',
    isActive: subcategory.isActive !== false,
    slug: subcategory.slug || '',
  }));

  return Array.from(
    new Map(
      subcategories.map((subcategory) => [subcategory.id, subcategory])
    ).values()
  );
};

export const createSubcategory = async (data) => {
  const response = await axios.post(SUBCATEGORY_ENDPOINT, data, requestConfig);
  return response.data;
};

export const updateSubcategory = async (id, data) => {
  const response = await axios.put(`${SUBCATEGORY_ENDPOINT}/${id}`, data, requestConfig);
  return response.data;
};

export const deleteSubcategory = async (id) => {
  const response = await axios.delete(`${SUBCATEGORY_ENDPOINT}/${id}`, requestConfig);
  return response.data;
};

export const mapCategoriesWithSubcategories = (categories, subcategories) => {
  const activeSubcategories = subcategories.filter(
    (subcategory) => subcategory.isActive === true
  );

  return categories
    .filter((category) => category.isActive === true)
    .map((category) => ({
      ...category,
      subcategories: activeSubcategories.filter(
        (subcategory) => subcategory.categoryId === category.id
      ),
    }));
};
