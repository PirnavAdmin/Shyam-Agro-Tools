import axios from '../api/axios';

export const CART_CHECKOUT_API_BASE_URL = (
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://wildlife-unwieldy-devotee.ngrok-free.dev'
).replace(/\/$/, '');

const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const getResponseItems = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const nestedData = data.data;
  if (Array.isArray(nestedData)) return nestedData;
  if (nestedData && typeof nestedData === 'object') return getResponseItems(nestedData);

  return data.items || data.cartItems || data.carts || data.value || data.results || [];
};

export const getCart = async () => {
  const response = await axios.get(`${CART_CHECKOUT_API_BASE_URL}/api/Cart`, requestConfig);
  return getResponseItems(response.data);
};

export const addCartItem = async (cartItem) => {
  const payload = {
    productId: Number(cartItem.productId),
    quantity: Number(cartItem.quantity),
  };

  if (
    !Number.isInteger(payload.productId) || payload.productId <= 0 ||
    !Number.isInteger(payload.quantity) || payload.quantity <= 0
  ) {
    throw new Error('Invalid cart item payload.');
  }

  const response = await axios.post(
    `${CART_CHECKOUT_API_BASE_URL}/api/Cart`,
    payload,
    requestConfig
  );
  return response.data;
};

export const updateCartItem = async (cartId, cartItem) => {
  const response = await axios.put(
    `${CART_CHECKOUT_API_BASE_URL}/api/Cart/${cartId}`,
    { quantity: Number(cartItem.quantity) },
    requestConfig
  );
  return response.data;
};

export const deleteCartItem = async (cartId) => {
  const response = await axios.delete(
    `${CART_CHECKOUT_API_BASE_URL}/api/Cart/${cartId}`,
    requestConfig
  );
  return response.data;
};

export const clearCartItems = async () => {
  const response = await axios.delete(
    `${CART_CHECKOUT_API_BASE_URL}/api/Cart/clear`,
    requestConfig
  );
  return response.data;
};

export const validateCartStock = async () => {
  const response = await axios.post(
    `${CART_CHECKOUT_API_BASE_URL}/api/Cart/validate-stock`,
    {},
    requestConfig
  );
  return response.data?.data ?? response.data;
};

export const getCheckoutSummary = async ({ couponCode = '', coinsToRedeem = 0 } = {}) => {
  const response = await axios.get(
    `${CART_CHECKOUT_API_BASE_URL}/api/Checkout/summary`,
    {
      ...requestConfig,
      params: {
        ...(couponCode.trim() && { couponCode: couponCode.trim() }),
        ...(Number(coinsToRedeem) > 0 && { coinsToRedeem: Number(coinsToRedeem) }),
      },
    }
  );
  const responseData = response.data?.data ?? response.data;
  const data = responseData && typeof responseData === 'object' ? responseData : {};
  return {
    ...data,
    cartItems: getResponseItems(data.cartItems),
    subTotal: Number(data.subTotal ?? 0),
    tax: Number(data.tax ?? 0),
    shippingCharges: Number(data.shippingCharges ?? 0),
    grandTotal: Number(data.grandTotal ?? 0),
    message: typeof responseData === 'string' ? responseData : data.message || '',
  };
};

export const placeOrderSuccess = async ({
  customerAddressId,
  paymentMethod,
  couponCode = '',
  coinsRedeemed = 0,
  paymentDetails = {},
}) => {
  const payload = {
    customerAddressId: Number(customerAddressId),
    paymentMethod,
    couponCode: couponCode || null,
    coinsRedeemed: Number(coinsRedeemed) || 0,
    ...paymentDetails,
  };

  if (!Number.isInteger(payload.customerAddressId) || payload.customerAddressId <= 0) {
    throw new Error('A valid customer address is required to place the order.');
  }

  if (!payload.paymentMethod) {
    throw new Error('A payment method is required to place the order.');
  }

  const response = await axios.post(
    `${CART_CHECKOUT_API_BASE_URL}/api/Checkout/place-order`,
    payload,
    requestConfig
  );

  return response.data?.data ?? response.data;
};
