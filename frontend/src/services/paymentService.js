import axios from '../api/axios';

export const PAYMENT_API_BASE_URL = (
  process.env.REACT_APP_PAYMENT_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');

const paymentRequestConfig = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
};

const unwrapPaymentResponse = (response) => {
  const data = response?.data?.data ?? response?.data;
  if (data?.success === false) {
    const error = new Error(data.message || 'The payment request was unsuccessful.');
    error.response = response;
    throw error;
  }
  return data;
};

const getPaymentErrorMessage = (error) => {
  const data = error?.response?.data;
  const validationMessage = data?.errors
    ? Object.values(data.errors).flat().find(Boolean)
    : '';
  return (
    data?.message ||
    data?.data?.message ||
    validationMessage ||
    data?.title ||
    data?.error ||
    error?.message
  );
};

const postPayment = async (url, payload) => {
  try {
    const response = await axios.post(`${PAYMENT_API_BASE_URL}${url}`, payload, paymentRequestConfig);
    return unwrapPaymentResponse(response);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('The payment request timed out. Please try again.');
    }
    if (!error.response && error.message === 'Network Error') {
      throw new Error('Unable to reach the payment server. Check your connection and try again.');
    }
    const message = getPaymentErrorMessage(error);
    if (message && message !== error.message) {
      const paymentError = new Error(message);
      paymentError.response = error.response;
      throw paymentError;
    }
    throw error;
  }
};

const getPayment = async (url, config = {}) => {
  try {
    const response = await axios.get(`${PAYMENT_API_BASE_URL}${url}`, {
      ...paymentRequestConfig,
      ...config,
      headers: {
        ...paymentRequestConfig.headers,
        ...(config.headers || {}),
      },
    });
    return unwrapPaymentResponse(response);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('The payment request timed out. Please try again.');
    }
    if (!error.response && error.message === 'Network Error') {
      throw new Error('Unable to reach the payment server. Check your connection and try again.');
    }
    const message = getPaymentErrorMessage(error);
    if (message && message !== error.message) {
      const paymentError = new Error(message);
      paymentError.response = error.response;
      throw paymentError;
    }
    throw error;
  }
};

export const buildPaymentAssetUrl = (url = '') => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${PAYMENT_API_BASE_URL}/${value.replace(/^\/+/, '')}`;
};

export const initiatePayment = async (payment) => postPayment('/api/Payment/initiate', payment);

const requireTransactionId = (transactionId) => {
  const value = String(transactionId || '').trim();
  if (!value) throw new Error('A valid payment transaction ID is required.');
  return value;
};

export const netBankingLogin = async ({ transactionId, username, password }) =>
  postPayment('/api/Payment/netbanking/login', {
    transactionId: requireTransactionId(transactionId),
    username,
    password,
  });

export const verifyNetBankingOtp = async ({ transactionId, otp }) =>
  postPayment('/api/Payment/netbanking/verify-otp', {
    transactionId: requireTransactionId(transactionId),
    otp,
  });

export const getPaymentStatus = async (transactionId) => {
  const normalizedTransactionId = requireTransactionId(transactionId);
  try {
    return await getPayment(`/api/Payment/status/${encodeURIComponent(normalizedTransactionId)}`);
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    return getPayment('/api/Payment/status', {
      params: { transactionId: normalizedTransactionId },
    });
  }
};

export const getPaymentUpiDetails = async () => getPayment('/api/Payment/upi-details');

export const getPaymentBankDetails = async () => getPayment('/api/Payment/bank-details');

export const getPaymentQrConfig = async () => getPayment('/api/Payment/qr-config');

export const getPaymentQrCode = async () => getPayment('/api/Payment/qr-code');

export const getManualPaymentVerifications = async () => {
  const data = await getPayment('/api/Payment/manual-verifications');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.verifications)) return data.verifications;
  if (Array.isArray(data?.manualVerifications)) return data.manualVerifications;
  return [];
};

export const getPaymentQr = async ({ orderId, amount }) => {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) throw new Error('A valid order ID is required to generate the payment QR.');

  try {
    return await getPayment(`/api/Payment/qr/${encodeURIComponent(normalizedOrderId)}`, {
      params: Number.isFinite(Number(amount)) ? { amount: Number(amount) } : undefined,
    });
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    try {
      return await getPayment('/api/Payment/qr', {
        params: {
          orderId: normalizedOrderId,
          ...(Number.isFinite(Number(amount)) && { amount: Number(amount) }),
        },
      });
    } catch (fallbackError) {
      if (fallbackError?.response?.status !== 404) throw fallbackError;
      return getPaymentQrCode();
    }
  }
};

export const watchPaymentStatus = (transactionId, onStatus, onError, interval = 2000) => {
  const normalizedTransactionId = requireTransactionId(transactionId);
  let stopped = false;
  let timerId;

  const poll = async () => {
    try {
      const result = await getPaymentStatus(normalizedTransactionId);
      if (stopped) return;
      onStatus?.(result);
      const status = String(result?.status || result?.paymentStatus || '').toUpperCase();
      if (['SUCCESS', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
        stopped = true;
        return;
      }
    } catch (error) {
      if (!stopped) onError?.(error);
    }
    if (!stopped) timerId = window.setTimeout(poll, interval);
  };

  poll();
  return () => {
    stopped = true;
    if (timerId) window.clearTimeout(timerId);
  };
};

export const completePayment = async ({ transactionId }) =>
  postPayment('/api/Payment/complete', { transactionId: requireTransactionId(transactionId) });

export const submitManualPaymentVerification = async ({
  orderId,
  utrNumber,
  amountPaid,
  paymentDate,
  paymentTime,
  customerName,
  mobileNumber,
  remarks,
  screenshot,
}) => {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) throw new Error('A valid order ID is required.');

  const formData = new FormData();
  formData.append('OrderId', normalizedOrderId);
  formData.append('UtrNumber', String(utrNumber || '').trim());
  formData.append('AmountPaid', String(Number(amountPaid)));
  formData.append('PaymentDate', paymentDate || '');
  formData.append('PaymentTime', paymentTime || '');
  formData.append('CustomerName', String(customerName || '').trim());
  formData.append('MobileNumber', String(mobileNumber || '').trim());
  formData.append('Remarks', String(remarks || '').trim());
  if (screenshot) formData.append('Screenshot', screenshot, screenshot.name);

  try {
    const response = await axios.post(
      `${PAYMENT_API_BASE_URL}/api/Payment/verify-manual`,
      formData,
      {
        timeout: paymentRequestConfig.timeout,
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );
    return unwrapPaymentResponse(response);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('The verification request timed out. Please try again.');
    }
    if (!error.response && error.message === 'Network Error') {
      throw new Error('Unable to reach the payment server. Check your connection and try again.');
    }
    const message = getPaymentErrorMessage(error);
    if (message && message !== error.message) {
      const verificationError = new Error(message);
      verificationError.response = error.response;
      throw verificationError;
    }
    throw error;
  }
};
