import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, getOrderById, getOrderTracking } from '../utils/orders';
import { getOrderSuccessTracking } from '../../services/orderService';
import './TrackOrder.css';

const getQueryOrderId = (search) => new URLSearchParams(search).get('orderId') || '';

const STATUS_LABEL_KEYS = {
  'Order Placed': 'orderPlaced',
  Confirmed: 'trackingConfirmed',
  Packed: 'trackingPacked',
  Shipped: 'trackingShipped',
  'Out for Delivery': 'trackingOutForDelivery',
  Delivered: 'trackingDelivered',
};

const STATUS_ALIASES = {
  'order placed': 'Order Placed',
  ordered: 'Order Placed',
  pending: 'Order Placed',
  placed: 'Order Placed',
  '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D \u0C07\u0C35\u0C4D\u0C35\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F': 'Order Placed',
  '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F': 'Order Placed',
  '\u0911\u0930\u094D\u0921\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E': 'Order Placed',
  confirmed: 'Confirmed',
  '\u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F': 'Confirmed',
  '\u092A\u0941\u0937\u094D\u091F\u093F \u0939\u094B \u0917\u0908': 'Confirmed',
  packed: 'Packed',
  '\u0C2A\u0C4D\u0C2F\u0C3E\u0C15\u0C4D \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F': 'Packed',
  '\u092A\u0948\u0915 \u0915\u093F\u092F\u093E \u0917\u092F\u093E': 'Packed',
  shipped: 'Shipped',
  dispatched: 'Shipped',
  '\u0C30\u0C35\u0C3E\u0C23\u0C3E \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F': 'Shipped',
  '\u092D\u0947\u091C \u0926\u093F\u092F\u093E \u0917\u092F\u093E': 'Shipped',
  'out for delivery': 'Out for Delivery',
  '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C40\u0C15\u0C3F \u0C2C\u0C2F\u0C32\u0C41\u0C26\u0C47\u0C30\u0C3F\u0C02\u0C26\u0C3F': 'Out for Delivery',
  '\u0921\u093F\u0932\u0940\u0935\u0930\u0940 \u0915\u0947 \u0932\u093F\u090F \u0928\u093F\u0915\u0932\u093E': 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Delivered',
  '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C4D \u0C05\u0C2F\u0C3F\u0C02\u0C26\u0C3F': 'Delivered',
  '\u0921\u093F\u0932\u0940\u0935\u0930 \u0939\u094B \u0917\u092F\u093E': 'Delivered',
};

const normalizeLookup = (value) => String(value || '').trim().toLowerCase();
const getCanonicalStatus = (status) => STATUS_ALIASES[normalizeLookup(status)] || status || 'Order Placed';

const translateStatus = (status, t) => {
  const canonicalStatus = getCanonicalStatus(status);
  return t(STATUS_LABEL_KEYS[canonicalStatus] || '') || canonicalStatus;
};

const translatePaymentMethod = (paymentMethod, t) => {
  const normalized = normalizeLookup(paymentMethod);
  if (!normalized) return '';
  if (['cod', 'cash on delivery'].includes(normalized)) return t('cashOnDelivery');
  if (normalized.includes('upi')) return t('netBankingUpi');
  if (normalized.includes('card')) return t('cardPayment');
  if (normalized.includes('bank')) return t('bankTransfer');
  return paymentMethod;
};

const translateDeliveryEstimate = (estimate, t) => {
  const normalized = normalizeLookup(estimate);
  if (!normalized || normalized === '3-7 business days') return t('trackingEstimatedDeliveryValue');
  return estimate;
};

const buildTrackingData = (orderId, mobileNumber) => {
  if (!orderId) return null;

  const savedOrder = getOrderById(orderId, mobileNumber);
  if (!savedOrder) return null;

  const status = getCanonicalStatus(savedOrder.status || 'Order Placed');
  const tracking = getOrderTracking({ ...savedOrder, status });

  return {
    orderId,
    status,
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
  const { t } = useLanguage();
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
        const status = getCanonicalStatus(apiTracking.status || apiTracking.orderStatus || 'Order Placed');
        const tracking = getOrderTracking({ status });
        setTrackingData({
          orderId: apiTracking.orderId || apiTracking.orderNumber || trimmedOrderId,
          status,
          activeIndex: tracking.activeIndex,
          progressPercent: tracking.progressPercent,
          total: apiTracking.finalAmount ?? apiTracking.totalAmount ?? null,
          paymentMethod: apiTracking.paymentMethod || '',
          estDelivery: apiTracking.estimatedDelivery || apiTracking.estDelivery || '3-7 business days',
          steps: tracking.steps,
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
          <span className="track-eyebrow">{t('trackingEyebrow')}</span>
          <h1>{t('trackYourShipment')}</h1>
          <p>
            {queryOrderId
              ? t('trackingDetailsShown')
              : t('trackingEnterDetails')}
          </p>

          {!queryOrderId && (
            <form className="track-form" onSubmit={handleTrack}>
              <input
                type="text"
                placeholder={t('enterOrderId')}
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                required
              />
              <button type="submit" className="track-btn" disabled={isTrackingLoading}>
                {isTrackingLoading ? t('trackingInProgress') : t('trackOrder')}
              </button>
            </form>
          )}

          {trackingData ? (
            <div className="tracking-result">
              <div className="tracking-summary">
                <div className="summary-item">
                  <span>{t('orderId')}</span>
                  <strong>{trackingData.orderId}</strong>
                </div>
                <div className="summary-item">
                  <span>{t('currentStatus')}</span>
                  <strong className="status-badge">{translateStatus(trackingData.status, t)}</strong>
                </div>
                {trackingData.total !== null && (
                  <div className="summary-item">
                    <span>{t('totalAmount')}</span>
                    <strong>{formatCurrency(trackingData.total)}</strong>
                  </div>
                )}
                {trackingData.paymentMethod && (
                  <div className="summary-item">
                    <span>{t('paymentMethod')}</span>
                    <strong>{translatePaymentMethod(trackingData.paymentMethod, t)}</strong>
                  </div>
                )}
                <div className="summary-item">
                  <span>{t('estDelivery')}</span>
                  <strong>{translateDeliveryEstimate(trackingData.estDelivery, t)}</strong>
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
                      <h4>{translateStatus(step.label, t)}</h4>
                      <span>{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-orders-msg">
              <div className="empty-box-icon"><i className="fas fa-seedling"></i></div>
              <h2>{t('noActiveOrderSelected')}</h2>
              <p>{t('placeOrderOrEnterOrderId')}</p>
              <button className="shop-btn" onClick={() => navigate('/categories')}>{t('shopProducts')}</button>
            </div>
          )}
        </div>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default TrackOrder;
