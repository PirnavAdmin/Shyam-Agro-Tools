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

// Intercept requests to inject Authorization token if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
  // Support both camelCase (client) and PascalCase (ASP.NET) field names
  const category = raw.category || raw.Category || raw.productCategory || raw.ProductCategory || '';
  const contactPerson = raw.contactPerson || raw.ContactPerson || raw.name || raw.Name || '';
  const rating = Number(raw.rating ?? raw.Rating ?? raw.performanceRating ?? raw.PerformanceRating ?? 4.5);
  const terms = raw.paymentTerms || raw.terms || raw.commercialTerms || raw.CommercialTerms || 'Net 15';
  const city = raw.city || raw.City || '';
  const leadTime = raw.leadTime || raw.LeadTime || '4-6 days';
  const products = raw.productLines || raw.ProductLines || raw.products || raw.Products || '';
  const activePo = Number(raw.activePo ?? raw.ActivePo ?? 0);
  const monthlySpend = Number(raw.monthlySpend ?? raw.MonthlySpend ?? 0);
  const lastSupplyRaw = raw.lastSupply || raw.LastSupply || raw.lastSupplyDate || raw.LastSupplyDate || '';
  const lastSupply = lastSupplyRaw ? String(lastSupplyRaw).slice(0, 10) : new Date().toISOString().slice(0, 10);

  // Normalize status: backend 'Approved' => UI 'Verified'
  const rawStatus = raw.status || raw.Status || 'Pending';
  const normalizedStatus = rawStatus === 'Approved' ? 'Verified' :
                           rawStatus === 'Active' ? 'Verified' :
                           rawStatus;

  return {
    id: String(raw.id ?? raw.Id ?? ''),
    name: raw.name || raw.Name || raw.businessName || raw.BusinessName || '',
    businessName: raw.businessName || raw.BusinessName || raw.name || raw.Name || '',
    contactPerson,
    category,
    status: normalizedStatus,
    email: raw.email || raw.Email || '',
    phone: raw.phone || raw.Phone || raw.mobile || raw.Mobile || '',
    mobile: raw.mobile || raw.Mobile || raw.phone || raw.Phone || '',
    city,
    address: raw.address || raw.Address || '',
    gstin: raw.gstin || raw.Gstin || '',
    leadTime,
    rating,
    activePo,
    monthlySpend,
    lastSupply,
    terms,
    paymentTerms: terms,
    products,
    productLines: products,
    submittedAt: raw.submittedAt || raw.SubmittedAt || raw.createdAt || raw.CreatedAt || new Date().toISOString()
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
    productCategory: supplierData.category || supplierData.productCategory || '',
    status: supplierData.status || 'Pending',
    email: supplierData.email || '',
    phone: supplierData.phone || supplierData.mobile || '',
    city: supplierData.city || '',
    address: supplierData.address || '',
    gstin: supplierData.gstin || '',
    leadTime: supplierData.leadTime || '4-6 days',
    commercialTerms: supplierData.paymentTerms || supplierData.terms || 'Net 15',
    productLines: supplierData.productLines || supplierData.products || '',
    performanceRating: Number(supplierData.rating ?? 4.5),
    activePo: Number(supplierData.activePo ?? 0),
    monthlySpend: Number(supplierData.monthlySpend ?? 0)
  };
  
  const response = await api.post('/api/Suppliers', payload);
  return mapSupplierFromApi(unwrapItem(response));
};

// PUT /api/Suppliers/{id}
export const updateSupplier = async (id, supplierData) => {
  const payload = {
    id: parseInt(id, 10),
    name: supplierData.name || supplierData.businessName || '',
    contactPerson: supplierData.contactPerson || '',
    productCategory: supplierData.category || supplierData.productCategory || '',
    status: supplierData.status || 'Pending',
    email: supplierData.email || '',
    phone: supplierData.phone || supplierData.mobile || '',
    city: supplierData.city || '',
    address: supplierData.address || '',
    gstin: supplierData.gstin || '',
    leadTime: supplierData.leadTime || '4-6 days',
    commercialTerms: supplierData.paymentTerms || supplierData.terms || 'Net 15',
    productLines: supplierData.productLines || supplierData.products || '',
    performanceRating: Number(supplierData.rating ?? 4.5),
    activePo: Number(supplierData.activePo ?? 0),
    monthlySpend: Number(supplierData.monthlySpend ?? 0)
  };

  const response = await api.put(`/api/Suppliers/${id}`, payload);
  return mapSupplierFromApi(unwrapItem(response));
};

// DELETE /api/Suppliers/{id}
export const deleteSupplier = async (id) => {
  try {
    await api.delete(`/api/Suppliers/${id}`);
  } catch (err) {
    console.warn(`[suppliersApi] Backend delete call for supplier #${id} failed:`, err.message);
  }
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
