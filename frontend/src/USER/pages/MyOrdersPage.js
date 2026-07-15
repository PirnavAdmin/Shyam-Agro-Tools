import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, Headphones, MapPin, Package, RefreshCw, Truck } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getOrderTracking, getOrders } from '../utils/orders';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import { getCurrentUserOrdersFromApi } from '../../services/orderService';
import './MyOrdersPage.css';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getUserMobile = (user) => user?.phone || user?.mobileNumber || user?.MobileNumber || '';

const mergeOrders = (apiOrders = [], localOrders = []) => {
  const merged = new Map();

  [...localOrders, ...apiOrders].forEach((order) => {
    if (order?.id) merged.set(String(order.id), order);
  });

  return Array.from(merged.values()).sort((a, b) => (
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ));
};

const MyOrdersPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [backendOrders, setBackendOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const mobileNumber = getUserMobile(user);
  const orders = useMemo(() => backendOrders, [backendOrders]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0] || null;
  const tracking = selectedOrder ? getOrderTracking(selectedOrder) : null;
  const ordersHeaderText = orders.length > 0 ? 'Here are your orders' : 'No orders placed yet';

  const openSupportForOrder = (orderId, issueType = 'Order issue') => {
    navigate(`/contact-support?orderId=${encodeURIComponent(orderId)}&issue=${encodeURIComponent(issueType)}#contact-us`);
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      if (authLoading) return;
      if (!isAuthenticated) {
        setBackendOrders([]);
        setIsOrdersLoading(false);
        return;
      }

      setIsOrdersLoading(true);
      setOrdersError('');

      try {
        const apiOrders = await getCurrentUserOrdersFromApi();
        const localOrders = getOrders(mobileNumber);
        if (isMounted) setBackendOrders(mergeOrders(apiOrders, localOrders));
      } catch (error) {
        console.error('Unable to refresh orders.', error);
        if (isMounted) {
          const localOrders = getOrders(mobileNumber);
          setBackendOrders(localOrders);
          setOrdersError('');
        }
      } finally {
        if (isMounted) setIsOrdersLoading(false);
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated, mobileNumber]);

  return (
    <div className="my-orders-shell flex min-h-screen flex-col bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="my-orders-container">
        <div className="my-orders-header">
          <span>Account</span>
          <h1>My Orders</h1>
          <p>{ordersHeaderText}</p>
          {isOrdersLoading && (
            <small className="orders-refresh-note"><RefreshCw size={13} className="animate-spin" /> Refreshing orders...</small>
          )}
          {ordersError && <small className="orders-refresh-note warning">{ordersError}</small>}
        </div>

        {orders.length === 0 ? (
          <section className="my-orders-empty">
            <span className="my-orders-empty-icon"><Package size={30} /></span>
            <h2>No orders placed yet</h2>
            <p>Your placed orders will appear here after checkout.</p>
            <button type="button" onClick={() => navigate('/categories')}>Shop Categories</button>
          </section>
        ) : (
          <div className="my-orders-layout">
            <section className="orders-history-panel" aria-label="Order history">
              <div className="orders-panel-title">
                <Package size={18} />
                <h2>Order History</h2>
              </div>

              <div className="orders-history-list">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`order-history-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
                  >
                    <span className="order-history-top">
                      <strong>{order.id}</strong>
                      <span>{order.status || 'Order Placed'}</span>
                    </span>
                    <span className="order-history-products">
                      {(order.items || []).map((item) => item.name).join(', ') || 'Order products'}
                    </span>
                    <span className="order-history-meta">
                      <span><CalendarDays size={14} /> {formatDate(order.createdAt)}</span>
                      <span>{formatCurrency(order.total)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {selectedOrder && (
              <section className="order-detail-panel" aria-label="Order details">
                <div className="order-detail-header">
                  <div>
                    <span>Order Details</span>
                    <h2>{selectedOrder.id}</h2>
                  </div>
                  <div className="order-detail-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/track-order?orderId=${encodeURIComponent(selectedOrder.id)}`)}
                    >
                      <Truck size={16} /> Track
                    </button>
                    <button
                      type="button"
                      onClick={() => openSupportForOrder(selectedOrder.id)}
                    >
                      <Headphones size={16} /> Support
                    </button>
                  </div>
                </div>

                <div className="order-summary-grid">
                  <div><span>Order Date</span><strong>{formatDate(selectedOrder.createdAt)}</strong></div>
                  <div><span>Total Amount</span><strong>{formatCurrency(selectedOrder.total)}</strong></div>
                  <div><span>Payment Status</span><strong>{selectedOrder.paymentStatus || 'Payment Pending'}</strong></div>
                  <div><span>Quantity</span><strong>{(selectedOrder.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong></div>
                </div>

                <div className="ordered-products">
                  <h3>Ordered Products</h3>
                  {(selectedOrder.items || []).map((item) => (
                    <div key={`${selectedOrder.id}-${item.id}`} className="ordered-product-row">
                      <span className="ordered-product-image">
                        <img src={getProductImage(item)} alt={item.name} loading="lazy" onError={handleProductImageError} />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>Qty {item.quantity} x {formatCurrency(item.price)}</small>
                      </span>
                      <b>{formatCurrency(item.total)}</b>
                    </div>
                  ))}
                </div>

                <div className="order-info-grid">
                  <div className="order-info-card">
                    <h3><MapPin size={16} /> Shipping Address</h3>
                    <p>{selectedOrder.shippingAddress?.address || '-'}</p>
                    <p>{[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state, selectedOrder.shippingAddress?.zip].filter(Boolean).join(', ')}</p>
                  </div>
                  <div className="order-info-card">
                    <h3><CreditCard size={16} /> Billing & Payment</h3>
                    <p>{selectedOrder.billingDetails?.name || '-'}</p>
                    <p>{selectedOrder.billingDetails?.email || ''}</p>
                    <p>{selectedOrder.paymentMethod || '-'} · {selectedOrder.paymentStatus || 'Payment Pending'}</p>
                  </div>
                </div>

                {tracking && (
                  <div className="my-order-tracking" style={{ '--order-progress': `${tracking.progressPercent}%` }}>
                    <div className="tracking-title">
                      <h3>Order Tracking</h3>
                      <span>{tracking.status}</span>
                    </div>
                    <div className="tracking-progress" aria-hidden="true">
                      <span></span>
                    </div>
                    <div className="tracking-step-grid">
                      {tracking.steps.map((step, index) => (
                        <div key={step.label} className={`tracking-step-card ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
                          <span>{step.completed ? <i className="fas fa-check"></i> : index + 1}</span>
                          <strong>{step.label}</strong>
                          <small>{step.date}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default MyOrdersPage;
