import axios from '../api/axios';
import { CART_CHECKOUT_API_BASE_URL } from './cartCheckoutService';

const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

let addressesRequest;

const getResponseData = (data) => data?.data ?? data;

const getResponseItems = (data) => {
  const responseData = getResponseData(data);
  if (Array.isArray(responseData)) return responseData;
  return responseData?.items || responseData?.addresses || responseData?.value || [];
};

export const getAddresses = async () => {
  if (!addressesRequest) {
    addressesRequest = axios.get(
      `${CART_CHECKOUT_API_BASE_URL}/api/CustomerAddress`,
      requestConfig
    ).finally(() => {
      addressesRequest = null;
    });
  }
  const response = await addressesRequest;
  return getResponseItems(response.data);
};

export const getAddressById = async (addressId) => {
  const response = await axios.get(
    `${CART_CHECKOUT_API_BASE_URL}/api/CustomerAddress/${addressId}`,
    requestConfig
  );
  return getResponseData(response.data);
};

export const createAddress = async (address) => {
  const response = await axios.post(
    `${CART_CHECKOUT_API_BASE_URL}/api/CustomerAddress`,
    address,
    requestConfig
  );
  return getResponseData(response.data);
};

export const updateAddress = async (addressId, address) => {
  const response = await axios.put(
    `${CART_CHECKOUT_API_BASE_URL}/api/CustomerAddress/${addressId}`,
    address,
    requestConfig
  );
  return getResponseData(response.data);
};

export const deleteAddress = async (addressId) => {
  const response = await axios.delete(
    `${CART_CHECKOUT_API_BASE_URL}/api/CustomerAddress/${addressId}`,
    requestConfig
  );
  return getResponseData(response.data);
};
