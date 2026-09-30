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
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'delivered') {
    return 5; // Delivered
  }
  if (s === 'out for delivery') {
    return 4; // Out for Delivery
  }
  if (s === 'shipped' || s === 'dispatched') {
    return 3; // Shipped
  }
  if (s === 'packed') {
    return 2; // Packed
  }
  if (s === 'confirmed' || s === 'processing' || s === 'processed') {
    return 1; // Confirmed
  }
  return 0; // Order Placed
};

export const getOrders = (mobileNumber = getLoggedInMobile()) => {
  const normalizedMobile = normalizeMobile(mobileNumber);
  if (!normalizedMobile) return [];
  const allStored = getAllStoredOrders();
  return allStored.filter((order) => {
    const orderMob = getOrderMobile(order);
    return orderMob === normalizedMobile;
  });
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

const formatDateToSlash = (value) => {
  if (!value) return '-';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [_, y, m, d] = match;
      return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    }
    if (value.includes('/')) {
      return value;
    }
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export const getOrderTracking = (order, trackingDetails = null) => {
  const currentStatus = trackingDetails?.currentStatus || trackingDetails?.CurrentStatus || order?.status || 'Order Placed';
  const activeIndex = getStatusIndex(currentStatus);
  const progressPercent = orderStatusSteps.length > 1
    ? (activeIndex / (orderStatusSteps.length - 1)) * 100
    : 0;

  const logs = trackingDetails?.timelineLogs || trackingDetails?.TimelineLogs || [];
  const logsByStatus = new Map();
  logs.forEach((log) => {
    if (log?.status) {
      logsByStatus.set(String(log.status).toLowerCase(), log);
    }
  });

  return {
    status: currentStatus,
    activeIndex,
    progressPercent,
    steps: orderStatusSteps.map((label, index) => {
      let dateValue = '-';
      const matchingLog = logsByStatus.get(label.toLowerCase());

      if (matchingLog) {
        const rawDate = matchingLog.date || matchingLog.createdAt;
        dateValue = formatDateToSlash(rawDate);
      } else if (index <= activeIndex) {
        const baseDate = new Date(order?.createdAt || order?.createdDate || order?.orderDate || order?.OrderDate || Date.now());
        if (index > 0) {
          baseDate.setDate(baseDate.getDate() + index);
        }
        dateValue = formatDateToSlash(baseDate);
      }

      return {
        label,
        date: dateValue,
        completed: index <= activeIndex,
        active: index === activeIndex,
      };
    }),
  };
};
