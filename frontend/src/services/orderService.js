import axios from '../api/axios';
import { CART_CHECKOUT_API_BASE_URL } from './cartCheckoutService';
import { getToken } from '../utils/auth';

export const ORDER_API_BASE_URL = (
  process.env.REACT_APP_ORDER_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');

const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const getAuthenticatedRequestConfig = () => {
  if (!getToken()) {
    const error = new Error('Authentication is required to load user orders.');
    error.response = { status: 401 };
    throw error;
  }

  return requestConfig;
};

const unwrapResponse = (data) => data?.data ?? data;

const getResponseItems = (data) => {
  const value = unwrapResponse(data);
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.value)) return value.value;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.orders)) return value.orders;
  if (Array.isArray(value.results)) return value.results;
  return [];
};

const buildAssetUrl = (url = '') => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${CART_CHECKOUT_API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

const splitAddress = (address = '') => {
  const parts = String(address || '').split(',').map((part) => part.trim()).filter(Boolean);
  return {
    address: parts[0] || address || '',
    city: parts[1] || '',
    state: parts[2] || '',
    zip: parts[3] || '',
  };
};

export const normalizeBackendOrder = (order = {}) => {
  const orderId = String(order.orderNumber || order.OrderNumber || order.id || order.Id || '');
  const shippingAddress = typeof order.shippingAddress === 'string'
    ? splitAddress(order.shippingAddress)
    : (order.shippingAddress || order.ShippingAddress || {});
  const total = Number(order.finalAmount ?? order.FinalAmount ?? order.total ?? order.Total ?? order.totalAmount ?? 0);

  return {
    id: orderId,
    backendId: order.id ?? order.Id ?? '',
    customerId: order.customerId ?? order.CustomerId ?? '',
    items: (order.items || order.Items || []).map((item) => ({
      id: String(item.productId ?? item.ProductId ?? item.id ?? item.Id ?? ''),
      orderItemId: String(item.id ?? item.Id ?? item.productId ?? item.ProductId ?? ''),
      sku: item.productCode || item.ProductCode || '',
      name: item.productName || item.ProductName || item.name || '',
      categoryName: item.categoryName || item.CategoryName || '',
      image: buildAssetUrl(item.imageUrl || item.ImageUrl || ''),
      quantity: Number(item.quantity ?? item.Quantity ?? 0),
      price: Number(item.price ?? item.Price ?? 0),
      total: Number(item.subtotal ?? item.Subtotal ?? 0),
    })),
    subtotal: Number(order.totalAmount ?? order.TotalAmount ?? 0),
    gst: Number(order.gstAmount ?? order.GstAmount ?? 0),
    totalGst: Number(order.gstAmount ?? order.GstAmount ?? 0),
    deliveryCharge: Number(order.shippingFee ?? order.ShippingFee ?? 0),
    discount: Number(order.discountAmount ?? order.DiscountAmount ?? 0),
    total,
    paymentMethod: order.paymentMethod || order.PaymentMethod || '',
    paymentStatus: order.paymentStatus || order.PaymentStatus || '',
    status: order.status || order.Status || 'Order Placed',
    trackingNumber: order.trackingNumber || order.TrackingNumber || '',
    carrierName: order.carrierName || order.CarrierName || '',
    shippingAddress,
    billingDetails: {
      name: order.customerName || order.CustomerName || '',
      email: order.customerEmail || order.CustomerEmail || '',
      phone: order.customerPhone || order.CustomerPhone || '',
    },
    createdAt: order.orderDate || order.OrderDate || order.createdAt || order.CreatedAt || new Date().toISOString(),
    raw: order,
  };
};

export const getOrdersFromApi = async ({ status = '', search = '' } = {}) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Orders/`, {
    ...requestConfig,
    params: {
      ...(status && { status }),
      ...(search && { search }),
    },
  });
  return getResponseItems(response.data).map(normalizeBackendOrder).filter((order) => order.id);
};

export const getCurrentUserOrdersFromApi = async () => {
  const response = await axios.get(
    `${ORDER_API_BASE_URL}/api/Orders/my-orders`,
    getAuthenticatedRequestConfig()
  );
  return getResponseItems(response.data).map(normalizeBackendOrder).filter((order) => order.id);
};

export const getSuccessfulOrdersFromApi = async (search = 'success') =>
  getOrdersFromApi({ status: 'success', search });

export const getOrderSuccessDetails = async (orderId) => {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) return null;

  try {
    const response = await axios.get(`${ORDER_API_BASE_URL}/api/OrderSuccess`, {
      ...requestConfig,
      params: { orderId: normalizedOrderId },
    });
    return unwrapResponse(response.data);
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    return null;
  }
};

export const getOrderSuccessTracking = async (orderId) => {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) return null;

  try {
    const response = await axios.get(`${ORDER_API_BASE_URL}/api/OrderSuccess/track`, {
      ...requestConfig,
      params: { orderId: normalizedOrderId },
    });
    return unwrapResponse(response.data);
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    return null;
  }
};

const getAdminRequestConfig = () => {
  const adminToken = localStorage.getItem('adminToken');
  return {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      Accept: 'application/json',
      ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
    },
  };
};

export const getOrdersTracking = async (search = '') => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Orders/tracking`, {
    ...getAdminRequestConfig(),
    params: { search },
  });
  return response.data;
};

export const getOrderTrackingById = async (id) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Orders/tracking/${id}`, getAdminRequestConfig());
  return response.data;
};

export const updateOrderTracking = async (id, status, notes) => {
  const response = await axios.post(
    `${ORDER_API_BASE_URL}/api/Orders/tracking/${id}`,
    { status, notes },
    {
      ...getAdminRequestConfig(),
      headers: {
        ...getAdminRequestConfig().headers,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const getOrdersShipping = async (search = '') => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Orders/shipping`, {
    ...getAdminRequestConfig(),
    params: { search },
  });
  return response.data;
};

export const getOrderShippingById = async (id) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Orders/shipping/${id}`, getAdminRequestConfig());
  return response.data;
};

export const packOrder = async (id, formData) => {
  const response = await axios.post(`${ORDER_API_BASE_URL}/api/Orders/shipping/${id}/pack`, formData, {
    ...getAdminRequestConfig(),
    headers: {
      ...getAdminRequestConfig().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const dispatchOrder = async (id, formData) => {
  const response = await axios.post(`${ORDER_API_BASE_URL}/api/Orders/shipping/${id}/dispatch`, formData, {
    ...getAdminRequestConfig(),
    headers: {
      ...getAdminRequestConfig().headers,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

