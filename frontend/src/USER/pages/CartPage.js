import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import MarketplaceBanner from '../components/MarketplaceBanner';
import TaxInfoPopup from '../components/TaxInfoPopup';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getCheckoutSummary, validateCartStock } from '../../services/cartCheckoutService';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import './CartWishlistPerformance.css';

const couponMinimumFields = [
  'minimumOrderAmount',
  'minimumCartAmount',
  'minimumCartValue',
  'minimumPurchaseAmount',
  'minOrderAmount',
  'minCartAmount',
  'minCartValue',
  'minPurchaseAmount',
  'minSubtotal',
];

const couponRemainingFields = [
  'amountToAdd',
  'amountNeeded',
  'amountRequired',
  'additionalAmountRequired',
  'remainingAmount',
  'requiredMore',
  'shortfall',
  'cartShortfall',
];

const getNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number : null;
};

const findCouponValue = (source, fieldNames) => {
  if (!source || typeof source !== 'object') return null;
  const normalizedFields = fieldNames.map((field) => field.toLowerCase());
  const queue = [source];
  const seen = new Set();

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || typeof item !== 'object' || seen.has(item)) continue;
    seen.add(item);

    for (const [key, value] of Object.entries(item)) {
      if (normalizedFields.includes(key.toLowerCase())) {
        const number = getNumericValue(value);
        if (number !== null) return number;
      }

      if (value && typeof value === 'object') queue.push(value);
    }
  }

  return null;
};

const getCouponRequirementMessage = ({ couponCode, currentSubtotal, responseData, fallbackMessage }) => {
  const remainingFromApi = findCouponValue(responseData, couponRemainingFields);
  const minimumFromApi = findCouponValue(responseData, couponMinimumFields);
  const message = typeof fallbackMessage === 'string' ? fallbackMessage : '';
  const amountMatches = message.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d+)?)/gi) || [];
  const messageAmounts = amountMatches
    .map(getNumericValue)
    .filter((value) => value !== null && value > 0);
  const messageRemainingMatch = message.match(/(?:add|spend|shop|buy)[^\d₹]*(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d+)?)[^.]*(?:more|extra|additional)/i);
  const messageRemaining = getNumericValue(messageRemainingMatch?.[1]);
  const messageMinimum = messageAmounts.find((value) => value > currentSubtotal);
  const amountToAdd = remainingFromApi ?? (
    minimumFromApi !== null ? minimumFromApi - currentSubtotal : null
  ) ?? (
    messageRemaining !== null ? messageRemaining : null
  ) ?? (
    messageMinimum ? messageMinimum - currentSubtotal : null
  );

  if (amountToAdd !== null && amountToAdd > 0) {
    const formattedAmount = Math.ceil(amountToAdd).toLocaleString();
    return `Add ₹${formattedAmount} more to use ${couponCode}.`;
  }

  return message || 'This coupon is not valid for your current cart.';
};

const CartPage = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    isCartLoading,
    isCartMutating,
    cartError,
    clearCart,
    refreshCart,
    waitForCartSync,
  } = useCart();
  const { t, productText } = useLanguage();
  const { showToast } = useToast();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [cartSummary, setCartSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponStatus, setCouponStatus] = useState('');
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [stockError, setStockError] = useState('');
  const [unavailableProductIds, setUnavailableProductIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    refreshCart().catch(() => undefined);
    // Always re-fetch from the backend when the cart route opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadSummary = async () => {
      if (isCartLoading || cartItems.length === 0) {
        setCartSummary(null);
        setSummaryError('');
        return;
      }

      setIsSummaryLoading(true);
      setSummaryError('');
      try {
        await waitForCartSync();
        const summary = await getCheckoutSummary({ couponCode: appliedCoupon?.code || '' });
        if (isActive) {
          setCartSummary(summary);

          if (appliedCoupon?.code) {
            if (Number(summary?.couponDiscount ?? 0) <= 0) {
              setCouponMessage(getCouponRequirementMessage({
                couponCode: appliedCoupon.code,
                currentSubtotal: Number(summary?.subTotal ?? cartSubtotal),
                responseData: summary,
                fallbackMessage: summary?.message,
              }));
              setCouponStatus('error');
            } else if (couponStatus === 'error') {
              setCouponMessage('');
              setCouponStatus('');
            }
          }
        }
      } catch (error) {
        console.error('Unable to load cart summary.', error);
        if (isActive) setSummaryError('Unable to refresh cart totals. Please try again.');
      } finally {
        if (isActive) setIsSummaryLoading(false);
      }
    };

    loadSummary();
    return () => {
      isActive = false;
    };
  }, [appliedCoupon?.code, cartItems, cartSubtotal, couponStatus, isCartLoading, waitForCartSync]);

  const summarySubtotal = Number(cartSummary?.subTotal ?? 0);
  const itemSubtotal = summarySubtotal > 0 ? summarySubtotal : cartSubtotal;
  const deliveryCharge = Number(cartSummary?.shippingCharges ?? 0);
  const taxableAmount = itemSubtotal;
  const gst = Number(cartSummary?.tax ?? 0);
  const cgst = gst / 2;
  const sgst = gst - cgst;
  const coinsUsed = Math.max(Number(cartSummary?.coinsDiscount ?? 0), 0);
  const couponDiscount = Math.max(Number(cartSummary?.couponDiscount ?? 0), 0);
  const backendGrandTotal = Number(cartSummary?.grandTotal ?? 0);
  const grandTotal = backendGrandTotal > 0
    ? backendGrandTotal
    : Math.max(itemSubtotal + deliveryCharge + gst - coinsUsed - couponDiscount, 0);

  const handleCouponChange = (event) => {
    setCoupon(event.target.value.toUpperCase());
    setCouponMessage('');
    setCouponStatus('');
  };

  const handleApplyCoupon = async () => {
    const couponCode = coupon.trim().toUpperCase();

    if (!couponCode) {
      setCouponMessage(t('invalidCouponCode'));
      setCouponStatus('error');
      return;
    }

    if (appliedCoupon?.code === couponCode) {
      if (couponDiscount > 0) {
        setCouponMessage(t('couponAlreadyApplied'));
        setCouponStatus('error');
      } else {
        setCouponMessage(getCouponRequirementMessage({
          couponCode,
          currentSubtotal: itemSubtotal,
          responseData: cartSummary,
          fallbackMessage: cartSummary?.message,
        }));
        setCouponStatus('error');
      }
      return;
    }

    setIsSummaryLoading(true);
    try {
      const summary = await getCheckoutSummary({ couponCode });
      if (Number(summary?.couponDiscount ?? 0) <= 0) {
        setCartSummary(summary);
        setCoupon(couponCode);
        setCouponMessage(getCouponRequirementMessage({
          couponCode,
          currentSubtotal: Number(summary?.subTotal ?? itemSubtotal),
          responseData: summary,
          fallbackMessage: summary?.message,
        }));
        setCouponStatus('error');
        return;
      }
      setCartSummary(summary);
      setAppliedCoupon({ code: couponCode });
      setCoupon(couponCode);
      setCouponMessage(t('couponAppliedSuccessfully'));
      setCouponStatus('success');
      showToast(t('couponAppliedSuccessfully'));
    } catch (error) {
      const responseData = error.response?.data?.data ?? error.response?.data;
      const fallbackMessage = error.response?.data?.message || error.message || t('invalidCouponCode');
      setCouponMessage(getCouponRequirementMessage({
        couponCode,
        currentSubtotal: itemSubtotal,
        responseData,
        fallbackMessage,
      }));
      setCouponStatus('error');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0) {
      showToast(t('emptyCart'), 'error');
      return;
    }

    setIsValidatingStock(true);
    setStockError('');
    try {
      const result = await validateCartStock();
      const unavailableItems = result?.unavailableItems || result?.outOfStockItems || result?.items?.filter(
        (item) => item.isAvailable === false || item.inStock === false
      ) || [];
      const unavailableIds = new Set(unavailableItems.map((item) => String(item.productId ?? item.id)));
      const isValid = result?.isValid ?? result?.valid ?? result?.success ?? unavailableIds.size === 0;
      setUnavailableProductIds(unavailableIds);
      if (!isValid || unavailableIds.size > 0) {
        setStockError('Some items are out of stock.');
        return;
      }
      navigate('/checkout', {
        state: { appliedCoupon, couponDiscount, coinsUsed },
      });
    } catch (error) {
      console.error('Unable to validate cart stock.', error);
      setStockError(error.response?.data?.message || 'Unable to validate stock. Please try again.');
    } finally {
      setIsValidatingStock(false);
    }
  };

  return (
    <div className="cart-wishlist-page flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />
      
      {/* Page Header */}
      <section className="bg-dark px-4 py-7 md:py-10">
        <div className="max-w-[1440px] mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-xs font-bold uppercase tracking-[4px] text-primary"
          >
            {t('shoppingSession')}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold uppercase tracking-tight text-white md:text-4xl"
          >
            {t('yourCart')} <span className="text-primary">({cartItems.length})</span>
          </motion.h1>
        </div>
      </section>

      <main className="cart-wishlist-main mx-auto w-full max-w-[1440px] flex-grow px-3 py-5 md:px-6 md:py-8 lg:px-10">
        <AnimatePresence mode="wait">
          {isCartLoading ? (
            <div className="border border-border bg-white px-5 py-8 text-center text-sm font-bold text-gray-500 shadow-sm">
              Loading your cart...
            </div>
          ) : cartError ? (
            <div className="border border-border bg-white px-5 py-8 text-center text-sm font-bold text-red-500 shadow-sm">
              {cartError}
            </div>
          ) : cartItems.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center border border-border bg-white px-5 py-8 text-center shadow-sm md:px-8 md:py-10"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-light text-gray-300">
                <ShoppingBag size={32} />
              </div>
              <h2 className="mb-2 text-xl font-bold uppercase tracking-tight text-dark">{t('cartEmptyTitle')}</h2>
              <p className="mb-5 max-w-sm text-sm font-medium leading-6 text-gray-500">
                {t('cartEmptyMessage')}
              </p>
              <button 
                onClick={() => navigate('/categories')}
                className="btn-primary flex items-center gap-2 px-7 py-3"
              >
                {t('returnToShop')} <ArrowRight size={18} />
              </button>
            </motion.div>
          ) : (
            <div key="content" className="min-w-0 max-w-full flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
              {/* Left Side: Items List */}
              <div className="min-w-0 max-w-full space-y-4">
                <div className="min-w-0 max-w-full bg-white border border-border overflow-hidden shadow-sm">
                  <div className="hidden grid-cols-[minmax(0,1fr)_105px_130px_105px] gap-3 border-b border-border bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 md:grid">
                    <div>{t('productDetails')}</div>
                    <div className="text-center">{t('price')}</div>
                    <div className="text-center">{t('quantity')}</div>
                    <div className="text-right">{t('total')}</div>
                  </div>

                  <div className="cart-wishlist-list divide-y divide-gray-100">
                    {cartItems.map((item) => (
                      <div
                        key={item.cartId}
                        className={`cart-wishlist-row grid min-w-0 max-w-full grid-cols-1 items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50 md:grid-cols-[minmax(0,1fr)_105px_130px_105px] ${unavailableProductIds.has(String(item.productId ?? item.id)) ? 'border border-red-500 bg-red-50' : ''}`}
                      >
                        <div className="cart-product-details flex min-w-0 items-start gap-4">
                          <div className="app-line-thumb bg-light p-2 border border-gray-100 shrink-0">
                            <img src={getProductImage(item)} alt={productText(item, 'name')} loading="lazy" onError={handleProductImageError} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="cart-product-title mb-1 font-bold text-dark uppercase tracking-wide">{productText(item, 'name')}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{t('sku')}: {item.sku}</p>
                            {unavailableProductIds.has(String(item.productId ?? item.id)) && (
                              <p className="mt-1 text-xs font-bold text-red-500">Out of stock</p>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              disabled={isCartMutating}
                              className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:text-red-600"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t pt-3 text-center font-bold text-dark md:block md:border-t-0 md:pt-0">
                          <span className="md:hidden text-[10px] text-gray-400 uppercase font-black">{t('price')}:</span>
                          ₹{item.price.toLocaleString()}
                        </div>

                        <div className="flex justify-center border-t pt-3 md:border-t-0 md:pt-0">
                          <div className="flex h-9 items-center overflow-hidden rounded-sm border border-border bg-white">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={isCartMutating}
                              className="flex w-9 items-center justify-center transition-colors hover:bg-gray-50"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 border-x border-border text-center text-sm font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={isCartMutating}
                              className="flex w-9 items-center justify-center transition-colors hover:bg-gray-50"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t pt-3 text-right text-base font-black text-primary md:block md:border-t-0 md:pt-0">
                          <span className="md:hidden text-[10px] text-gray-400 uppercase font-black">{t('subtotal')}</span>
                          ₹{item.lineTotal.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-4 border border-border bg-white p-5 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-dark uppercase tracking-wider text-sm mb-2">{t('freeDelivery')}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{t('freeDeliveryMessage')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 border border-border bg-white p-5 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-dark uppercase tracking-wider text-sm mb-2">{t('securePayment')}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{t('securePaymentMessage')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Order Summary */}
              <aside>
                <div className="cart-summary-sticky sticky top-28 border border-border bg-white p-5 shadow-sm">
                  <h3 className="mb-5 flex items-center justify-between border-b border-border pb-3 text-lg font-bold uppercase tracking-tight text-dark">
                    {t('orderSummary')}
                    <ShoppingBag size={20} className="text-primary" />
                  </h3>

                  <div className="mb-5 space-y-3">
                    {(isSummaryLoading || isCartMutating) && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Refreshing cart totals...
                      </div>
                    )}
                    {summaryError && (
                      <div className="text-xs font-bold text-red-500">{summaryError}</div>
                    )}
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-500 uppercase tracking-widest text-[10px] font-black">{t('itemSubtotal')}</span>
                      <span className="text-dark">₹{itemSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm font-medium">
                      <span className="tax-summary-label text-gray-500 uppercase tracking-widest text-[10px] font-black">
                        {t('estimatedTax')}
                        <TaxInfoPopup taxableAmount={taxableAmount} cgst={cgst} sgst={sgst} totalGst={gst} />
                      </span>
                      <span className="text-dark">₹{gst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-500 uppercase tracking-widest text-[10px] font-black">{t('deliveryCharges')}</span>
                      <span className={deliveryCharge === 0 ? 'text-green-600' : 'text-dark font-bold'}>
                        {deliveryCharge === 0 ? t('free') : `₹${deliveryCharge.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 text-primary bg-primary/5 p-2 rounded-sm">
                      <span className="uppercase tracking-widest text-[10px] font-black">{t('coinsDiscount')}</span>
                      <span className="font-black">- ₹{coinsUsed}</span>
                    </div>
                  </div>

                  <div className="relative mb-5">
                    <input 
                      type="text" 
                      placeholder={t('couponCode')} 
                      className="w-full border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-colors focus:border-primary"
                      value={coupon}
                      onChange={handleCouponChange}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="coupon-apply-btn absolute bottom-1.5 right-1.5 top-1.5 bg-primary px-4 text-[9px] font-black uppercase text-white transition-colors hover:bg-primary"
                    >
                      {t('apply')}
                    </button>
                  </div>
                  {couponMessage && (
                    <p
                      className={`-mt-3 mb-4 text-xs font-bold ${
                        couponStatus === 'success' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {couponMessage}
                    </p>
                  )}

                  <div className="mb-5 border-t border-dark pt-4">
                    {appliedCoupon && (
                      <div className="mb-4 flex justify-between text-sm font-medium text-primary">
                        <span className="uppercase tracking-widest text-[10px] font-black">
                          {t('couponDiscount')} ({appliedCoupon.code})
                        </span>
                        <span className="font-black">- ₹{couponDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('totalAmount')}</span>
                      <span className="text-3xl font-black text-dark leading-none">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {stockError && <p className="mb-3 text-xs font-bold text-red-500">{stockError}</p>}
                  <button 
                    onClick={handleProceedToCheckout}
                    disabled={isCartMutating || isValidatingStock || unavailableProductIds.size > 0}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-3.5"
                  >
                    {isValidatingStock ? 'Validating Stock...' : t('proceedToCheckout')} <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={isCartMutating}
                    className="mt-3 flex w-full items-center justify-center gap-2 border border-red-200 py-3 text-xs font-black uppercase tracking-widest text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={15} /> {isCartMutating ? 'Clearing Cart...' : 'Clear Cart'}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <ShieldCheck size={14} className="text-green-500" />
                    {t('securePayments')}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </AnimatePresence>
      </main>
      <div className="cart-wishlist-bottom-section">
        <MarketplaceBanner enableFeatureDetails />
      </div>
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};
export default CartPage;
