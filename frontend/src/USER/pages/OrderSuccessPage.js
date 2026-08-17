import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOrderSuccessDetails } from '../../services/orderService';
import orderSuccessImg from '../assets/order-success-img.jpg';
import './OrderSuccessPage.css';

const SUCCESS_DETAILS_DISPLAY_MS = 7000;

const OrderSuccessPage = ({
  order,
  formatCurrency,
  onTrackOrder,
  onContinueShopping,
}) => {
  const [backendSuccessDetails, setBackendSuccessDetails] = useState(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    setBackendSuccessDetails(null);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (typeof onContinueShopping === 'function') {
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        onContinueShopping();
      }, SUCCESS_DETAILS_DISPLAY_MS);
    }

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [order?.id, onContinueShopping]);

  useEffect(() => {
    let isMounted = true;
    if (!order?.id) return undefined;

    getOrderSuccessDetails(order.id)
      .then((details) => {
        if (isMounted && details) setBackendSuccessDetails(details);
      })
      .catch((error) => {
        console.error('Unable to load order success details.', error);
      });

    return () => {
      isMounted = false;
    };
  }, [order?.id]);

  const displayOrder = useMemo(() => ({
    ...(order || {}),
    id: backendSuccessDetails?.orderId || backendSuccessDetails?.orderNumber || order?.id,
    total: backendSuccessDetails?.finalAmount ?? backendSuccessDetails?.totalAmount ?? order?.total,
    paymentMethod: backendSuccessDetails?.paymentMethod || order?.paymentMethod,
    paymentStatus: backendSuccessDetails?.paymentStatus || order?.paymentStatus,
    transactionId: backendSuccessDetails?.transactionId || order?.transactionId,
    paymentMessage: backendSuccessDetails?.message || order?.paymentMessage,
  }), [backendSuccessDetails, order]);

  if (!order) return null;

  const handleTrackOrder = () => {
    if (typeof onTrackOrder === 'function') {
      onTrackOrder();
      return;
    }
    window.location.href = `/track-order?orderId=${encodeURIComponent(displayOrder.id)}`;
  };

  const handleContinueShopping = () => {
    if (typeof onContinueShopping === 'function') {
      onContinueShopping();
      return;
    }
    window.location.href = '/products';
  };

  return (
    <div className="order-success-overlay" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
      <div className="order-success-modal order-success-modal-details">

        {/* Professional success image */}
        <div className="order-success-img-wrap">
          <img src={orderSuccessImg} alt="Order Confirmed" className="order-success-img" />
          <div className="order-success-badge">
            <i className="fas fa-check-circle" />
          </div>
        </div>

        <div className="order-success-content">
          <h2 id="order-success-title" className="order-success-title">Order Placed Successfully!</h2>
          <p className="order-success-subtitle">Thank you for your order. We'll deliver it soon.</p>

          <div className="order-success-details">
            {displayOrder.id && (
              <div>
                <span>Order ID</span>
                <strong>#{displayOrder.id}</strong>
              </div>
            )}
            {displayOrder.total != null && (
              <div>
                <span>Total Amount</span>
                <strong>{formatCurrency(displayOrder.total)}</strong>
              </div>
            )}
            {displayOrder.paymentMethod && (
              <div>
                <span>Payment</span>
                <strong>{displayOrder.paymentMethod}</strong>
              </div>
            )}
            {displayOrder.paymentStatus && (
              <div>
                <span>Status</span>
                <strong className="status-success">{displayOrder.paymentStatus}</strong>
              </div>
            )}
          </div>

          <div className="order-success-actions">
            <button type="button" onClick={handleTrackOrder} className="track-order-success-btn">
              <i className="fas fa-route" aria-hidden="true" /> Track Order
            </button>
            <button type="button" onClick={handleContinueShopping} className="continue-shopping-btn">
              Continue Shopping
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccessPage;
