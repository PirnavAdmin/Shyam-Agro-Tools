import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

const BASE_URL = getApiDomain();

// Create central Axios instance skipping ngrok warnings
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Helper: Extract list array from response shapes
const unwrapList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.Value)) return data.Value;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

// Helper: Extract single item from response
const unwrapItem = (response) => {
  const data = response?.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data?.data ?? data;
  }
  return data ?? {};
};

// Mapper: Standardize backend data structures for suppliers components
export const mapSupplierFromApi = (raw = {}) => {
  return {
    id: String(raw.id ?? ''),
    name: raw.name || raw.businessName || '',
    businessName: raw.businessName || raw.name || '',
    contactPerson: raw.contactPerson || raw.name || '',
    category: raw.category || '',
    status: raw.status || 'Pending',
    email: raw.email || '',
    phone: raw.phone || raw.mobile || '',
    mobile: raw.mobile || raw.phone || '',
    city: raw.city || '',
    address: raw.address || '',
    gstin: raw.gstin || '',
    leadTime: raw.leadTime || '4-6 days',
    rating: Number(raw.rating ?? 4.5),
    activePo: Number(raw.activePo ?? 0),
    monthlySpend: Number(raw.monthlySpend ?? 0),
    lastSupply: raw.lastSupply || new Date().toISOString().slice(0, 10),
    terms: raw.paymentTerms || raw.terms || 'Net 15',
    products: raw.productLines || raw.products || '',
    submittedAt: raw.submittedAt || raw.createdAt || new Date().toISOString()
  };
};

// ─── API Client Endpoints ───────────────────────────────────────────────────

// GET /api/Suppliers
export const fetchSuppliers = async () => {
  const response = await api.get('/api/Suppliers');
  return unwrapList(response).map(mapSupplierFromApi);
};

// GET /api/Suppliers/{id}
export const fetchSupplier = async (id) => {
  try {
    const response = await api.get(`/api/Suppliers/${id}`);
    return mapSupplierFromApi(unwrapItem(response));
  } catch (err) {
    // Fall back to scanning the general list if direct lookup fails
    const all = await fetchSuppliers();
    const found = all.find((s) => String(s.id) === String(id));
    if (found) return found;
    throw err;
  }
};

// POST /api/Suppliers
export const createSupplier = async (supplierData) => {
  const payload = {
    name: supplierData.name || supplierData.businessName || '',
    contactPerson: supplierData.contactPerson || '',
    category: supplierData.category || '',
    status: supplierData.status || 'Pending',
    email: supplierData.email || '',
    phone: supplierData.phone || supplierData.mobile || '',
    city: supplierData.city || '',
    address: supplierData.address || '',
    gstin: supplierData.gstin || '',
    leadTime: supplierData.leadTime || '',
    paymentTerms: supplierData.paymentTerms || supplierData.terms || 'Net 15',
    productLines: supplierData.productLines || supplierData.products || '',
    notes: supplierData.notes || '',
    rating: Number(supplierData.rating ?? 4.5),
    activePo: Number(supplierData.activePo ?? 0),
    monthlySpend: Number(supplierData.monthlySpend ?? 0)
  };
  
  const response = await api.post('/api/Suppliers', payload);
  return mapSupplierFromApi(unwrapItem(response));
};

// PUT /api/Suppliers/{id}
export const updateSupplier = async (id, supplierData) => {
  const payload = {
    id: id,
    name: supplierData.name || supplierData.businessName || '',
    contactPerson: supplierData.contactPerson || '',
    category: supplierData.category || '',
    status: supplierData.status || 'Pending',
    email: supplierData.email || '',
    phone: supplierData.phone || supplierData.mobile || '',
    city: supplierData.city || '',
    address: supplierData.address || '',
    gstin: supplierData.gstin || '',
    leadTime: supplierData.leadTime || '',
    paymentTerms: supplierData.paymentTerms || supplierData.terms || 'Net 15',
    productLines: supplierData.productLines || supplierData.products || '',
    notes: supplierData.notes || '',
    rating: Number(supplierData.rating ?? 4.5),
    activePo: Number(supplierData.activePo ?? 0),
    monthlySpend: Number(supplierData.monthlySpend ?? 0)
  };

  const response = await api.put(`/api/Suppliers/${id}`, payload);
  return mapSupplierFromApi(unwrapItem(response));
};

// DELETE /api/Suppliers/{id}
export const deleteSupplier = async (id) => {
  await api.delete(`/api/Suppliers/${id}`);
};

// POST /api/Suppliers/register (User Become-Seller Screen)
export const registerSupplier = async (formData) => {
  const payload = {
    name: formData.businessName || formData.name || '',
    contactPerson: formData.name || '',
    category: formData.category || '',
    phone: formData.mobile || '',
    email: formData.email || '',
    gstin: formData.gstin || '',
    address: formData.address || '',
    city: '',
    status: 'Pending'
  };

  const response = await api.post('/api/Suppliers/register', payload);
  return mapSupplierFromApi(unwrapItem(response));
};

// PUT /api/Suppliers/{id}/status (Review Approvals/Rejections)
export const updateSupplierStatus = async (id, status) => {
  const response = await api.put(`/api/Suppliers/${id}/status`, { status }, {
    params: { status } // Send in both query param and body to support varied backend bindings
  });
  return mapSupplierFromApi(unwrapItem(response));
};
