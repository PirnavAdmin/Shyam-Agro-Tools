import axios from '../api/axios';
import { ORDER_API_BASE_URL } from './orderService';

const getRequestConfig = () => {
  return {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
};

export const getInvoices = async () => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Invoices`, getRequestConfig());
  return response.data;
};

export const getInvoiceById = async (id) => {
  const response = await axios.get(`${ORDER_API_BASE_URL}/api/Invoices/${id}`, getRequestConfig());
  return response.data;
};

export const createInvoice = async (invoiceData) => {
  const response = await axios.post(`${ORDER_API_BASE_URL}/api/Invoices`, invoiceData, getRequestConfig());
  return response.data;
};

export const updateInvoice = async (id, invoiceData) => {
  const response = await axios.put(`${ORDER_API_BASE_URL}/api/Invoices/${id}`, invoiceData, getRequestConfig());
  return response.data;
};

export const deleteInvoice = async (id) => {
  const response = await axios.delete(`${ORDER_API_BASE_URL}/api/Invoices/${id}`, getRequestConfig());
  return response.data;
};

export const mapOrderToInvoice = (order) => {
  const shippingAddressObj = order.shippingAddress || {};
  const shippingAddrString = typeof shippingAddressObj === 'string'
    ? shippingAddressObj
    : [
        shippingAddressObj.address || shippingAddressObj.Address,
        shippingAddressObj.city || shippingAddressObj.City,
        shippingAddressObj.state || shippingAddressObj.State,
        shippingAddressObj.zip || shippingAddressObj.Zip || shippingAddressObj.postalCode || shippingAddressObj.PostalCode
      ].filter(Boolean).join(', ');

  const billingName = order.billingDetails?.name || order.customerName || 'Customer';
  const billingPhone = order.billingDetails?.phone || order.customerPhone || '';
  const billingEmail = order.billingDetails?.email || order.customerEmail || '';

  return {
    invoiceNo: order.orderNumber || String(order.id),
    date: order.createdAt || new Date().toISOString(),
    paymentStatus: order.paymentStatus || 'Pending',
    clientName: billingName,
    emailAddress: billingEmail,
    contactNo: billingPhone,
    address: shippingAddrString || 'N/A',
    postalCode: shippingAddressObj.zip || shippingAddressObj.Zip || shippingAddressObj.postalCode || shippingAddressObj.PostalCode || '',
    taxNumber: order.billingDetails?.taxNumber || '',
    billingName: billingName,
    billingAddress: shippingAddrString || 'N/A',
    billingPhone: billingPhone,
    billingTaxNumber: order.billingDetails?.taxNumber || '',
    billingEmail: billingEmail,
    shippingName: billingName,
    shippingAddress: shippingAddrString || 'N/A',
    shippingPhone: billingPhone,
    shippingTaxNumber: order.billingDetails?.taxNumber || '',
    shippingEmail: billingEmail,
    paymentMethod: order.paymentMethod || 'COD',
    subTotal: Number(order.subtotal ?? order.totalAmount ?? 0),
    taxAmount: Number(order.gst ?? order.gstAmount ?? 0),
    discount: Number(order.discount ?? order.discountAmount ?? 0),
    shippingCharge: Number(order.deliveryCharge ?? order.shippingFee ?? 0),
    totalAmount: Number(order.total ?? order.finalAmount ?? 0),
    notes: 'Thank you for shopping with Shyam Agro Tools & Equipment!'
  };
};

export const getOrCreateInvoiceForOrder = async (order) => {
  if (!order || !order.id) return null;
  const orderId = String(order.id);
  const orderNo = order.orderNumber || orderId;

  // 1. Try to fetch invoice directly by ID
  try {
    const invoice = await getInvoiceById(orderId);
    if (invoice && (String(invoice.invoiceNo) === orderNo || String(invoice.id) === orderId)) {
      return invoice;
    }
  } catch (err) {
    console.warn(`Could not fetch invoice directly by ID ${orderId}:`, err.message);
  }

  // 2. Try to fetch all invoices and filter by invoiceNo
  try {
    const invoices = await getInvoices();
    const invoiceList = Array.isArray(invoices) ? invoices : (invoices.value || invoices.items || invoices.data || []);
    const matching = invoiceList.find(inv => String(inv?.invoiceNo) === orderNo || String(inv?.id) === orderId);
    if (matching) return matching;
  } catch (err) {
    console.warn('Could not fetch or search invoices list:', err.message);
  }

  // 3. Create the invoice since it does not exist
  const newInvoiceData = mapOrderToInvoice(order);
  try {
    const created = await createInvoice(newInvoiceData);
    return created || newInvoiceData;
  } catch (err) {
    console.error('Failed to create invoice:', err.response?.data || err.message);
    // Return the local mapped one as a fallback so UI still works!
    return newInvoiceData;
  }
};
