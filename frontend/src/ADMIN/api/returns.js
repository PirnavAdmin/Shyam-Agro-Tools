import { getApiDomain } from '../../utils/apiConfig';
const BASE_URL = `${getApiDomain()}/api/Returns`;
const ADMIN_BASE_URL = `${getApiDomain()}/api/ReturnsAdmin`;

const DEFAULT_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

const MOCK_RETURNS = [
  {
    id: 1,
    orderId: 10214,
    orderItemId: 1,
    productName: 'Premium Organic Fertilizer',
    sku: 'FERT-001',
    requestType: 'Refund',
    reasonCode: 'Damaged Product',
    description: 'The fertilizer packaging was torn upon delivery, and about half of the product spilled out inside the shipping box.',
    requestedQuantity: 1,
    refundMethod: 'Wallet',
    pickupAddressId: 101,
    evidenceFiles: [],
    status: 'Pending',
    createdAt: '2026-07-11T14:30:00.000Z',
    pickupDetails: null,
    refundDetails: null,
    replacementDetails: null,
    customerName: 'Rajesh Kumar',
    unitPrice: 7250
  },
  {
    id: 2,
    orderId: 10215,
    orderItemId: 2,
    productName: 'Heavy Duty Hand Weeder',
    sku: 'TOOL-05',
    requestType: 'Replacement',
    reasonCode: 'Defective / Faulty',
    description: 'The wooden handle is cracked near the joint, making it unsafe to apply pressure during weeding.',
    requestedQuantity: 1,
    refundMethod: 'Wallet',
    pickupAddressId: 102,
    evidenceFiles: [],
    status: 'Approved',
    createdAt: '2026-07-12T09:15:00.000Z',
    pickupDetails: {
      pickupDate: '2026-07-14T10:00:00.000Z',
      pickupAgentName: 'Vikram Singh',
      pickupAgentPhone: '9898989898',
      pickupTrackingNumber: 'PUP-SAT-99218',
      remarks: 'Agent assigned. Pickup scheduled between 10 AM and 2 PM.'
    },
    refundDetails: null,
    replacementDetails: null,
    customerName: 'Amit Patel',
    unitPrice: 1700
  }
];

const getLocalReturns = () => {
  const local = localStorage.getItem('shyam_agro_returns');
  if (!local) {
    localStorage.setItem('shyam_agro_returns', JSON.stringify(MOCK_RETURNS));
    return MOCK_RETURNS;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return MOCK_RETURNS;
  }
};

const saveLocalReturns = (data) => {
  localStorage.setItem('shyam_agro_returns', JSON.stringify(data));
};

// GET /api/Returns/config
export const getReturnsConfig = async () => {
  try {
    const response = await fetch(`${BASE_URL}/config`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch returns config');
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, using mock returns config:', error.message);
    return {
      returnWindowDays: 15,
      allowableRefundMethods: ['Wallet', 'Original Payment Method', 'Bank Transfer'],
      reasonCodes: [
        { code: 'DAMAGED', label: 'Damaged Product' },
        { code: 'DEFECTIVE', label: 'Defective / Faulty' },
        { code: 'WRONG_ITEM', label: 'Incorrect / Wrong Item Delivered' },
        { code: 'QTY_MISMATCH', label: 'Missing / Short Quantity' },
        { code: 'QUALITY_POOR', label: 'Quality Not as Expected' }
      ],
      requestTypes: [
        { code: 'Refund', label: 'Return & Refund' },
        { code: 'Replacement', label: 'Product Replacement' }
      ]
    };
  }
};

// GET /api/Returns/eligibility/order-item/{orderItemId}
export const checkReturnEligibility = async (orderItemId) => {
  try {
    const response = await fetch(`${BASE_URL}/eligibility/order-item/${orderItemId}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error('Eligibility check failed');
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, simulating return eligibility:', error.message);
    
    // Fallback simulation: fetch local orders to find matching item
    const localOrdersStr = localStorage.getItem('shyam_agro_orders');
    if (localOrdersStr) {
      try {
        const orders = JSON.parse(localOrdersStr);
        for (const order of orders) {
          const itemIdx = order.items.findIndex((_, index) => (index + 1) === Number(orderItemId) || orderItemId === `${order.id}-${index + 1}`);
          if (itemIdx !== -1 || orderItemId.toString().length < 5) {
            // Found item or simulating small input
            return {
              eligible: true,
              maxQuantity: 2,
              orderId: order.id || 10214,
              orderItemId: orderItemId,
              reason: 'Eligible for return within the 15-day window.',
              productName: order.items[0]?.name || 'Agro Product',
              sku: order.items[0]?.sku || 'AGRO-001',
              unitPrice: order.items[0]?.unitPrice || 1000
            };
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default mock response if orders not found
    return {
      eligible: true,
      maxQuantity: 2,
      orderId: 10214,
      orderItemId: orderItemId,
      reason: 'Eligible for return within the 15-day window.',
      productName: 'Premium Organic Fertilizer',
      sku: 'FERT-001',
      unitPrice: 7250
    };
  }
};

// POST /api/Returns
export const createReturnRequest = async (formData) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData // Form data with file attachments
    });
    if (!response.ok) throw new Error('Failed to create return request');
    return await response.json();
  } catch (error) {
    console.warn('Backend unavailable, creating return request in local storage:', error.message);
    
    // Convert FormData to local object
    const orderId = Number(formData.get('OrderId') || 10214);
    const orderItemId = Number(formData.get('OrderItemId') || 1);
    const requestType = formData.get('RequestType') || 'Refund';
    const reasonCode = formData.get('ReasonCode') || 'Damaged Product';
    const description = formData.get('Description') || '';
    const requestedQuantity = Number(formData.get('RequestedQuantity') || 1);
    const refundMethod = formData.get('RefundMethod') || 'Wallet';
    const pickupAddressId = Number(formData.get('PickupAddressId') || 101);
    
    const localReturns = getLocalReturns();
    const newId = localReturns.length > 0 ? Math.max(...localReturns.map(r => r.id)) + 1 : 1;
    
    // Get item names from local orders to make UI complete
    let productName = 'Agro Item';
    let sku = 'AGRO-001';
    let customerName = 'Rajesh Kumar';
    let unitPrice = 1000;
    
    const localOrdersStr = localStorage.getItem('shyam_agro_orders');
    if (localOrdersStr) {
      try {
        const orders = JSON.parse(localOrdersStr);
        const order = orders.find(o => Number(o.id) === orderId || o.id === `ORD${orderId}`);
        if (order) {
          productName = order.items[0]?.name || productName;
          sku = order.items[0]?.sku || sku;
          customerName = order.customerName || customerName;
          unitPrice = order.items[0]?.unitPrice || unitPrice;
        }
      } catch (e) {}
    }

    const newReturn = {
      id: newId,
      orderId,
      orderItemId,
      productName,
      sku,
      requestType,
      reasonCode,
      description,
      requestedQuantity,
      refundMethod,
      pickupAddressId,
      evidenceFiles: [], // Simulation cannot save actual Files directly easily
      status: 'Pending',
      createdAt: new Date().toISOString(),
      pickupDetails: null,
      refundDetails: null,
      replacementDetails: null,
      customerName,
      unitPrice
    };

    localReturns.unshift(newReturn);
    saveLocalReturns(localReturns);
    return newReturn;
  }
};

// GET /api/Returns/my
export const getMyReturns = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/my?${query}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch returns');
    const data = await response.json();
    return {
      returns: data.returns || data.items || data.Returns || data.Items || [],
      totalCount: data.totalCount ?? data.TotalCount ?? 0,
      page: data.page ?? data.Page ?? 1,
      pageSize: data.pageSize ?? data.PageSize ?? 20
    };
  } catch (error) {
    console.warn('Backend unavailable, loading customer returns from local storage:', error.message);
    let list = getLocalReturns();
    
    if (params.status) {
      list = list.filter(r => r.status.toLowerCase() === params.status.toLowerCase());
    }
    if (params.requestType) {
      list = list.filter(r => r.requestType.toLowerCase() === params.requestType.toLowerCase());
    }
    
    return {
      returns: list,
      totalCount: list.length,
      page: params.page || 1,
      pageSize: params.pageSize || 20
    };
  }
};

// GET /api/Returns/{id}
export const getReturnById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return details for ID ${id}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend unavailable, reading return details for ID ${id} locally:`, error.message);
    const list = getLocalReturns();
    const found = list.find(r => r.id === Number(id));
    if (!found) throw new Error(`Return with ID ${id} not found.`);
    return found;
  }
};

// GET /api/Returns/order/{orderId}
export const getReturnByOrderId = async (orderId) => {
  try {
    const response = await fetch(`${BASE_URL}/order/${orderId}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return for order ${orderId}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend unavailable, searching returns for Order ID ${orderId} locally:`, error.message);
    const list = getLocalReturns();
    return list.filter(r => Number(r.orderId) === Number(orderId) || r.orderId.toString() === orderId.toString());
  }
};

// GET /api/Returns/order-item/{orderItemId}
export const getReturnByOrderItemId = async (orderItemId) => {
  try {
    const response = await fetch(`${BASE_URL}/order-item/${orderItemId}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`Failed to fetch return for item ${orderItemId}`);
    return await response.json();
  } catch (error) {
    console.warn(`Backend unavailable, searching returns for Order Item ID ${orderItemId} locally:`, error.message);
    const list = getLocalReturns();
    return list.find(r => Number(r.orderItemId) === Number(orderItemId) || r.orderItemId.toString() === orderItemId.toString()) || null;
  }
};

// ADMIN API ENDPOINTS

// GET /api/ReturnsAdmin/admin
export const getAdminReturns = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'All') {
        query.append(k, params[k]);
      }
    });
    const response = await fetch(`${ADMIN_BASE_URL}/admin?${query.toString()}`, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch admin returns list');
    const data = await response.json();
    return {
      returns: data.returns || data.items || data.Returns || data.Items || [],
      totalCount: data.totalCount ?? data.TotalCount ?? 0,
      page: data.page ?? data.Page ?? 1,
      pageSize: data.pageSize ?? data.PageSize ?? 10
    };
  } catch (error) {
    console.warn('Backend unavailable, loading admin returns from local storage:', error.message);
    let list = getLocalReturns();

    if (params.status && params.status !== 'All') {
      list = list.filter(r => r.status.toLowerCase() === params.status.toLowerCase());
    }
    if (params.requestType && params.requestType !== 'All') {
      list = list.filter(r => r.requestType.toLowerCase() === params.requestType.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(r => 
        r.id.toString().includes(q) || 
        r.orderId.toString().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.customerName && r.customerName.toLowerCase().includes(q))
      );
    }
    if (params.orderNumber) {
      list = list.filter(r => r.orderId.toString().includes(params.orderNumber.toString()));
    }

    return {
      returns: list,
      totalCount: list.length,
      page: params.page || 1,
      pageSize: params.pageSize || 20
    };
  }
};

// PUT /api/ReturnsAdmin/{id}/status
export const updateReturnStatus = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/status`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update status');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, updating status for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].status = data.status || list[idx].status;
      list[idx].remarks = data.remarks || list[idx].remarks;
      list[idx].rejectionReason = data.rejectionReason || null;
      saveLocalReturns(list);
    }
    return true;
  }
};

// PUT /api/ReturnsAdmin/{id}/pickup
export const updateReturnPickup = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/pickup`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update pickup');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, scheduling pickup for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].pickupDetails = {
        pickupDate: data.pickupDate,
        pickupAgentName: data.pickupAgentName,
        pickupAgentPhone: data.pickupAgentPhone,
        pickupTrackingNumber: data.pickupTrackingNumber,
        remarks: data.remarks
      };
      list[idx].status = 'Pickup Scheduled';
      saveLocalReturns(list);
    }
    return true;
  }
};

// PUT /api/ReturnsAdmin/{id}/refund
export const updateReturnRefund = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/refund`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to issue refund');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, executing refund for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].refundDetails = {
        approvedRefundAmount: data.approvedRefundAmount,
        refundMethod: data.refundMethod,
        refundTransactionId: data.refundTransactionId,
        refundStatus: data.refundStatus || 'Success',
        remarks: data.remarks
      };
      list[idx].status = 'Refunded';
      
      // Update customer wallet balance in mock user session if method is Wallet
      if (data.refundMethod === 'Wallet' && list[idx].refundDetails.refundStatus === 'Success') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            const amount = Number(data.approvedRefundAmount);
            userObj.wallet = (Number(userObj.wallet) || 0) + amount;
            localStorage.setItem('user', JSON.stringify(userObj));
            // Trigger wallet reload across the app
            window.dispatchEvent(new Event('wallet-update'));
          } catch (e) {}
        }
      }
      saveLocalReturns(list);
    }
    return true;
  }
};

// PUT /api/ReturnsAdmin/{id}/replacement
export const updateReturnReplacement = async (id, data) => {
  try {
    const response = await fetch(`${ADMIN_BASE_URL}/${id}/replacement`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to assign replacement details');
    return true;
  } catch (error) {
    console.warn(`Backend unavailable, saving replacement order details for return ${id} locally:`, error.message);
    const list = getLocalReturns();
    const idx = list.findIndex(r => r.id === Number(id));
    if (idx !== -1) {
      list[idx].replacementDetails = {
        replacementOrderId: data.replacementOrderId,
        replacementOrderNumber: data.replacementOrderNumber,
        trackingNumber: data.trackingNumber,
        carrierName: data.carrierName,
        replacementStatus: data.replacementStatus || 'Shipped',
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        remarks: data.remarks
      };
      list[idx].status = 'Completed';
      saveLocalReturns(list);
    }
    return true;
  }
};
