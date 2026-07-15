import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getOrderById, getOrderTracking } from '../utils/orders';
import { getOrderSuccessTracking } from '../../services/orderService';
import './TrackOrder.css';

const getQueryOrderId = (search) => new URLSearchParams(search).get('orderId') || '';

const buildTrackingData = (orderId, mobileNumber) => {
  if (!orderId) return null;

  const savedOrder = getOrderById(orderId, mobileNumber);
  if (!savedOrder) return null;

  const tracking = getOrderTracking(savedOrder);

  return {
    orderId,
    status: tracking.status,
    activeIndex: tracking.activeIndex,
    progressPercent: tracking.progressPercent,
    total: savedOrder.total,
    paymentMethod: savedOrder.paymentMethod,
    estDelivery: '3-7 business days',
    steps: tracking.steps,
  };
};

const TrackOrder = () => {
  const location = useLocation();
  const queryOrderId = useMemo(() => getQueryOrderId(location.search), [location.search]);
  const { user } = useAuth();
  const mobileNumber = user?.phone || user?.mobileNumber || user?.MobileNumber || '';
  const [orderId, setOrderId] = useState(queryOrderId);
  const [trackingData, setTrackingData] = useState(() => buildTrackingData(queryOrderId, mobileNumber));
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!queryOrderId) return;
    setOrderId(queryOrderId);
    loadTracking(queryOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryOrderId, mobileNumber]);

  const loadTracking = async (targetOrderId) => {
    const trimmedOrderId = String(targetOrderId || '').trim();
    if (!trimmedOrderId) return;
    setIsTrackingLoading(true);

    try {
      const apiTracking = await getOrderSuccessTracking(trimmedOrderId);
      if (apiTracking) {
        setTrackingData({
          orderId: apiTracking.orderId || apiTracking.orderNumber || trimmedOrderId,
          status: apiTracking.status || apiTracking.orderStatus || 'Order Placed',
          activeIndex: 0,
          progressPercent: 0,
          total: apiTracking.finalAmount ?? apiTracking.totalAmount ?? null,
          paymentMethod: apiTracking.paymentMethod || '',
          estDelivery: apiTracking.estimatedDelivery || apiTracking.estDelivery || '3-7 business days',
          steps: getOrderTracking({ status: apiTracking.status || apiTracking.orderStatus || 'Order Placed' }).steps,
        });
        return;
      }

      setTrackingData(buildTrackingData(trimmedOrderId, mobileNumber));
    } catch (error) {
      console.error('Unable to load backend tracking.', error);
      setTrackingData(buildTrackingData(trimmedOrderId, mobileNumber));
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handleTrack = (event) => {
    event.preventDefault();
    loadTracking(orderId);
  };

  return (
    <div className="track-page-shell flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="track-page-container">
        <span className="track-leaf track-leaf-one" aria-hidden="true"></span>
        <span className="track-leaf track-leaf-two" aria-hidden="true"></span>
        <div className="track-card">
          <span className="track-eyebrow">Plant-to-door delivery journey</span>
          <h1>Track Your Shipment</h1>
          <p>
            {queryOrderId
              ? 'Your order tracking details are shown below.'
              : 'Enter your Order ID or Tracking Number to see real-time updates.'}
          </p>

          {!queryOrderId && (
            <form className="track-form" onSubmit={handleTrack}>
              <input
                type="text"
                placeholder="Enter Order ID"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                required
              />
              <button type="submit" className="track-btn" disabled={isTrackingLoading}>
                {isTrackingLoading ? 'Tracking...' : 'Track Order'}
              </button>
            </form>
          )}

          {trackingData ? (
            <div className="tracking-result">
              <div className="tracking-summary">
                <div className="summary-item">
                  <span>Order ID</span>
                  <strong>{trackingData.orderId}</strong>
                </div>
                <div className="summary-item">
                  <span>Current Status</span>
                  <strong className="status-badge">{trackingData.status}</strong>
                </div>
                {trackingData.total !== null && (
                  <div className="summary-item">
                    <span>Total Amount</span>
                    <strong>{formatCurrency(trackingData.total)}</strong>
                  </div>
                )}
                {trackingData.paymentMethod && (
                  <div className="summary-item">
                    <span>Payment Method</span>
                    <strong>{trackingData.paymentMethod}</strong>
                  </div>
                )}
                <div className="summary-item">
                  <span>Est. Delivery</span>
                  <strong>{trackingData.estDelivery}</strong>
                </div>
              </div>

              <div
                className="tracking-timeline"
                style={{ '--track-progress': `${trackingData.progressPercent}%` }}
              >
                {trackingData.steps.map((step, index) => (
                  <div
                    key={step.label}
                    className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
                  >
                    <div className="step-marker">
                      {step.completed ? <i className="fas fa-check"></i> : index + 1}
                    </div>
                    <div className="step-info">
                      <h4>{step.label}</h4>
                      <span>{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-orders-msg">
              <div className="empty-box-icon"><i className="fas fa-seedling"></i></div>
              <h2>No active order selected</h2>
              <p>Place an order or enter your order ID to track the shipment.</p>
              <button className="shop-btn" onClick={() => navigate('/categories')}>Shop products</button>
            </div>
          )}
        </div>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default TrackOrder;
