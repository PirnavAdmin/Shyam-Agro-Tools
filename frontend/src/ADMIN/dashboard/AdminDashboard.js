import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'recharts';
import {
  CheckCircle2,
  Clock3,
  Download,
  ShoppingBag,
  Truck,
  Users,
  XCircle,
  TrendingUp,
  Package,
  Shield,
  FileText,
  Boxes,
  RefreshCw
} from 'lucide-react';
import { getOrders } from '../api/orders';
import { fetchProducts, fetchCategories } from '../catalog/productsApi';
import { fetchSuppliers } from '../suppliers/suppliersApi';
import './AdminDashboard.css';

const numberFormatter = new Intl.NumberFormat('en-IN');
const formatCurrency = (value) => `INR ${numberFormatter.format(value)}`;

// Fallback dataset for a populated dashboard view when database is empty
const MOCK_FALLBACK = {
  salesSeries: [
    { name: 'Week 1', value: 62000 },
    { name: 'Week 2', value: 78500 },
    { name: 'Week 3', value: 112000 },
    { name: 'Week 4', value: 127400 },
  ],
  categorySeries: [
    { name: 'Farm Tools', value: 35, color: '#2563eb' },
    { name: 'Irrigation', value: 24, color: '#0891b2' },
    { name: 'Machinery', value: 18, color: '#16a34a' },
    { name: 'Seeds & Inputs', value: 15, color: '#f59e0b' },
    { name: 'Safety Gear', value: 8, color: '#ec4899' },
  ],
  insights: [
    { type: 'success', text: 'Irrigation kits are currently leading catalog conversions' },
    { type: 'warning', text: 'Ensure cultivator accessories are restocked soon' },
    { type: 'info', text: 'Three bulk orders are currently awaiting UTR confirmation' }
  ]
};

const buildCsv = (rows) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');

const statusIconMap = {
  Pending: Clock3,
  Processing: Clock3,
  'On Hold': Clock3,
  Completed: CheckCircle2,
  Canceled: XCircle,
};

const statusClassName = (status) => (status || 'Pending').toLowerCase().replace(/\s+/g, '-');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [brandsCount, setBrandsCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, categoriesData, suppliersData] = await Promise.all([
        getOrders().catch(() => []),
        fetchProducts().catch(() => []),
        fetchCategories().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);

      setOrders(ordersData || []);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setSuppliers(suppliersData || []);

      // Fetch brands count
      try {
        const brandRes = await fetch('https://wildlife-unwieldy-devotee.ngrok-free.dev/api/Brand', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (brandRes.ok) {
          const brandJson = await brandRes.json();
          if (Array.isArray(brandJson)) {
            setBrandsCount(brandJson.length);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch brands count", err);
      }

      // Fetch staff count
      try {
        const staffRes = await fetch('https://satin-eastcoast-musky.ngrok-free.dev/api/Staff', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (staffRes.ok) {
          const staffJson = await staffRes.json();
          const staffList = Array.isArray(staffJson) ? staffJson : (staffJson.data || staffJson.value || []);
          setStaffCount(staffList.length);
        }
      } catch (err) {
        console.warn("Failed to fetch staff count", err);
      }
    } catch (error) {
      console.error("Dashboard loading error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute key summary statistics
  const metrics = useMemo(() => {
    const totalSalesVal = orders
      .filter(o => o.status !== 'Canceled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const activeOrdersCount = orders.filter(o => o.status === 'Processing' || o.status === 'Pending' || o.status === 'On Hold').length;
    const lowStockCount = products.filter(p => Number(p.stock) <= 5).length;
    const pendingSuppliersCount = suppliers.filter(s => s.status === 'Pending').length;

    // Fulfillment Rate
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const totalNonCanceled = orders.filter(o => o.status !== 'Canceled').length;
    const fulfillmentRate = totalNonCanceled > 0 ? Math.round((completedOrders / totalNonCanceled) * 100) : 100;

    return {
      totalSales: totalSalesVal,
      totalOrders: orders.length,
      productsCount: products.length,
      suppliersCount: suppliers.length,
      activeOrdersCount,
      lowStockCount,
      pendingSuppliersCount,
      fulfillmentRate
    };
  }, [orders, products, suppliers]);

  // Chart Data preparation
  const salesSeriesData = useMemo(() => {
    if (orders.length === 0) return MOCK_FALLBACK.salesSeries;

    // Group sales by day of order
    const dailySalesMap = {};
    orders.forEach(o => {
      if (o.status === 'Canceled') return;
      const date = o.orderDate ? new Date(o.orderDate) : new Date();
      const label = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      dailySalesMap[label] = (dailySalesMap[label] || 0) + (Number(o.totalAmount) || 0);
    });

    const series = Object.entries(dailySalesMap).map(([name, value]) => ({ name, value }));
    return series.length > 1 ? series.slice(-6) : [
      { name: 'Today', value: metrics.totalSales }
    ];
  }, [orders, metrics.totalSales]);

  const orderStatusSeriesData = useMemo(() => {
    if (orders.length === 0) {
      return [
        { name: 'Completed', value: 3, color: '#10b981' },
        { name: 'Processing', value: 4, color: '#2563eb' },
        { name: 'Pending', value: 2, color: '#f59e0b' }
      ];
    }
    const counts = { Completed: 0, Processing: 0, Pending: 0, 'On Hold': 0, Canceled: 0 };
    orders.forEach(o => {
      const status = o.status || 'Pending';
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts.Pending++;
      }
    });

    const colors = { Completed: '#10b981', Processing: '#2563eb', Pending: '#f59e0b', 'On Hold': '#8b5cf6', Canceled: '#ef4444' };
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: colors[name] }))
      .filter(item => item.value > 0);
  }, [orders]);

  const categorySeriesData = useMemo(() => {
    if (categories.length === 0 || products.length === 0) return MOCK_FALLBACK.categorySeries;

    const counts = {};
    products.forEach(p => {
      const cat = categories.find(c => String(c.id) === String(p.categoryId));
      const catName = cat ? cat.name : 'Other';
      counts[catName] = (counts[catName] || 0) + 1;
    });

    const colors = ['#2563eb', '#0891b2', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [categories, products]);

  // System dynamic activity list
  const recentActivitiesList = useMemo(() => {
    const act = [];
    orders.slice(0, 3).forEach(o => {
      const dateStr = o.orderDate ? new Date(o.orderDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recently';
      act.push({
        time: dateStr,
        title: 'Order Placed',
        detail: `${o.customerName || 'Customer'} placed order #${o.id || o.orderId} of ${formatCurrency(o.totalAmount)}`,
        type: 'order'
      });
    });
    products.slice(0, 2).forEach(p => {
      act.push({
        time: 'Catalog',
        title: 'Product Added',
        detail: `${p.name} (SKU: ${p.sku}) is now available.`,
        type: 'product'
      });
    });
    suppliers.slice(0, 2).forEach(s => {
      act.push({
        time: 'Suppliers',
        title: 'Supplier Added',
        detail: `${s.name} category: ${s.category || 'General'}.`,
        type: 'supplier'
      });
    });
    return act.slice(0, 5);
  }, [orders, products, suppliers]);

  // Insights / Action list
  const systemInsights = useMemo(() => {
    const list = [];
    if (metrics.lowStockCount > 0) {
      list.push({ type: 'warning', text: `${metrics.lowStockCount} products are below reorder stock levels` });
    }
    if (metrics.pendingSuppliersCount > 0) {
      list.push({ type: 'info', text: `${metrics.pendingSuppliersCount} supplier applications are pending verification review` });
    }
    const pendingVerificationOrders = orders.filter(o => o.paymentStatus === 'Pending Verification').length;
    if (pendingVerificationOrders > 0) {
      list.push({ type: 'warning', text: `${pendingVerificationOrders} orders require manual payment receipt UTR verification` });
    }
    if (list.length === 0) {
      return MOCK_FALLBACK.insights;
    }
    return list;
  }, [metrics, orders]);

  // CSV Exporter
  const handleExport = () => {
    const rows = [
      ['Dashboard Summary Export', '', ''],
      ['Export Date', new Date().toLocaleDateString(), ''],
      [],
      ['Core Metrics', 'Value', 'Context'],
      ['Total Sales Revenue', formatCurrency(metrics.totalSales), 'All non-canceled orders'],
      ['Total Orders Recorded', metrics.totalOrders, ''],
      ['Catalog Product Count', metrics.productsCount, ''],
      ['Registered Supplier Count', metrics.suppliersCount, ''],
      ['Staff Members Count', staffCount, ''],
      [],
      ['Fulfillment Summary', 'Count', 'Percentage'],
      ['Completed Orders', orders.filter(o => o.status === 'Completed').length, ''],
      ['Processing Orders', orders.filter(o => o.status === 'Processing').length, ''],
      ['Pending Orders', orders.filter(o => o.status === 'Pending').length, ''],
      ['Canceled Orders', orders.filter(o => o.status === 'Canceled').length, ''],
      ['Order Fulfillment Rate', `${metrics.fulfillmentRate}%`, ''],
      [],
      ['Category Distribution', 'Products Count', ''],
      ...categorySeriesData.map(c => [c.name, c.value, ''])
    ];

    const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shyam-agro-dashboard-report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
        <RefreshCw size={28} className="loading-spinner" style={{ animation: 'spin 1.5s linear infinite', color: '#2636b6' }} />
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Loading Dashboard Insights...</span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <section className="dashboard-hero">
        <div className="dashboard-heading">
          <span className="dashboard-eyebrow">Storefront Management Console</span>
          <h1>Admin Overview</h1>
          <p>Real-time orders metrics, product catalog stats, supplier statuses, and employee operations for Shyam Agro Tools.</p>
        </div>

        <div className="dashboard-controls" aria-label="Dashboard controls">
          <button type="button" className="export-button" onClick={handleExport}>
            <Download size={16} aria-hidden="true" />
            Export CSV Report
          </button>
        </div>
      </section>

      {/* Operations Quick Stats */}
      <section className="operations-grid" aria-label="Operations snapshot">
        <div className="operation-tile">
          <div className="tile-icon tile-icon--blue">
            <Truck size={20} aria-hidden="true" />
          </div>
          <div>
            <span>Active Orders</span>
            <strong>{metrics.activeOrdersCount}</strong>
            <p>Awaiting fulfillment pack</p>
          </div>
        </div>

        <div className="operation-tile">
          <div className="tile-icon tile-icon--amber">
            <Boxes size={20} aria-hidden="true" />
          </div>
          <div>
            <span>Stock Alerts</span>
            <strong>{metrics.lowStockCount}</strong>
            <p>Items below reorder levels</p>
          </div>
        </div>

        <div className="operation-tile">
          <div className="tile-icon tile-icon--red">
            <Users size={20} aria-hidden="true" />
          </div>
          <div>
            <span>New Suppliers</span>
            <strong>{metrics.pendingSuppliersCount}</strong>
            <p>Applications in verification</p>
          </div>
        </div>

        <div className="operation-tile">
          <div className="tile-icon tile-icon--green">
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <div>
            <span>Fulfillment Rate</span>
            <strong>{metrics.fulfillmentRate}%</strong>
            <p>Orders successfully completed</p>
          </div>
        </div>
      </section>

      {/* Metrics Cards */}
      <section className="metric-grid" aria-label="Performance metrics">
        <article className="metric-card">
          <div className="metric-card__top">
            <div className="metric-icon metric-icon--green">
              <ShoppingBag size={22} aria-hidden="true" />
            </div>
            <span className="trend-pill trend-pill--up">
              <TrendingUp size={14} aria-hidden="true" />
              Live
            </span>
          </div>
          <span className="metric-title">TOTAL REVENUE</span>
          <strong>{formatCurrency(metrics.totalSales)}</strong>
          <p>Excluding canceled orders</p>
        </article>

        <article className="metric-card">
          <div className="metric-card__top">
            <div className="metric-icon metric-icon--blue">
              <FileText size={22} aria-hidden="true" />
            </div>
          </div>
          <span className="metric-title">TOTAL ORDERS</span>
          <strong>{metrics.totalOrders}</strong>
          <p>Total logged purchases</p>
        </article>

        <article className="metric-card">
          <div className="metric-card__top">
            <div className="metric-icon metric-icon--amber">
              <Package size={22} aria-hidden="true" />
            </div>
          </div>
          <span className="metric-title">CATALOG PRODUCTS</span>
          <strong>{metrics.productsCount}</strong>
          <p>Across {categories.length} categories</p>
        </article>

        <article className="metric-card">
          <div className="metric-card__top">
            <div className="metric-icon metric-icon--red">
              <Shield size={22} aria-hidden="true" />
            </div>
          </div>
          <span className="metric-title">STAFF DIRECTORY</span>
          <strong>{staffCount}</strong>
          <p>Authorized console users</p>
        </article>
      </section>

      {/* Main Charts Row */}
      <section className="dashboard-grid dashboard-grid--main">
        <article className="dashboard-panel revenue-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Income overview</span>
              <h2>Revenue Distribution</h2>
            </div>
            <span className="panel-badge">Sales Value</span>
          </div>

          <div className="chart-shell">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesSeriesData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="value" fill="#2636b6" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-panel active-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <div>
              <span className="section-kicker">Fulfillment mix</span>
              <h2>Orders Status</h2>
            </div>
          </div>

          {orderStatusSeriesData.length > 0 ? (
            <div className="donut-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={orderStatusSeriesData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {orderStatusSeriesData.map((status, idx) => (
                      <Cell key={`cell-${idx}`} fill={status.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center" style={{ width: '100px' }}>
                <span>Total</span>
                <strong>{metrics.totalOrders}</strong>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#64748b' }}>
              No order data available.
            </div>
          )}

          <div className="order-status-list" style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px 12px', justifyContent: 'center' }}>
            {orderStatusSeriesData.map((status, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '500', color: '#334155' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color }} />
                <span>{status.name}: {status.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Traffic/Category Distribution and timeline */}
      <section className="dashboard-grid dashboard-grid--traffic">
        <article className="dashboard-panel traffic-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Catalog Spread</span>
              <h2>Products by Category</h2>
            </div>
          </div>

          <div className="traffic-layout">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categorySeriesData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categorySeriesData.map((category, idx) => (
                      <Cell key={`cell-${idx}`} fill={category.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Products']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center" style={{ width: '90px' }}>
                <span>Total</span>
                <strong>{metrics.productsCount}</strong>
              </div>
            </div>

            <div className="traffic-list">
              {categorySeriesData.slice(0, 5).map((category, idx) => {
                const percentage = metrics.productsCount > 0 ? Math.round((category.value / metrics.productsCount) * 100) : 0;
                return (
                  <div className="traffic-row" key={idx}>
                    <div className="traffic-source">
                      <span className="source-dot" style={{ backgroundColor: category.color }} />
                      <div>
                        <strong>{category.name}</strong>
                      </div>
                    </div>
                    <div className="traffic-value">
                      <strong>{category.value} Items</strong>
                      <span>{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="dashboard-panel timeline-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Audit trail</span>
              <h2>Recent Activities</h2>
            </div>
          </div>

          <div className="activity-list">
            {recentActivitiesList.length > 0 ? (
              recentActivitiesList.map((activity, idx) => (
                <div className="activity-item" key={idx}>
                  <span className="activity-time">{activity.time}</span>
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                No recent system logs.
              </div>
            )}
          </div>
        </article>
      </section>

      {/* Recent Orders table */}
      <section className="dashboard-panel orders-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">Fulfillment Pipeline</span>
            <h2>Recent Orders</h2>
          </div>
          <button type="button" className="catalog-btn" onClick={() => navigate('/admin/orders/list')} style={{ padding: '4px 10px', fontSize: '12px', minHeight: 'auto' }}>
            View All Orders
          </button>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Payment Status</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.slice(0, 5).map((order) => {
                  const StatusIcon = statusIconMap[order.status] || Clock3;
                  const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                  const customerInitials = order.customerName ? order.customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AG';

                  return (
                    <tr key={order.id || order.orderId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/orders/details/${order.id || order.orderId}`)}>
                      <td className="order-id">{order.id || order.orderId}</td>
                      <td>
                        <span className={`status-tag status-tag--${statusClassName(order.status)}`}>
                          <StatusIcon size={13} aria-hidden="true" />
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span className="avatar-circle">{customerInitials}</span>
                          <strong>{order.customerName}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: order.paymentStatus === 'Paid' ? '#dcfce7' : order.paymentStatus === 'Pending Verification' ? '#fff7df' : '#fee2e2',
                          color: order.paymentStatus === 'Paid' ? '#15803d' : order.paymentStatus === 'Pending Verification' ? '#b45309' : '#b91c1c'
                        }}>
                          {order.paymentStatus || 'Unpaid'}
                        </span>
                      </td>
                      <td>{dateStr}</td>
                      <td className="amount-cell">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No orders registered in the system. Go to storefront to place order first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Insights Roster */}
      <section className="dashboard-grid dashboard-grid--bottom">
        <article className="dashboard-panel review-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">Catalog stats</span>
              <h2>Registered Suppliers</h2>
            </div>
            <button type="button" className="catalog-btn" onClick={() => navigate('/admin/suppliers/list')} style={{ padding: '4px 10px', fontSize: '12px', minHeight: 'auto' }}>
              View Suppliers
            </button>
          </div>

          <div className="reviews-list">
            {suppliers.length > 0 ? (
              suppliers.slice(0, 4).map((s, idx) => (
                <div className="review-row" key={idx} style={{ padding: '12px 0' }}>
                  <div>
                    <strong>{s.name}</strong>
                    <span>Contact: {s.contactPerson || 'N/A'} | {s.phone || 'N/A'}</span>
                  </div>
                  <span className={`status-tag status-tag--${s.status === 'Verified' ? 'completed' : 'pending'}`} style={{ minHeight: 'auto', padding: '2px 8px', fontSize: '11px' }}>
                    {s.status}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                No suppliers registered.
              </div>
            )}
          </div>
        </article>

        <article className="dashboard-panel insight-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">System alerts</span>
              <h2>Fulfillment Insights</h2>
            </div>
          </div>

          <div className="insight-list">
            {systemInsights.map((insight, idx) => {
              const markerClass = insight.type === 'warning' ? 'insight-marker--amber' : insight.type === 'error' ? 'insight-marker--red' : 'insight-marker--green';
              return (
                <div className="insight-item" key={idx} style={{ padding: '12px 0' }}>
                  <span className={`insight-marker ${markerClass}`} style={{
                    backgroundColor: insight.type === 'warning' ? '#d97706' : insight.type === 'error' ? '#ef4444' : '#2636b6'
                  }} />
                  <div>
                    <strong>{insight.text}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
