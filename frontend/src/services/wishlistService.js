import axios from '../api/axios';

export const WISHLIST_API_URL = 'https://shyamagrotools.com/api/Wishlist';

const requestConfig = {
  headers: {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
};

const unwrap = (response) => response.data?.data ?? response.data;

const withUserPhone = (userPhone) => ({
  ...requestConfig,
  params: { userPhone },
});

export const getWishlist = async (userPhone) => unwrap(await axios.get(
  WISHLIST_API_URL,
  withUserPhone(userPhone)
));

export const addToWishlist = async (productId, userPhone) => unwrap(await axios.post(
  WISHLIST_API_URL,
  { productId: Number(productId), userPhone },
  requestConfig
));

export const removeFromWishlist = async (productId, userPhone) => unwrap(await axios.delete(
  `${WISHLIST_API_URL}/${Number(productId)}`,
  withUserPhone(userPhone)
));

export const clearWishlist = async (userPhone) => unwrap(await axios.delete(
  `${WISHLIST_API_URL}/clear`,
  withUserPhone(userPhone)
));

export const checkWishlist = async (productId, userPhone) => unwrap(await axios.get(
  `${WISHLIST_API_URL}/check/${Number(productId)}`,
  withUserPhone(userPhone)
));
