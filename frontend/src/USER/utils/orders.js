export const ORDERS_STORAGE_KEY = 'Agro_orders';

export const orderStatusSteps = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const formatCurrency = (value) => `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;

const normalizeMobile = (value) => String(value || '').replace(/\D/g, '');

const getLoggedInMobile = () => {
  try {
    const session = JSON.parse(localStorage.getItem('authSession') || 'null');
    return normalizeMobile(session?.user?.phone || session?.user?.mobileNumber || session?.user?.MobileNumber);
  } catch {
    return '';
  }
};

const getOrderMobile = (order) => normalizeMobile(
  order?.customerMobile ||
  order?.mobileNumber ||
  order?.phone ||
  order?.billingDetails?.phone ||
  order?.shippingAddress?.phone ||
  order?.shippingAddress?.phoneNumber
);

const getAllStoredOrders = () => {
  try {
    const savedOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY));
    if (Array.isArray(savedOrders)) return savedOrders;
  } catch (error) {
    // Ignore malformed local data and fall back to the legacy single-order key.
  }

  try {
    const legacyOrder = JSON.parse(localStorage.getItem('lastPlacedOrder'));
    return legacyOrder?.id ? [legacyOrder] : [];
  } catch (error) {
    return [];
  }
};

export const getStatusIndex = (status = 'Order Placed') => {
  const index = orderStatusSteps.findIndex((step) => step.toLowerCase() === String(status).toLowerCase());
  return index >= 0 ? index : 0;
};

export const getOrders = (mobileNumber = getLoggedInMobile()) => {
  const normalizedMobile = normalizeMobile(mobileNumber);
  if (!normalizedMobile) return [];
  return getAllStoredOrders().filter((order) => getOrderMobile(order) === normalizedMobile);
};

export const saveOrder = (order) => {
  const orders = getAllStoredOrders();
  const nextOrders = [order, ...orders.filter((item) => item.id !== order.id)];
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
  localStorage.setItem('lastPlacedOrder', JSON.stringify(order));
  return nextOrders;
};

export const getOrderById = (orderId, mobileNumber = getLoggedInMobile()) => (
  getOrders(mobileNumber).find((order) => order.id === orderId) || null
);

export const getOrderTracking = (order) => {
  const status = order?.status || 'Order Placed';
  const activeIndex = getStatusIndex(status);
  const progressPercent = orderStatusSteps.length > 1
    ? (activeIndex / (orderStatusSteps.length - 1)) * 100
    : 0;

  return {
    status,
    activeIndex,
    progressPercent,
    steps: orderStatusSteps.map((label, index) => ({
      label,
      date: index <= activeIndex
        ? new Date(order?.createdAt || Date.now()).toLocaleDateString('en-IN')
        : '-',
      completed: index <= activeIndex,
      active: index === activeIndex,
    })),
  };
};
