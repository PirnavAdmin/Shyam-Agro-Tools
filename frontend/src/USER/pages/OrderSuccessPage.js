import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OrderSuccessAnimation from '../components/OrderSuccessAnimation';
import { getOrderSuccessDetails } from '../../services/orderService';
import './OrderSuccessPage.css';

const SUCCESS_ANIMATION_WAIT_MS = 5000;
const SUCCESS_DETAILS_DISPLAY_MS = 5000;

const OrderSuccessPage = ({
  order,
  formatCurrency,
  onTrackOrder,
  onContinueShopping,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [backendSuccessDetails, setBackendSuccessDetails] = useState(null);
  const revealTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const revealDetails = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    setShowDetails(true);
  }, []);

  useEffect(() => {
    setShowDetails(false);
    setBackendSuccessDetails(null);
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    revealTimerRef.current = window.setTimeout(() => {
      setShowDetails(true);
      revealTimerRef.current = null;
    }, SUCCESS_ANIMATION_WAIT_MS);

    return () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [order?.id]);

  useEffect(() => {
    if (!showDetails || typeof onContinueShopping !== 'function') return undefined;

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onContinueShopping();
    }, SUCCESS_DETAILS_DISPLAY_MS);

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [onContinueShopping, showDetails]);

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
      <div className={`order-success-modal ${showDetails ? 'order-success-modal-details' : 'order-success-modal-animation'}`}>
        <OrderSuccessAnimation
          key={displayOrder.id}
          className={showDetails ? 'order-success-lottie-complete' : ''}
          speed={1.35}
        />

        {!showDetails && (
          <button type="button" className="order-success-done-btn" onClick={revealDetails} aria-label="Skip animation and show order details">
            DONE
          </button>
        )}

        {showDetails && (
          <div className="order-success-content">
            <h2 id="order-success-title">Order Placed Successfully!</h2>
            <div className="order-success-details">
              <div>
                <span>Order ID</span>
                <strong>{displayOrder.id}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong>{formatCurrency(displayOrder.total)}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{displayOrder.paymentMethod}</strong>
              </div>
              {displayOrder.transactionId && (
                <div>
                  <span>Transaction ID</span>
                  <strong>{displayOrder.transactionId}</strong>
                </div>
              )}
              {displayOrder.paymentStatus && (
                <div>
                  <span>Payment Status</span>
                  <strong>{displayOrder.paymentStatus}</strong>
                </div>
              )}
              {displayOrder.paymentMessage && (
                <div>
                  <span>Message</span>
                  <strong>{displayOrder.paymentMessage}</strong>
                </div>
              )}
            </div>
            <div className="order-success-actions">
              <button type="button" onClick={handleTrackOrder} className="track-order-success-btn">
                <i className="fas fa-route" aria-hidden="true"></i>
                Track Order
              </button>
              <button type="button" onClick={handleContinueShopping} className="continue-shopping-btn">
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessPage;
