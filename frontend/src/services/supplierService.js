import apiClient from '../api/axios';

export const SUPPLIER_API_BASE_URL = (
  process.env.REACT_APP_SUPPLIER_API_BASE_URL ||
  'http://shyamagrotools.com'
).replace(/\/$/, '');

const requestConfig = {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const getResponseData = (data) => data?.data ?? data;

const getApiMessage = (error, fallback) => {
  const status = error?.response?.status;
  const serverData = error?.response?.data;
  const serverMessage = typeof serverData === 'string'
    ? serverData
    : serverData?.message || serverData?.title || serverData?.error;

  if (serverMessage) return serverMessage;
  if (status === 400) return 'Please check the supplier details and try again.';
  if (status === 401) return 'Please sign in again to continue.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'Supplier not found.';
  if (status === 409) return 'A supplier with these details already exists.';
  if (status >= 500) return 'Supplier service is unavailable. Please try again later.';
  if (error?.code === 'ECONNABORTED') return 'Supplier request timed out. Please try again.';
  if (!error?.response) return 'Network error. Please check your connection.';
  return fallback;
};

const request = async (operation, fallbackMessage) => {
  try {
    const response = await operation();
    return getResponseData(response.data);
  } catch (error) {
    throw new Error(getApiMessage(error, fallbackMessage));
  }
};

const getItems = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.suppliers)) return data.suppliers;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.value)) return data.value;
  return [];
};

export const normalizeSupplier = (supplier = {}) => ({
  ...supplier,
  id: supplier.id ?? supplier.supplierId ?? supplier.SupplierId,
  name: supplier.name || supplier.companyName || supplier.businessName || supplier.BusinessName || '',
  contactPerson: supplier.contactPerson || supplier.fullName || supplier.FullName || '',
  phone: supplier.phone || supplier.mobileNumber || supplier.MobileNumber || '',
  email: supplier.email || supplier.emailAddress || supplier.EmailAddress || '',
  address: supplier.address || supplier.businessAddress || supplier.BusinessAddress || '',
  productCount: Number(supplier.productCount ?? supplier.ProductCount ?? 0),
  performanceRating: Number(supplier.performanceRating ?? supplier.PerformanceRating ?? 0),
  commercialTerms: supplier.commercialTerms || supplier.CommercialTerms || '',
  isActive: Boolean(supplier.isActive ?? supplier.IsActive),
  gstin: supplier.gstin || supplier.gstinNumber || supplier.GstinNumber || '',
  productCategory: supplier.productCategory || supplier.ProductCategory || '',
  trackingId: supplier.trackingId || supplier.TrackingId || '',
  status: supplier.status || supplier.Status || '',
});

export const buildSupplierRegistrationPayload = (values = {}) => ({
  fullName: String(values.contactPerson || '').trim(),
  businessName: String(values.companyName || '').trim(),
  productCategory: String(values.productCategory || '').trim(),
  mobileNumber: String(values.mobileNumber || '').trim(),
  emailAddress: String(values.emailAddress || '').trim(),
  gstinNumber: String(values.gstNumber || '').trim(),
  businessAddress: [
    values.address,
    values.city,
    values.state,
    values.pincode,
  ].filter(Boolean).map((value) => String(value).trim()).join(', '),
});

export const getSuppliers = async () => {
  const data = await request(
    () => apiClient.get(`${SUPPLIER_API_BASE_URL}/api/Suppliers`, requestConfig),
    'Unable to load suppliers.'
  );
  return getItems(data).map(normalizeSupplier);
};

export const getSupplierById = async (id) => request(
  () => apiClient.get(`${SUPPLIER_API_BASE_URL}/api/Suppliers/${id}`, requestConfig),
  'Unable to load supplier details.'
).then(normalizeSupplier);

export const registerSupplier = async (data) => request(
  () => apiClient.post(
    `${SUPPLIER_API_BASE_URL}/api/Suppliers/register`,
    buildSupplierRegistrationPayload(data),
    requestConfig
  ),
  'Unable to submit supplier registration.'
);

export const getSupplierStatus = async () => request(
  () => apiClient.get(`${SUPPLIER_API_BASE_URL}/api/Suppliers/status`, requestConfig),
  'Unable to load supplier status.'
);

export const updateSupplier = async (id, data) => request(
  () => apiClient.put(`${SUPPLIER_API_BASE_URL}/api/Suppliers/${id}`, data, requestConfig),
  'Unable to update supplier.'
);

export const deleteSupplier = async (id) => request(
  () => apiClient.delete(`${SUPPLIER_API_BASE_URL}/api/Suppliers/${id}`, requestConfig),
  'Unable to delete supplier.'
);
