import { getApiDomain } from '../../utils/apiConfig';
// All Orders endpoints use /api/Orders (plural) as the base
const BASE_URL = `${getApiDomain()}/api/Orders`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// Helper to convert an object to url-encoded query string
const toUrlEncoded = (obj) => {
  return Object.entries(obj)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
};

// Helper to extract array from dynamic API response structure
const unwrapArray = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.Orders)) return data.Orders;
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.value)) return data.value;
  if (Array.isArray(data.$values)) return data.$values;
  if (Array.isArray(data.Value)) return data.Value;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.Items)) return data.Items;
  return [];
};

// GET /api/Orders  — fetch all orders
export const getOrders = async () => {
  const response = await fetch(BASE_URL, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch orders (${response.status})`);
  const data = await response.json();
  return unwrapArray(data);
};

// GET /api/Orders/{id}  — fetch single order
export const getOrder = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch order ${id} (${response.status})`);
  return await response.json();
};

// POST /api/Orders  — create new order
export const createOrder = async (payload) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Failed to create order (${response.status})`);
  return await response.json();
};

// PUT /api/Orders/{id}/status  — update order status (returns 204 NoContent)
export const updateOrderStatus = async (id, status) => {
  const response = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PUT',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `status=${encodeURIComponent(status)}`,
  });
  if (!response.ok) throw new Error(`Failed to update status for order ${id} (${response.status})`);
  return { success: true };
};

// Custom: Update Payment Status
export const updateOrderPaymentStatus = async (id, paymentStatus, paidAmount) => {
  const response = await fetch(`${BASE_URL}/${id}/payment-status`, {
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ paymentStatus, paidAmount }),
  });
  if (!response.ok) throw new Error(`Failed to update payment status for order ${id}`);
  return { success: true };
};

// DELETE /api/Orders/{id}  — cancel/delete order (returns 204 NoContent)
export const deleteOrder = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) throw new Error(`Failed to delete order ${id} (${response.status})`);
  return { success: true };
};

// GET /api/Orders/tracking — fetch all tracking orders
export const getOrdersTracking = async () => {
  const response = await fetch(`${BASE_URL}/tracking`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch tracking orders (${response.status})`);
  const data = await response.json();
  return unwrapArray(data);
};

// GET /api/Orders/tracking/{id} — fetch tracking detail for single order
export const getOrderTracking = async (id) => {
  const response = await fetch(`${BASE_URL}/tracking/${id}`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch tracking for order ${id} (${response.status})`);
  return await response.json();
};

// POST /api/Orders/tracking/{id} — post tracking update (expects JSON)
export const postOrderTracking = async (id, payload) => {
  const response = await fetch(`${BASE_URL}/tracking/${id}`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Failed to post tracking for order ${id} (${response.status})`);
  return await response.json();
};

// GET /api/Orders/shipping — fetch all shipping orders
export const getOrdersShipping = async () => {
  const response = await fetch(`${BASE_URL}/shipping`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch shipping orders (${response.status})`);
  const data = await response.json();
  return unwrapArray(data);
};

// GET /api/Orders/shipping/{id} — fetch shipping details for single order
export const getOrderShipping = async (id) => {
  const response = await fetch(`${BASE_URL}/shipping/${id}`, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch shipping for order ${id} (${response.status})`);
  return await response.json();
};

// Helper to append image (Base64 data URL, File, or URL string) to FormData
const appendImageToFormData = (formData, fieldName, fileFieldName, photoValue, defaultFileName) => {
  if (!photoValue) return;
  if (typeof photoValue === 'string' && photoValue.startsWith('data:')) {
    try {
      const arr = photoValue.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      formData.append(fileFieldName, blob, defaultFileName);
    } catch (e) {
      formData.append(fieldName, photoValue);
    }
  } else if (typeof photoValue === 'object' && photoValue instanceof File) {
    formData.append(fileFieldName, photoValue, photoValue.name);
  } else {
    formData.append(fieldName, photoValue);
  }
};

// POST /api/Orders/shipping/{id}/pack — mark order as packed
export const packOrder = async (id, payload) => {
  const formData = new FormData();
  formData.append('packerName', payload.packerName || '');
  appendImageToFormData(formData, 'packerPhotoUrl', 'packerPhoto', payload.packerPhotoUrl || payload.packerImage, `packer_${id}.png`);

  const token = localStorage.getItem('adminToken');
  const headers = { 'ngrok-skip-browser-warning': 'true' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/shipping/${id}/pack`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Failed to pack order ${id} (${response.status})`);
  }
  return await response.json();
};

// POST /api/Orders/shipping/{id}/dispatch — mark order as dispatched
export const dispatchOrder = async (id, payload) => {
  const formData = new FormData();
  formData.append('shipperName', payload.shipperName || '');
  formData.append('carrierName', payload.carrierName || payload.logistics || '');
  formData.append('trackingNumber', payload.trackingNumber || payload.trackingNo || '');
  appendImageToFormData(formData, 'packagePhotoUrl', 'packagePhoto', payload.packagePhotoUrl || payload.packageImage, `package_${id}.png`);

  const token = localStorage.getItem('adminToken');
  const headers = { 'ngrok-skip-browser-warning': 'true' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/shipping/${id}/dispatch`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Failed to dispatch order ${id} (${response.status})`);
  }
  return await response.json();
};
