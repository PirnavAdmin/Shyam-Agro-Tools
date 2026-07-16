import axios from '../api/axios';
import { ORDER_API_BASE_URL } from './orderService';

const getRequestConfig = () => {
  return {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      Accept: 'application/json',
    },
  };
};

export const getReturnsConfig = async () => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Returns/config`, getRequestConfig());
  return response.data;
};

export const checkEligibility = async (orderItemId) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Returns/eligibility/order-item/${orderItemId}`, getRequestConfig());
  return response.data;
};

export const submitReturnRequest = async (formData) => {
  const response = await axios.post(`${ORDER_API_BASE_URL}/api/Returns`, formData, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });
  return response.data;
};

export const getMyReturns = async ({ page = 1, pageSize = 20, status = '', requestType = '' } = {}) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Returns/my`, {
    ...getRequestConfig(),
    params: { page, pageSize, status, requestType },
  });
  return response.data;
};

export const getReturnById = async (id) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Returns/${id}`, getRequestConfig());
  return response.data;
};

export const getReturnByOrderId = async (orderId) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Returns/order/${orderId}`, getRequestConfig());
  return response.data;
};

export const getReturnByOrderItemId = async (orderItemId) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Returns/order-item/${orderItemId}`, getRequestConfig());
  return response.data;
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

export const getAdminReturns = async (params = {}) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/ReturnsAdmin/admin`, {
    ...getAdminRequestConfig(),
    params,
  });
  return response.data;
};

export const updateReturnStatus = async (id, statusData) => {
  const response = await axios.put(`${ORDER_API_BASE_URL}/api/ReturnsAdmin/${id}/status`, statusData, getAdminRequestConfig());
  return response.data;
};

export const updateReturnPickup = async (id, pickupData) => {
  const response = await axios.put(`${ORDER_API_BASE_URL}/api/ReturnsAdmin/${id}/pickup`, pickupData, getAdminRequestConfig());
  return response.data;
};

export const updateReturnRefund = async (id, refundData) => {
  const response = await axios.put(`${ORDER_API_BASE_URL}/api/ReturnsAdmin/${id}/refund`, refundData, getAdminRequestConfig());
  return response.data;
};

export const updateReturnReplacement = async (id, replacementData) => {
  const response = await axios.put(`${ORDER_API_BASE_URL}/api/ReturnsAdmin/${id}/replacement`, replacementData, getAdminRequestConfig());
  return response.data;
};
