import axios from 'axios';
import { getApiDomain } from '../../utils/apiConfig';

export const BASE_URL = getApiDomain();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export const mapStockItemFromApi = (raw = {}) => {
  const currentStock = Number(raw.currentStock ?? raw.stockQuantity ?? raw.stock ?? 0);
  const rawReorder = Number(raw.reorderLevel ?? raw.ReorderLevel ?? 0);
  const reorderLevel = rawReorder > 0 ? rawReorder : 30;
  
  // Parse price fields (backend passes costPrice as string formatted ₹1,017 or raw MRP/SellingPrice)
  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const clean = val.replace(/[^0-9.]/g, '');
      return parseFloat(clean) || 0;
    }
    return 0;
  };

  const costPrice = parseAmount(raw.costPrice ?? raw.mrp ?? raw.MRP ?? 0);
  const sellingPrice = parseAmount(raw.sellingPrice ?? raw.SellingPrice ?? raw.price ?? raw.costPrice ?? 0);

  // Determine status
  let status = raw.status || raw.stockStatus;
  if (!status) {
    if (currentStock === 0) {
      status = 'Out of Stock';
    } else if (currentStock <= reorderLevel) {
      status = 'Low Stock';
    } else {
      status = 'In Stock';
    }
  }

  return {
    id: raw.id ?? raw.productId ?? '',
    sku: raw.sku || raw.SKU || '',
    name: raw.productName || raw.name || '',
    category: raw.categoryName || raw.category || 'General',
    categoryId: raw.categoryId ?? '',
    subcategory: raw.subcategoryName || raw.subcategory || 'General',
    supplier: raw.supplierName || raw.supplier || 'AquaFlow Pvt Ltd',
    currentStock,
    reorderLevel,
    unit: raw.stockUnit || raw.unit || 'Pcs',
    costPrice,
    sellingPrice,
    status,
    lastUpdated: raw.lastUpdated ? raw.lastUpdated.slice(0, 10) : new Date().toISOString().slice(0, 10),
    trend: raw.trend || 'stable',
    change: Number(raw.change ?? 0),
  };
};

/**
 * Fetch Stock Ledger
 * GET /api/Stock/ledger
 */
export const getStockLedger = async (params = {}) => {
  const response = await api.get('/api/Stock/ledger', { params });
  const data = response.data;
  const list = Array.isArray(data) 
    ? data 
    : (Array.isArray(data?.products) 
      ? data.products 
      : (Array.isArray(data?.Products) 
        ? data.Products 
        : (Array.isArray(data?.data) 
          ? data.data 
          : (Array.isArray(data?.items) 
            ? data.items 
            : []))));
  return list.map(mapStockItemFromApi);
};

/**
 * Adjust stock for a product ID
 * POST /api/Stock/adjust/{productId}
 */
export const adjustStock = async (productId, adjustmentData) => {
  // adjustmentData should match StockAdjustmentRequest schema: { actionType, quantity, reason, note }
  const response = await api.post(`/api/Stock/adjust/${productId}`, {
    actionType: adjustmentData.actionType, // 'Add' or 'Remove'
    quantity: Number(adjustmentData.quantity),
    reason: adjustmentData.reason || '',
    note: adjustmentData.note || '',
  });
  return response.data;
};

/**
 * Get adjustments list
 * GET /api/Stock/adjustments
 */
export const getStockAdjustments = async () => {
  const response = await api.get('/api/Stock/adjustments');
  return response.data;
};

/**
 * Create a new stock entry
 * POST /api/Stock/entry
 */
export const addStockEntry = async (entryData) => {
  // entryData should match NewStockEntryRequest schema:
  // { productName, sku, categoryId, subcategoryName, supplierName, initialStockQty, reorderLevel, stockUnit, costPrice, sellingPrice }
  const response = await api.post('/api/Stock/entry', {
    productName: entryData.productName,
    sku: entryData.sku,
    categoryId: entryData.categoryId ? Number(entryData.categoryId) : null,
    subcategoryName: entryData.subcategoryName || '',
    supplierName: entryData.supplierName || '',
    initialStockQty: Number(entryData.initialStockQty ?? 0),
    reorderLevel: Number(entryData.reorderLevel ?? 0),
    stockUnit: entryData.stockUnit || 'Pcs',
    costPrice: Number(entryData.costPrice ?? 0),
    sellingPrice: Number(entryData.sellingPrice ?? 0),
  });
  return response.data;
};
