import axios from 'axios';

export const BASE_URL = 'https://shyamagrotools.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch report data for orders.
 * GET /api/Reports/orders
 */
export const getReportsOrders = async () => {
  const response = await api.get('/api/Reports/orders');
  return response.data;
};

/**
 * Fetch report data for catalog.
 * GET /api/Reports/catalog
 */
export const getReportsCatalog = async () => {
  const response = await api.get('/api/Reports/catalog');
  return response.data;
};

/**
 * Trigger export of report.
 * POST /api/Reports/export
 */
export const exportReport = async (reportType) => {
  const response = await api.post('/api/Reports/export', { reportType });
  return response.data;
};

/**
 * Update report settings.
 * PUT /api/Reports/settings
 */
export const updateReportSettings = async (settings) => {
  const response = await api.put('/api/Reports/settings', settings);
  return response.data;
};

/**
 * Clear analytics report cache.
 * DELETE /api/Reports/cache
 */
export const clearReportCache = async () => {
  const response = await api.delete('/api/Reports/cache');
  return response.data;
};
