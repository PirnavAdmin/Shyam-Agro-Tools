// All Orders endpoints use /api/Orders (plural) as the base
const BASE_URL = 'https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Orders';

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
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.value)) return data.value;
  if (Array.isArray(data.$values)) return data.$values;
  if (Array.isArray(data.Value)) return data.Value;
  if (Array.isArray(data.items)) return data.items;
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

// POST /api/Orders/shipping/{id}/pack — mark order as packed (expects URL encoded form-data)
export const packOrder = async (id, payload) => {
  const body = toUrlEncoded({
    packerName: payload.packerName,
    packerPhotoUrl: payload.packerPhotoUrl || payload.packerImage || ''
  });
  const response = await fetch(`${BASE_URL}/shipping/${id}/pack`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body
  });
  if (!response.ok) throw new Error(`Failed to pack order ${id} (${response.status})`);
  return await response.json();
};

// POST /api/Orders/shipping/{id}/dispatch — mark order as dispatched (expects URL encoded form-data)
export const dispatchOrder = async (id, payload) => {
  const body = toUrlEncoded({
    shipperName: payload.shipperName || '',
    packagePhotoUrl: payload.packagePhotoUrl || payload.packageImage || '',
    carrierName: payload.carrierName || payload.logistics || '',
    trackingNumber: payload.trackingNumber || payload.trackingNo || ''
  });
  const response = await fetch(`${BASE_URL}/shipping/${id}/dispatch`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body
  });
  if (!response.ok) throw new Error(`Failed to dispatch order ${id} (${response.status})`);
  return await response.json();
};
