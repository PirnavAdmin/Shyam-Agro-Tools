import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  FolderTree,
  Boxes,
  ExternalLink,
  X,
  Search,
  ArrowUpRight,
  Settings,
  Trash2
} from 'lucide-react';
import { getOrders } from '../api/orders';
import { fetchProducts, fetchCategories } from '../catalog/productsApi';
import {
  getReportsOrders,
  getReportsCatalog,
  exportReport,
  updateReportSettings,
  clearReportCache
} from '../api/reports';
import { Pagination } from '../components/ActionButtons';
import './ReportsScreen.css';

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

const formatOrderId = (rawId) => {
  if (!rawId) return 'ORD-000000';
  let str = String(rawId).trim().replace(/^#+/, '');
  while (str.startsWith('ORD-ORD-')) {
    str = str.substring(4);
  }
  if (!str.startsWith('ORD-')) {
    str = `ORD-${str}`;
  }
  return str;
};

const REPORTS_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

const STATUS_COLORS = {
  Completed: '#16a34a',   // Green
  Cancelled: '#dc2626',   // Red
  Canceled: '#dc2626',    // Red (fallback)
  Dispatched: '#f97316',  // Orange
  Processing: '#2563eb',  // Blue
  Pending: '#eab308',     // Yellow
  Placed: '#9333ea',      // Purple
  Packed: '#db2777',      // Pink
  Shipped: '#06b6d4',     // Cyan
  'On Hold': '#4b5563'    // Gray
};

const ReportsScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'catalog'
  const [datePreset, setDatePreset] = useState('All'); // 'All', '7days', '30days', 'year'
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Reports API custom states
  const [ordersReport, setOrdersReport] = useState(null);
  const [catalogReport, setCatalogReport] = useState(null);
  const [settings, setSettings] = useState({ lowStockAlertLimit: 5, defaultCurrency: 'INR' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [notification, setNotification] = useState(null);

  // Drill-down Modal State
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    title: '',
    type: '', // 'orders' or 'products'
    data: [],
    filterType: ''
  });
  const [drillDownSearch, setDrillDownSearch] = useState('');

  // Pagination states (10 items per page limit)
  const [catalogPage, setCatalogPage] = useState(1);
  const [drillPage, setDrillPage] = useState(1);
  const itemsPerPage = 10;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [reportsOrdersData, reportsCatalogData] = await Promise.all([
        getReportsOrders().catch((err) => {
          console.warn("Failed to load Reports Orders API, falling back:", err);
          return null;
        }),
        getReportsCatalog().catch((err) => {
          console.warn("Failed to load Reports Catalog API, falling back:", err);
          return null;
        })
      ]);

      const mapStatusLocal = (status, paymentStatus) => {
        if (!status) return 'Pending';
        const s = status.toUpperCase();
        const ps = (paymentStatus || '').toUpperCase();
        const isPaid = ps === 'PAID' || ps === 'VERIFIED PAID' || ps === 'SUCCESS' || ps === 'PAID VERIFIED';

        if (s === 'PENDING' || s === 'PLACED') return isPaid ? 'Processing' : 'Pending';
        if (s === 'PROCESSING' || s === 'PACKED') return 'Processing';
        if (s === 'SHIPPED' || s === 'DISPATCHED') return 'Dispatched';
        if (s === 'DELIVERED' || s === 'COMPLETED') return 'Completed';
        if (s === 'CANCELLED' || s === 'CANCELED') return 'Cancelled';
        return status;
      };

      if (reportsOrdersData) {
        setOrdersReport(reportsOrdersData);
        const mappedOrders = (reportsOrdersData.detailedOrdersLedger || []).map(o => {
          const amount = o.totalAmount ? Number(String(o.totalAmount).replace(/[^0-9.-]+/g, "")) : 0;
          const itemsCount = o.itemsCount ? parseInt(o.itemsCount, 10) : 0;
          const payStat = o.paymentStatus === 'PendingVerification' ? 'Pending Verification' : o.paymentStatus;
          return {
            id: o.orderId,
            orderId: o.orderId,
            date: o.date,
            orderDate: o.date,
            customerName: o.customer,
            customer: o.customer,
            items: Array(itemsCount).fill({}),
            totalAmount: amount,
            total: amount,
            paymentStatus: payStat,
            status: mapStatusLocal(o.fulfillmentStatus || o.fulfillment || o.status, payStat)
          };
        });
        setOrders(mappedOrders);
      } else {
        const legacyOrders = await getOrders().catch(() => []);
        const mappedOrders = legacyOrders.map(o => ({
          ...o,
          status: mapStatusLocal(o.fulfillment || o.status, o.paymentStatus)
        }));
        setOrders(mappedOrders);
      }

      if (reportsCatalogData) {
        setCatalogReport(reportsCatalogData);
        const mappedProducts = (reportsCatalogData.catalogInventorySummary || []).map((p, idx) => {
          const price = p.sellingPrice ? Number(String(p.sellingPrice).replace(/[^0-9.-]+/g, "")) : 0;
          return {
            id: String(idx + 1),
            sku: p.sku,
            name: p.productName,
            categoryId: p.category,
            brand: p.brand,
            price: price,
            stock: p.stockCount,
            status: p.status
          };
        });
        setProducts(mappedProducts);
      } else {
        const [legacyProducts, legacyCategories] = await Promise.all([
          fetchProducts().catch(() => []),
          fetchCategories().catch(() => [])
        ]);
        setProducts(legacyProducts);
        setCategories(legacyCategories);
      }
    } catch (err) {
      console.error("Failed to load reporting data:", err);
      showNotification("Failed to load reporting data", "error");
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    try {
      const res = await updateReportSettings({ lowStockAlertLimit: 5, defaultCurrency: 'INR' }).catch(() => null);
      if (res && res.settings) {
        setSettings(res.settings);
      }
    } catch (e) {
      console.warn("Could not retrieve settings from backend:", e);
    }
  };

  useEffect(() => {
    loadReportData();
    initializeSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Orders Report Calculations ---
  // Date filtering logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const dateFiltered = orders.filter(order => {
      const orderDate = new Date(order.orderDate || order.date);
      if (datePreset === '7days') {
        const diffTime = Math.abs(now - orderDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (datePreset === '30days') {
        const diffTime = Math.abs(now - orderDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      if (datePreset === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true; // All
    });

    // Deduplicate by Order ID
    const seenOrderIds = new Set();
    return dateFiltered.filter(o => {
      const key = String(o.id || o.orderId || '').toLowerCase();
      if (!key || seenOrderIds.has(key)) return false;
      seenOrderIds.add(key);
      return true;
    });
  }, [orders, datePreset]);

  const orderStats = useMemo(() => {
    // Exclude Cancelled orders to match backend ReportsController logic (line 64)
    const activeOrders = filteredOrders.filter(o => {
      const st = (o.status || '').toLowerCase();
      return st !== 'cancelled';
    });
    const total = activeOrders.length;
    const revenue = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total || o.finalAmount || 0)), 0);
    // Use 2-decimal rounding to match backend Math.Round(totalSalesRevenue / ordersVolume, 2)
    const aov = total > 0 ? Math.round((revenue / total) * 100) / 100 : 0;
    const pendingPayment = activeOrders.filter(o => {
      const ps = (o.paymentStatus || '').toLowerCase();
      const st = (o.status || '').toLowerCase();
      const isPendingStatus = ps === 'pending' || ps === 'pending verification' || ps === 'pendingverification';
      const isSettledOrder = st === 'completed' || st === 'delivered';
      return isPendingStatus && !isSettledOrder;
    }).length;
    return { total, revenue, aov, pendingPayment };
  }, [filteredOrders]);

  const displayStats = useMemo(() => {
    if (datePreset === 'All' && ordersReport) {
      return {
        revenue: ordersReport.totalSalesRevenue,
        total: ordersReport.ordersVolume,
        aov: ordersReport.averageOrderValue,
        pendingPayment: ordersReport.unconfirmedPayments
      };
    }
    return {
      revenue: formatCurrency(orderStats.revenue),
      total: `${orderStats.total} Orders`,
      aov: formatCurrency(orderStats.aov),
      pendingPayment: `${orderStats.pendingPayment} Pending`
    };
  }, [datePreset, ordersReport, orderStats]);

  // Drill-down openers
  const openUnconfirmedPaymentsDrillDown = () => {
    const unconfirmed = filteredOrders.filter(o => {
      const ps = (o.paymentStatus || '').toLowerCase();
      const st = (o.status || '').toLowerCase();
      const isPendingStatus = ps.includes('pending') || ps.includes('unconfirmed') || ps.includes('verification');
      const isSettledOrder = st === 'completed' || st === 'delivered' || st === 'cancelled';
      return isPendingStatus && !isSettledOrder;
    });
    setDrillDownSearch('');
    setDrillDownModal({
      isOpen: true,
      title: 'Unconfirmed & Pending Payments Drill-Down',
      type: 'orders',
      data: unconfirmed,
      filterType: 'unconfirmed'
    });
  };

  const openOrdersVolumeDrillDown = () => {
    setDrillDownSearch('');
    setDrillDownModal({
      isOpen: true,
      title: 'Total Orders Volume Ledger Drill-Down',
      type: 'orders',
      data: filteredOrders,
      filterType: 'all_orders'
    });
  };

  const openOutOfStockDrillDown = () => {
    const outOfStock = products.filter(p => Number(p.stock || 0) === 0);
    setDrillDownSearch('');
    setDrillDownModal({
      isOpen: true,
      title: 'Critical Out-of-Stock Products Drill-Down',
      type: 'products',
      data: outOfStock,
      filterType: 'out_of_stock'
    });
  };

  const openLowStockDrillDown = () => {
    const limit = settings.lowStockAlertLimit || 5;
    const lowStock = products.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= limit);
    setDrillDownSearch('');
    setDrillDownModal({
      isOpen: true,
      title: 'Low Stock Warning Products Drill-Down',
      type: 'products',
      data: lowStock,
      filterType: 'low_stock'
    });
  };

  const filteredDrillDownData = useMemo(() => {
    if (!drillDownModal.isOpen || !drillDownModal.data) return [];
    const query = drillDownSearch.trim().toLowerCase();
    if (!query) return drillDownModal.data;

    if (drillDownModal.type === 'orders') {
      return drillDownModal.data.filter(o =>
        String(o.orderId || o.id || '').toLowerCase().includes(query) ||
        String(o.customerName || o.customer || '').toLowerCase().includes(query) ||
        String(o.paymentStatus || '').toLowerCase().includes(query) ||
        String(o.status || '').toLowerCase().includes(query)
      );
    } else {
      return drillDownModal.data.filter(p =>
        String(p.sku || '').toLowerCase().includes(query) ||
        String(p.name || '').toLowerCase().includes(query) ||
        String(p.categoryId || '').toLowerCase().includes(query) ||
        String(p.brand || '').toLowerCase().includes(query)
      );
    }
  }, [drillDownModal, drillDownSearch]);

  // Sales Trend chart data (Grouped by Date)
  const salesTrendData = useMemo(() => {
    if (datePreset === 'All' && ordersReport?.revenuePerformanceTrend) {
      return ordersReport.revenuePerformanceTrend.map(item => ({
        date: item.date,
        Sales: Number(item.revenue || 0)
      }));
    }
    const map = {};
    filteredOrders.forEach(o => {
      const dateStr = new Date(o.orderDate || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      map[dateStr] = (map[dateStr] || 0) + Number(o.totalAmount || o.total || 0);
    });
    // Convert to sorted array
    return Object.keys(map).map(date => ({
      date,
      Sales: map[date]
    })).slice(-10); // show last 10 days
  }, [filteredOrders, datePreset, ordersReport]);

  // Status Distribution data
  const statusPieData = useMemo(() => {
    if (datePreset === 'All' && ordersReport?.orderFulfillmentStates) {
      return ordersReport.orderFulfillmentStates.map(item => ({
        name: item.state,
        value: item.count
      }));
    }
    const map = {};
    filteredOrders.forEach(o => {
      const status = o.status || 'Processing';
      map[status] = (map[status] || 0) + 1;
    });
    return Object.keys(map).map(name => ({
      name,
      value: map[name]
    }));
  }, [filteredOrders, datePreset, ordersReport]);

  // Payment Methods distribution
  const paymentBarData = useMemo(() => {
    if (datePreset === 'All' && ordersReport?.paymentMethodsDistribution) {
      return ordersReport.paymentMethodsDistribution.map(item => ({
        name: item.method,
        Orders: item.count
      }));
    }
    const map = {};
    filteredOrders.forEach(o => {
      const method = o.paymentMethod || o.payMethod || 'UPI / Bank Transfer';
      map[method] = (map[method] || 0) + 1;
    });
    return Object.keys(map).map(name => ({
      name: name.split('/')[0].trim(), // shorten label
      Orders: map[name]
    }));
  }, [filteredOrders, datePreset, ordersReport]);


  // --- Catalog Report Calculations ---
  const catalogStats = useMemo(() => {
    if (catalogReport) {
      return {
        totalProducts: catalogReport.totalCatalogProducts,
        totalCategories: catalogReport.categoriesCount,
        outOfStock: catalogReport.criticalOutOfStock,
        lowStock: catalogReport.lowStockWarning
      };
    }
    const totalProducts = products.length;
    const lowStock = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length;
    const outOfStock = products.filter(p => Number(p.stock) === 0).length;
    const totalCategories = categories.length;
    return { totalProducts, lowStock, outOfStock, totalCategories };
  }, [products, categories, catalogReport]);

  // Category Distribution Pie Chart data
  const categoryPieData = useMemo(() => {
    if (catalogReport?.categoryAllocationShare) {
      return catalogReport.categoryAllocationShare.map(item => ({
        name: item.categoryName,
        value: item.productCount
      }));
    }
    const categoryNameMap = {};
    categories.forEach(c => {
      categoryNameMap[c.id] = c.name;
    });

    const map = {};
    products.forEach(p => {
      const catName = categoryNameMap[p.categoryId] || 'Unassigned';
      map[catName] = (map[catName] || 0) + 1;
    });
    return Object.keys(map).map(name => ({
      name,
      value: map[name]
    }));
  }, [products, categories, catalogReport]);

  // Out of Stock & Low Stock Items
  const stockAlertData = useMemo(() => {
    if (catalogReport?.lowestStockLevelsAlert) {
      return catalogReport.lowestStockLevelsAlert.map(item => ({
        name: item.productName.length > 18 ? item.productName.slice(0, 15) + '...' : item.productName,
        Stock: Number(item.stock || 0)
      }));
    }
    return products
      .map(p => ({
        name: p.name.length > 18 ? p.name.slice(0, 15) + '...' : p.name,
        Stock: Number(p.stock)
      }))
      .sort((a, b) => a.Stock - b.Stock)
      .slice(0, 8); // top 8 lowest stock
  }, [products, catalogReport]);

  // Top Products by Mock Sales/Revenue
  const topProductsRevenue = useMemo(() => {
    if (catalogReport?.catalogPerformanceIndex) {
      return catalogReport.catalogPerformanceIndex.map(item => ({
        name: item.productName.length > 18 ? item.productName.slice(0, 15) + '...' : item.productName,
        Value: Number(item.averageRating || 0),
        Reviews: Number(item.totalReviews || 0),
        isRating: true
      }));
    }
    // Generate mock revenue based on base price * a scale factor for visual appeal
    return products
      .map(p => ({
        name: p.name.length > 18 ? p.name.slice(0, 15) + '...' : p.name,
        Value: Number(p.price || 0) * (Number(p.id) % 3 + 1) * 4,
        isRating: false
      }))
      .sort((a, b) => b.Value - a.Value)
      .slice(0, 6);
  }, [products, catalogReport]);

  const formatPerformanceTooltip = (value, name, props) => {
    if (props.payload?.isRating) {
      return [`${value} Stars (Based on ${props.payload.Reviews || 0} reviews)`, 'Rating'];
    }
    return [formatCurrency(value), 'Mock Revenue'];
  };


  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const response = await clearReportCache();
      showNotification(response?.message || "Analytics cache cleared successfully!", "success");
      await loadReportData();
    } catch (e) {
      console.error("Failed to clear cache:", e);
      showNotification("Failed to clear report cache", "error");
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const response = await updateReportSettings(settings);
      if (response && response.settings) {
        setSettings(response.settings);
      }
      showNotification(response?.message || "Settings updated successfully!", "success");
      setShowSettingsModal(false);
      await loadReportData();
    } catch (e) {
      console.error("Failed to save settings:", e);
      showNotification("Failed to update settings", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const generateClientCSV = () => {
    let headers = [];
    let rows = [];
    let fileName = '';

    if (activeTab === 'orders') {
      fileName = `orders_report_${datePreset}.csv`;
      headers = ['Order Date', 'Order ID', 'Customer Name', 'Items Count', 'Total Amount', 'Payment Status', 'Fulfillment Status'];
      rows = filteredOrders.map(o => [
        new Date(o.orderDate || o.date).toLocaleDateString('en-IN'),
        o.id || o.orderId,
        o.customerName || o.customer || 'Unknown',
        o.items?.length || 0,
        o.totalAmount || o.total || 0,
        o.paymentStatus || 'Pending',
        o.status || 'Processing'
      ]);
    } else {
      fileName = 'catalog_inventory_report.csv';
      headers = ['SKU', 'Product Name', 'Category ID', 'Brand', 'Price (INR)', 'Stock Level', 'Status'];
      rows = products.map(p => [
        p.sku,
        p.name,
        p.categoryId,
        p.brand,
        p.price,
        p.stock,
        Number(p.stock) === 0 ? 'Out of Stock' : Number(p.stock) <= 5 ? 'Low Stock' : 'In Stock'
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Report generated locally and downloaded!", "success");
  };

  // --- CSV Export Handler ---
  const handleExportCSV = async () => {
    try {
      const reportType = activeTab;
      showNotification(`Initiating ${reportType} report export on backend...`, "success");
      const data = await exportReport(reportType);
      
      if (data && data.exportUrl) {
        let downloadUrl = data.exportUrl;

        const checkResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }).catch(() => null);

        if (checkResponse && checkResponse.ok) {
          const blob = await checkResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = downloadUrl.split('/').pop() || `${reportType}_report.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          showNotification(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported from server successfully!`, "success");
          return;
        }
      }
    } catch (e) {
      console.warn("Backend export failed, falling back to client-side CSV generation:", e);
    }

    generateClientCSV();
  };

  return (
    <div className="reports-mgmt-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`reports-notification ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="reports-mgmt-header">
        <div className="reports-mgmt-title">
          <h1>Analytics & Reports</h1>
          <p>Gain actionable insights from orders sales ledger and catalog inventory levels</p>
        </div>
        <div className="reports-actions">
          <button className="reports-btn secondary" onClick={handleClearCache} title="Clear Cache" disabled={isClearingCache}>
            <Trash2 size={15} /> {isClearingCache ? 'Clearing...' : 'Clear Cache'}
          </button>
          <button className="reports-btn secondary" onClick={() => setShowSettingsModal(true)} title="Settings">
            <Settings size={15} /> Settings
          </button>
          <button className="reports-btn secondary" onClick={loadReportData} title="Refresh Live Data">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="reports-btn primary" onClick={handleExportCSV} title="Export Active Data to CSV">
            <FileSpreadsheet size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs and Date Range Filter */}
      <div className="reports-controls-bar">
        <div className="reports-tabs-wrapper">
          <button
            className={`reports-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={16} /> Orders Analytics
          </button>
          <button
            className={`reports-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Boxes size={16} /> Catalog Analytics
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="reports-date-preset">
            <SlidersHorizontal size={14} className="filter-icon" />
            <button className={`preset-btn ${datePreset === 'All' ? 'active' : ''}`} onClick={() => setDatePreset('All')}>All Time</button>
            <button className={`preset-btn ${datePreset === '7days' ? 'active' : ''}`} onClick={() => setDatePreset('7days')}>Last 7 Days</button>
            <button className={`preset-btn ${datePreset === '30days' ? 'active' : ''}`} onClick={() => setDatePreset('30days')}>Last 30 Days</button>
            <button className={`preset-btn ${datePreset === 'year' ? 'active' : ''}`} onClick={() => setDatePreset('year')}>This Year</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="reports-loading-view">
          <RefreshCw className="spinner" size={40} />
          <p>Analyzing datasets and building visual graphs...</p>
        </div>
      ) : (
        <>
          {activeTab === 'orders' ? (
            /* ==================== ORDERS REPORT ==================== */
            <div className="reports-view-fadein">
              {/* Stats Cards */}
              <div className="reports-stats-grid">
                <div className="reports-stat-card reports-stat-card-clickable" onClick={openOrdersVolumeDrillDown} title="Click to view all revenue orders ledger">
                  <div className="stat-icon revenue"><DollarSign size={20} /></div>
                  <div className="stat-details" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Total Revenue</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{displayStats.revenue}</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openOrdersVolumeDrillDown} title="Click to view all orders volume">
                  <div className="stat-icon orders"><ShoppingBag size={20} /></div>
                  <div className="stat-details" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Orders Volume</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{displayStats.total}</strong>
                  </div>
                </div>

                <div className="reports-stat-card">
                  <div className="stat-icon aov"><TrendingUp size={20} /></div>
                  <div className="stat-details">
                    <span>Average Order Value</span>
                    <strong>{displayStats.aov}</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openUnconfirmedPaymentsDrillDown} title="Click to view detailed list of unconfirmed & pending payment orders">
                  <div className="stat-icon pending"><AlertTriangle size={20} /></div>
                  <div className="stat-details" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Unconfirmed Payments</span>
                      <span className="stat-drilldown-badge highlight">Drill Down ↗</span>
                    </div>
                    <strong style={{ color: '#d97706' }}>{displayStats.pendingPayment}</strong>
                  </div>
                </div>
              </div>

              {/* Charts Sections */}
              <div className="reports-charts-grid">
                {/* Sales Performance Area Graph */}
                <div className="chart-card-widget span-two">
                  <h3>Revenue Performance Trend</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={salesTrendData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `₹${(value / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
                            if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                            return `₹${value}`;
                          }} 
                          width={60} 
                        />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart: Fulfillment breakdown */}
                <div className="chart-card-widget">
                  <h3>Order fulfillment States</h3>
                  <div className="chart-container-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
                            if (percent < 0.04) return null; // Hide labels for very small slices to prevent overlap
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text x={x} y={y} fill="#ffffff" fontSize={11} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                                {value}
                              </text>
                            );
                          }}
                        >
                          {statusPieData.map((entry, index) => {
                            const color = STATUS_COLORS[entry.name] || REPORTS_COLORS[index % REPORTS_COLORS.length];
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip
                          formatter={(val, name) => {
                            const total = statusPieData.reduce((s, i) => s + (Number(i.value) || 0), 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return [`${val} orders (${pct}%)`, name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Custom Non-overlapping Legend */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px 12px',
                      justifyContent: 'center',
                      marginTop: '16px',
                      padding: '0 8px',
                      width: '100%'
                    }}>
                      {statusPieData.map((entry, index) => {
                        const color = STATUS_COLORS[entry.name] || REPORTS_COLORS[index % REPORTS_COLORS.length];
                        const val = entry.value;
                        const total = statusPieData.reduce((s, i) => s + (Number(i.value) || 0), 0);
                        const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                        return (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#334155',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: color,
                              flexShrink: 0
                            }} />
                            <span>{entry.name}: {val} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bar Chart: Payment Methods */}
                <div className="chart-card-widget">
                  <h3>Payment methods distribution</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={paymentBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="Orders" fill="#6366f1" radius={[4, 4, 0, 0]}>
                          {paymentBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={REPORTS_COLORS[(index + 2) % REPORTS_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Orders table */}
              <div className="reports-table-card">
                <h3>Detailed Orders Ledger summary</h3>
                <div className="table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items Count</th>
                        <th>Total Amount</th>
                        <th>Payment Status</th>
                        <th>Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id || o.orderId}>
                          <td>{new Date(o.orderDate || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td><strong>{formatOrderId(o.orderId || o.id)}</strong></td>
                          <td>{o.customerName || o.customer || 'Unknown'}</td>
                          <td>{o.items?.length || 0} {(o.items?.length === 1) ? 'item' : 'items'}</td>
                          <td><strong>{formatCurrency(o.totalAmount || o.total)}</strong></td>
                          <td>
                            <span className={`mini-badge payment-${(o.paymentStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                              {o.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`mini-badge order-${(o.status || 'Processing').toLowerCase()}`}>
                              {o.status || 'Processing'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== CATALOG REPORT ==================== */
            <div className="reports-view-fadein">
              {/* Stats Cards */}
              <div className="reports-stats-grid">
                <div className="reports-stat-card">
                  <div className="stat-icon catalog"><Package size={20} /></div>
                  <div className="stat-details">
                    <span>Total catalog Products</span>
                    <strong>{catalogReport ? catalogStats.totalProducts : `${catalogStats.totalProducts} Items`}</strong>
                  </div>
                </div>

                <div className="reports-stat-card">
                  <div className="stat-icon categories"><FolderTree size={20} /></div>
                  <div className="stat-details">
                    <span>Categories count</span>
                    <strong>{catalogReport ? catalogStats.totalCategories : `${catalogStats.totalCategories} Classes`}</strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openOutOfStockDrillDown} title="Click to view out-of-stock products list">
                  <div className="stat-icon critical"><AlertTriangle size={20} /></div>
                  <div className="stat-details" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Critical Out-of-Stock</span>
                      <span className="stat-drilldown-badge highlight-red">Drill Down ↗</span>
                    </div>
                    <strong style={{ color: '#ef4444' }}>
                      {catalogReport ? catalogStats.outOfStock : `${catalogStats.outOfStock} items`}
                    </strong>
                  </div>
                </div>

                <div className="reports-stat-card reports-stat-card-clickable" onClick={openLowStockDrillDown} title="Click to view low-stock warning products list">
                  <div className="stat-icon warning"><SlidersHorizontal size={20} /></div>
                  <div className="stat-details" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Low Stock Warning</span>
                      <span className="stat-drilldown-badge">Drill Down ↗</span>
                    </div>
                    <strong>{catalogReport ? catalogStats.lowStock : `${catalogStats.lowStock} Items`}</strong>
                  </div>
                </div>
              </div>

              {/* Charts grid */}
              <div className="reports-charts-grid">
                {/* Pie Chart Category allocation */}
                <div className="chart-card-widget">
                  <h3>Category allocation Share</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
                            if (percent < 0.04) return null;
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text x={x} y={y} fill="#ffffff" fontSize={11} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                                {value}
                              </text>
                            );
                          }}
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={REPORTS_COLORS[index % REPORTS_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val, name) => {
                            const total = categoryPieData.reduce((s, i) => s + (Number(i.value) || 0), 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return [`${val} products (${pct}%)`, name];
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={48}
                          iconType="circle"
                          formatter={(value, entry) => {
                            const val = entry.payload?.value ?? 0;
                            const total = categoryPieData.reduce((s, i) => s + (Number(i.value) || 0), 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                            return `${value}: ${val} (${pct}%)`;
                          }}
                          wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stock Level Bar Chart */}
                <div className="chart-card-widget">
                  <h3>Lowest stock Levels alert</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={stockAlertData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="Stock" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                          {stockAlertData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.Stock === 0 ? '#ef4444' : '#f59e0b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Horizontal Bar Chart for Product Performance */}
                <div className="chart-card-widget">
                  <h3>Catalog performance index</h3>
                  <div className="chart-container-inner">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart layout="vertical" data={topProductsRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          type="number" 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `₹${(value / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
                            if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                            return `₹${value}`;
                          }}
                        />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} />
                        <Tooltip formatter={formatPerformanceTooltip} />
                        <Bar dataKey="Value" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Catalog Table */}
              <div className="reports-table-card">
                <h3>Catalog Inventory Summary</h3>
                <div className="table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Brand</th>
                        <th>Selling Price</th>
                        <th>Stock Count</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice((catalogPage - 1) * itemsPerPage, catalogPage * itemsPerPage).map(p => {
                        const stockVal = Number(p.stock || 0);
                        const statusClass = stockVal === 0 ? 'out' : stockVal <= 5 ? 'low' : 'in';
                        const statusText = stockVal === 0 ? 'Out of Stock' : stockVal <= 5 ? 'Low Stock' : 'In Stock';
                        
                        return (
                          <tr key={p.id}>
                            <td><code>{(p.sku || '').trim()}</code></td>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.categoryId}</td>
                            <td>{p.brand}</td>
                            <td><strong>{formatCurrency(p.price)}</strong></td>
                            <td>{stockVal} units</td>
                            <td>
                              <span className={`mini-badge stock-${statusClass}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={catalogPage}
                  totalPages={Math.ceil(products.length / itemsPerPage)}
                  onPageChange={setCatalogPage}
                  totalItems={products.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Interactive Drill-Down Modal */}
      {drillDownModal.isOpen && (
        <div className="reports-modal-overlay" onClick={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}>
          <div className="reports-modal-content drilldown-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div className="drilldown-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em' }}>Analytics Drill-Down</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>{drillDownModal.title}</h2>
              </div>
              <button className="reports-icon-btn" onClick={() => setDrillDownModal({ ...drillDownModal, isOpen: false })} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Filter / Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder={drillDownModal.type === 'orders' ? "Search by Order ID, Customer, Payment Status..." : "Search by SKU, Product Name, Brand..."}
                  value={drillDownSearch}
                  onChange={(e) => setDrillDownSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {drillDownModal.type === 'orders' ? (
                  <button
                    className="reports-btn primary"
                    onClick={() => {
                      setDrillDownModal({ ...drillDownModal, isOpen: false });
                      navigate('/admin/orders');
                    }}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    View in Orders Directory <ExternalLink size={14} />
                  </button>
                ) : (
                  <button
                    className="reports-btn primary"
                    onClick={() => {
                      setDrillDownModal({ ...drillDownModal, isOpen: false });
                      navigate('/admin/products');
                    }}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    View in Products Catalog <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Drill-down Records Counter */}
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
              Showing {filteredDrillDownData.length} {drillDownModal.type === 'orders' ? 'Orders' : 'Products'}
            </div>

            {/* Drill-down Data Table */}
            <div className="table-wrapper" style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              {drillDownModal.type === 'orders' ? (
                <table className="reports-data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Total Amount</th>
                      <th>Payment Status</th>
                      <th>Fulfillment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrillDownData.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          No matching order records found for this drill-down.
                        </td>
                      </tr>
                    ) : (
                      filteredDrillDownData.map((o) => (
                        <tr key={o.id || o.orderId}>
                          <td><strong>{formatOrderId(o.orderId || o.id)}</strong></td>
                          <td>{new Date(o.orderDate || o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>{o.customerName || o.customer || 'Unknown'}</td>
                          <td><strong>{formatCurrency(o.totalAmount || o.total)}</strong></td>
                          <td>
                            <span className={`mini-badge payment-${(o.paymentStatus || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                              {o.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`mini-badge order-${(o.status || 'Processing').toLowerCase()}`}>
                              {o.status || 'Processing'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setDrillDownModal({ ...drillDownModal, isOpen: false });
                                navigate('/admin/orders');
                              }}
                              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              Details <ArrowUpRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="reports-data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrillDownData.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          No matching product records found for this drill-down.
                        </td>
                      </tr>
                    ) : (
                      filteredDrillDownData.slice((drillPage - 1) * itemsPerPage, drillPage * itemsPerPage).map((p) => {
                        const stockVal = Number(p.stock || 0);
                        const statusClass = stockVal === 0 ? 'out' : stockVal <= (settings.lowStockAlertLimit || 5) ? 'low' : 'in';
                        const statusText = stockVal === 0 ? 'Out of Stock' : stockVal <= (settings.lowStockAlertLimit || 5) ? 'Low Stock' : 'In Stock';
                        return (
                          <tr key={p.id || p.sku}>
                            <td><code>{(p.sku || '').trim()}</code></td>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.categoryId}</td>
                            <td>{p.brand}</td>
                            <td><strong>{formatCurrency(p.price)}</strong></td>
                            <td><strong style={{ color: stockVal === 0 ? '#ef4444' : '#f59e0b' }}>{stockVal} units</strong></td>
                            <td>
                              <span className={`mini-badge stock-${statusClass}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
              <Pagination
                currentPage={drillPage}
                totalPages={Math.ceil(filteredDrillDownData.length / itemsPerPage)}
                onPageChange={setDrillPage}
                totalItems={filteredDrillDownData.length}
                itemsPerPage={itemsPerPage}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="reports-btn secondary" onClick={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="reports-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="reports-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Report Settings</h2>
            <p>Customize thresholds and configurations for your analytical reports.</p>
            <form onSubmit={handleSaveSettings}>
              <div className="reports-form-group">
                <label htmlFor="lowStockAlertLimit">Low Stock Alert Limit</label>
                <input
                  id="lowStockAlertLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.lowStockAlertLimit || ''}
                  onChange={(e) => setSettings({ ...settings, lowStockAlertLimit: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="reports-form-group">
                <label htmlFor="defaultCurrency">Default Currency</label>
                <select
                  id="defaultCurrency"
                  value={settings.defaultCurrency || 'INR'}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="reports-modal-actions">
                <button type="button" className="reports-btn secondary" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="reports-btn primary" disabled={isSavingSettings}>
                  {isSavingSettings ? 'Updating...' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsScreen;
