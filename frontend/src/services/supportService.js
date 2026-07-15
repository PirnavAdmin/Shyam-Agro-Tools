import apiClient from '../api/axios';

export const SUPPORT_API_BASE_URL = (
  process.env.REACT_APP_SUPPORT_API_BASE_URL ||
  process.env.REACT_APP_AUTH_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');

const supportRequestConfig = {
  skipAuth: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

const unwrapData = (data) => data?.data || data?.result || data || {};

const getSupportErrorMessage = (error, fallback) => (
  error?.response?.data?.message ||
  error?.response?.data?.title ||
  error?.response?.data?.error ||
  error?.message ||
  fallback
);

export const getSupportConfig = async () => {
  try {
    const response = await apiClient.get(`${SUPPORT_API_BASE_URL}/api/Support/config`, supportRequestConfig);
    return unwrapData(response.data);
  } catch {
    return {};
  }
};

export const sendSupportBotMessage = async (message) => {
  try {
    const response = await apiClient.post(
      `${SUPPORT_API_BASE_URL}/api/Support/bot/chat`,
      { message },
      supportRequestConfig
    );
    const data = unwrapData(response.data);
    return data.reply || data.response || data.message || '';
  } catch {
    return '';
  }
};

export const submitSupportTicket = async (ticket) => {
  const subjectParts = [
    ticket.issueType,
    ticket.orderId ? `Order ${ticket.orderId}` : '',
  ].filter(Boolean);

  const payload = {
    name: String(ticket.name || '').trim(),
    email: String(ticket.email || '').trim(),
    phone: String(ticket.phone || '').trim(),
    subject: subjectParts.join(' - ') || 'General support',
    message: [
      ticket.orderId ? `Order ID: ${ticket.orderId}` : '',
      ticket.message,
    ].filter(Boolean).join('\n\n'),
  };

  try {
    const response = await apiClient.post(`${SUPPORT_API_BASE_URL}/api/Support/ticket`, payload, supportRequestConfig);
    return unwrapData(response.data);
  } catch (error) {
    throw new Error(getSupportErrorMessage(error, 'Unable to submit support ticket.'));
  }
};
