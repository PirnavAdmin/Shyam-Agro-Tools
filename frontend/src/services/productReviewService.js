import axios from '../api/axios';
import { PRODUCT_API_BASE_URL } from './productService';

const REVIEW_ENDPOINT = `${PRODUCT_API_BASE_URL}/api/reviews`;
const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

export const normalizeReview = (review = {}) => ({
  ...review,
  id: review.id,
  productId: review.productId,
  userName: review.customerName || review.userName || review.name || '',
  customerName: review.customerName || review.userName || review.name || '',
  rating: Number(review.rating || 0),
  comment: review.reviewComment || review.comment || review.message || '',
  reviewComment: review.reviewComment || review.comment || review.message || '',
  date: review.reviewDate || review.date || '',
  reviewDate: review.reviewDate || review.date || new Date().toISOString(),
  verified: Boolean(review.verifiedPurchase ?? review.verified),
  verifiedPurchase: Boolean(review.verifiedPurchase ?? review.verified),
});

export const createProductReview = async (data) => {
  const response = await axios.post(REVIEW_ENDPOINT, data, requestConfig);
  return normalizeReview(response.data);
};

export const getProductReviews = async (productId) => {
  const response = await axios.get(`${REVIEW_ENDPOINT}/${productId}`, requestConfig);
  if (!Array.isArray(response.data)) throw new Error('Invalid Product Reviews API response');
  return response.data.map(normalizeReview);
};

export const deleteProductReview = async (id) => {
  const response = await axios.delete(`${REVIEW_ENDPOINT}/${id}`, requestConfig);
  return response.data;
};
