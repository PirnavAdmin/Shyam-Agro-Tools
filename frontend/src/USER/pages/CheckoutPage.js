import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import MarketplaceBanner from '../components/MarketplaceBanner';
import TaxInfoPopup from '../components/TaxInfoPopup';
import OrderSuccessPage from './OrderSuccessPage';
import { formatCurrency, saveOrder } from '../utils/orders';
import apiClient from '../../api/axios';
import { CART_CHECKOUT_API_BASE_URL, placeOrderSuccess } from '../../services/cartCheckoutService';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import {
  calculateEarnedCoins,
  calculateMaxCartRedeemAmount,
  getCoinsErrorMessage,
  loadCoins,
  refreshCoins,
  validateCoinRedemption,
} from '../../services/CoinsService';
import {
  completePayment,
  getPaymentQr,
  getPaymentStatus,
  initiatePayment,
  netBankingLogin,
  verifyNetBankingOtp,
  watchPaymentStatus,
} from '../../services/paymentService';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from '../../services/customerAddressService';
import './CheckoutPage.css';

const defaultBankOptions = [
  'SBI',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Canara Bank',
  'Indian Bank',
  'Kotak Mahindra Bank',
];

const netBankingSteps = [
  { id: 'login', labelKey: 'paymentGateway' },
  { id: 'otp', labelKey: 'otpVerification' },
  { id: 'confirm', labelKey: 'confirmPayment' },
  { id: 'success', labelKey: 'paymentSuccess' },
];

const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
const nameRegex = /^[A-Za-z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isExpiredCard = (expiryDate) => {
  if (!expiryRegex.test(expiryDate)) return true;
  const [month, year] = expiryDate.split('/').map(Number);
  const expiry = new Date(2000 + year, month, 0, 23, 59, 59);
  return expiry < new Date();
};

const formatExpiryDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const netBankingInitialState = {
  isOpen: false,
  step: 'login',
  username: '',
  password: '',
  otp: '',
  errors: {},
};

const qrPaymentInitialState = {
  isVisible: false,
  isLoading: false,
  status: 'idle',
  orderId: '',
  qrSource: '',
  error: '',
};

const SELECTED_ADDRESS_STORAGE_KEY = 'augro:selectedCustomerAddressId';
const PAYMENT_STORAGE_KEY = 'augro:paymentTransaction';

const getStoredPayment = () => {
  try {
    return JSON.parse(window.localStorage.getItem(PAYMENT_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const getQrSource = (paymentQr = {}) => {
  if (paymentQr.qrCodeUrl || paymentQr.qrImageUrl || paymentQr.qrUrl) {
    return paymentQr.qrCodeUrl || paymentQr.qrImageUrl || paymentQr.qrUrl;
  }
  if (paymentQr.qrBase64) {
    return paymentQr.qrBase64.startsWith('data:')
      ? paymentQr.qrBase64
      : `data:image/png;base64,${paymentQr.qrBase64}`;
  }
  if (paymentQr.qrSvg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(paymentQr.qrSvg)}`;
  }
  return '';
};

const mapCheckoutItems = (items) => {
  return items.map((item) => {
    const quantity = Number(item.quantity ?? 0);
    const price = Number(item.sellingPrice ?? 0);

    return {
      ...item,
      cartId: item.cartItemId,
      productId: item.productId,
      id: String(item.productId),
      quantity,
      price,
      lineTotal: Number(item.itemTotal ?? 0),
      name: item.productName || '',
      displayName: item.productName || '',
      image: item.imageUrl
        ? `${CART_CHECKOUT_API_BASE_URL}${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`
        : '/product-images/fallback.png',
      sku: String(item.productId),
    };
  });
};

const getLatestAddress = (addresses) => [...addresses].sort((first, second) => {
  const dateDifference = new Date(second.createdDate || 0) - new Date(first.createdDate || 0);
  return dateDifference || Number(getAddressId(second) || 0) - Number(getAddressId(first) || 0);
})[0] || null;

const getAddressId = (address) => address?.addressId ?? address?.customerAddressId ?? address?.id ?? null;

const mapAddressToForm = (address) => ({
  firstName: address.firstName || '',
  lastName: address.lastName || '',
  email: address.email || '',
  phone: address.phoneNumber || '',
  alternatePhone: address.alternatePhoneNumber || '',
  address: address.fullAddress || '',
  city: address.city || '',
  state: address.state || '',
  zip: address.pincode || '',
  addressType: String(address.addressType || '').toLowerCase() === 'work' ? 'Work' : 'Home',
});

const getBackendPaymentMethod = (paymentMethod, onlinePaymentType) => {
  if (paymentMethod === 'cod') return 'COD';
  if (onlinePaymentType === 'upi' || onlinePaymentType === 'qr-payment') return 'UPI';
  if (onlinePaymentType === 'debit-card' || onlinePaymentType === 'credit-card') return 'CARD';
  if (onlinePaymentType === 'net-banking') return 'NET_BANKING';
  return '';
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  const nestedData = data?.data;
  const statusMessages = {
    400: 'The payment details were rejected. Please review them and try again.',
    401: 'The payment credentials were not accepted.',
    404: 'The payment transaction could not be found.',
    500: 'The payment server encountered an error. Please try again.',
  };
  return (
    data?.message ||
    nestedData?.message ||
    data?.title ||
    data?.error ||
    data?.errors?.customerAddressId?.[0] ||
    data?.errors?.paymentMethod?.[0] ||
    statusMessages[error?.response?.status] ||
    error?.message ||
    fallbackMessage
  );
};

const CheckoutPage = ({ mode = 'checkout' }) => {
  const isPaymentPage = mode === 'payment';
  const { user } = useAuth();
  const {
    clearCart,
    waitForCartSync,
  } = useCart();
  const { t, productText } = useLanguage();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    addressType: 'Home',
    paymentMethod: 'cod',
    ...(location.state?.formData || {}),
  });
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [onlinePaymentType, setOnlinePaymentType] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const [netBankingFlow, setNetBankingFlow] = useState(netBankingInitialState);
  const [availableBanks, setAvailableBanks] = useState(defaultBankOptions);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [bankAddMessage, setBankAddMessage] = useState({ type: '', text: '' });
  const [qrPayment, setQrPayment] = useState(qrPaymentInitialState);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [couponCode, setCouponCode] = useState(location.state?.appliedCoupon?.code || '');
  const [coinsRedeem, setCoinsRedeem] = useState(Number(location.state?.coinsUsed || 0));
  const [coinsConfig, setCoinsConfig] = useState(null);
  const [coinsConfigLoading, setCoinsConfigLoading] = useState(false);
  const [coinsConfigError, setCoinsConfigError] = useState('');
  const [coinsRedeemError, setCoinsRedeemError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(location.state?.selectedAddressId ?? null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentTransaction, setPaymentTransaction] = useState(getStoredPayment);
  const [addressError, setAddressError] = useState('');
  const qrStatusUnsubscribeRef = useRef(null);
  const previousCoinsRedeemRef = useRef(coinsRedeem);
  const onlinePaymentLabels = {
    upi: t('upi'),
    'debit-card': t('debitCard'),
    'credit-card': t('creditCard'),
    'net-banking': t('netBanking'),
    'qr-payment': 'QR Payment',
  };

  const cartItems = useMemo(
    () => mapCheckoutItems(checkoutSummary?.cartItems || []),
    [checkoutSummary]
  );
  const cartSubtotal = Number(checkoutSummary?.subTotal ?? 0);
  const taxableAmount = cartSubtotal;
  const totalGst = Number(checkoutSummary?.tax ?? 0);
  const cgst = Number(checkoutSummary?.cgst ?? 0);
  const sgst = Number(checkoutSummary?.sgst ?? 0);
  const gst = totalGst;
  const deliveryCharge = Number(checkoutSummary?.shippingCharges ?? 0);
  const couponDiscount = Number(checkoutSummary?.couponDiscount ?? 0);
  const coinsDiscount = Number(checkoutSummary?.coinsDiscount ?? 0);
  const discountTotal = couponDiscount + coinsDiscount;
  const availableCoins = Number(checkoutSummary?.availableCoins ?? 0);
  const maxConfiguredCoins = Number(coinsConfig?.maxRedeemableCoins ?? availableCoins);
  const maxInputCoins = Math.max(0, Math.min(availableCoins, maxConfiguredCoins || availableCoins));
  const earnedCoins = useMemo(
    () => calculateEarnedCoins(cartSubtotal, coinsConfig),
    [cartSubtotal, coinsConfig]
  );
  const maxCartRedeemAmount = useMemo(
    () => calculateMaxCartRedeemAmount(cartSubtotal, coinsConfig),
    [cartSubtotal, coinsConfig]
  );
  const appliedCoupon = couponCode ? { code: couponCode } : null;
  const grandTotal = Number(checkoutSummary?.grandTotal ?? 0);
  const checkoutDiscount = {
    appliedCoupon,
    couponDiscount,
    coinsUsed: Number(checkoutSummary?.coinsToRedeem ?? coinsRedeem),
  };

  const loadCoinsConfiguration = useCallback(async ({ refreshing = false } = {}) => {
    setCoinsConfigLoading(true);
    setCoinsConfigError('');

    try {
      const response = refreshing ? await refreshCoins() : await loadCoins();
      setCoinsConfig(response);
      setCoinsRedeemError('');
      return response;
    } catch (requestError) {
      const message = getCoinsErrorMessage(requestError);
      setCoinsConfigError(message);
      setCoinsConfig(null);
      return null;
    } finally {
      setCoinsConfigLoading(false);
    }
  }, []);

  const loadCheckoutSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    setCoinsRedeemError('');

    try {
      await waitForCartSync();
      if (Number(coinsRedeem) > 0) {
        if (!coinsConfig && checkoutSummary) {
          setCoinsRedeemError('Coins configuration is unavailable. Please refresh coins before redeeming.');
          return;
        }

        if (coinsConfig && checkoutSummary) {
          const validationMessage = validateCoinRedemption({
            coinsToRedeem: coinsRedeem,
            availableCoins,
            cartTotal: cartSubtotal,
            coinsConfig,
          });

          if (validationMessage) {
            setCoinsRedeemError(validationMessage);
            return;
          }
        }
      }

      const response = await apiClient.get(
        `${CART_CHECKOUT_API_BASE_URL}/api/Checkout/summary`,
        {
          params: {
            ...(couponCode.trim() && { couponCode: couponCode.trim() }),
            ...(Number(coinsRedeem) > 0 && { coinsToRedeem: Number(coinsRedeem) }),
          },
          headers: { 'ngrok-skip-browser-warning': 'true', Accept: 'application/json' },
        }
      );
      setCheckoutSummary(response.data?.data ?? response.data);
    } catch (requestError) {
      console.error('Unable to load checkout summary.', requestError);
      setError('Unable to load your checkout summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [availableCoins, cartSubtotal, checkoutSummary, coinsConfig, coinsRedeem, couponCode, waitForCartSync]);

  useEffect(() => {
    let isActive = true;

    const loadCheckoutPage = async () => {
      try {
        const savedAddresses = await getAddresses();
        if (isActive) {
          setAddresses(savedAddresses);
          const previouslySelectedAddressId = window.localStorage.getItem(SELECTED_ADDRESS_STORAGE_KEY);
          const preferredAddress = savedAddresses.find(
            (address) => String(getAddressId(address)) === String(previouslySelectedAddressId)
          );
          const latestAddress = preferredAddress || getLatestAddress(savedAddresses);
          if (latestAddress) {
            const latestAddressId = getAddressId(latestAddress);
            setSelectedAddressId(latestAddressId);
            setFormData((current) => ({
              ...current,
              ...mapAddressToForm(latestAddress),
            }));
          }
        }
      } catch (error) {
        console.error('Unable to load customer addresses.', error);
      }
    };

    loadCoinsConfiguration();
    loadCheckoutPage();
    loadCheckoutSummary();
    return () => {
      isActive = false;
    };
    // This effect owns page-entry loading; coupon and coin refreshes are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (previousCoinsRedeemRef.current === coinsRedeem) {
      return undefined;
    }
    previousCoinsRedeemRef.current = coinsRedeem;

    const refreshTimer = window.setTimeout(loadCheckoutSummary, 400);
    return () => window.clearTimeout(refreshTimer);
  }, [coinsRedeem, loadCheckoutSummary]);

  useEffect(() => () => qrStatusUnsubscribeRef.current?.(), []);

  const validateCheckoutForm = (data = formData) => {
    const errors = {};
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.trim();
    const phone = data.phone.trim();
    const address = data.address.trim();
    const city = data.city.trim();
    const state = data.state.trim();
    const zip = data.zip.trim();

    if (!firstName) errors.firstName = 'First name is required.';
    else if (!nameRegex.test(firstName)) errors.firstName = 'First name should contain only letters and spaces.';

    if (!lastName) errors.lastName = 'Last name is required.';
    else if (!nameRegex.test(lastName)) errors.lastName = 'Last name should contain only letters and spaces.';

    if (!email) errors.email = 'Email address is required.';
    else if (!emailRegex.test(email)) errors.email = 'Enter a valid email address.';

    if (!phone) errors.phone = 'Phone number is required.';
    else if (!/^\d{10}$/.test(phone)) errors.phone = 'Phone number must be exactly 10 digits.';

    if (!address) errors.address = 'Full address is required.';
    else if (address.length < 10) errors.address = 'Full address must be at least 10 characters.';

    if (!city) errors.city = 'City is required.';
    if (!state) errors.state = 'State is required.';

    if (!zip) errors.zip = 'Pincode is required.';
    else if (!/^\d{6}$/.test(zip)) errors.zip = 'Pincode must be exactly 6 digits.';

    if (!data.addressType) errors.addressType = 'Address type is required.';

    return errors;
  };

  const isCheckoutFormValid = Object.keys(validateCheckoutForm()).length === 0;

  const shouldShowError = (fieldName) => submitAttempted || touchedFields[fieldName];
  const getFieldClassName = (fieldName) =>
    shouldShowError(fieldName) && formErrors[fieldName] ? 'input-invalid' : '';

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const sanitizedValue = (() => {
      if (name === 'phone' || name === 'alternatePhone') return value.replace(/\D/g, '').slice(0, 10);
      if (name === 'zip') return value.replace(/\D/g, '').slice(0, 6);
      return value;
    })();

    setFormData((current) => {
      const next = { ...current, [name]: sanitizedValue };
      setFormErrors(validateCheckoutForm(next));
      return next;
    });
    if (name === 'paymentMethod') setPaymentErrors({});
  };

  const handleInputBlur = (event) => {
    const { name } = event.target;
    setTouchedFields((current) => ({ ...current, [name]: true }));
    setFormErrors(validateCheckoutForm());
  };

  const handleAddressTypeChange = (addressType) => {
    const savedAddress = getLatestAddress(
      addresses.filter((address) => (
        String(address.addressType).toLowerCase() === addressType.toLowerCase()
      ))
    );

    if (savedAddress) {
      const savedAddressId = getAddressId(savedAddress);
      setSelectedAddressId(savedAddressId);
      window.localStorage.setItem(SELECTED_ADDRESS_STORAGE_KEY, String(savedAddressId));
      setFormData((current) => ({
        ...current,
        ...mapAddressToForm(savedAddress),
      }));
    } else {
      setSelectedAddressId(null);
      setFormData((current) => ({ ...current, addressType }));
    }
    setAddressError('');
  };

  const getAddressPayload = (addressId = selectedAddressId) => {
    const savedAddress = addresses.find(
      (address) => String(getAddressId(address)) === String(addressId)
    );
    return {
      addressId: Number(addressId || 0),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phone.trim(),
      alternatePhoneNumber: formData.alternatePhone.trim(),
      fullAddress: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.zip.trim(),
      addressType: formData.addressType,
      createdDate: savedAddress?.createdDate || new Date().toISOString(),
    };
  };

  const selectAddress = (address) => {
    if (!address) {
      setSelectedAddressId(null);
      window.localStorage.removeItem(SELECTED_ADDRESS_STORAGE_KEY);
      return;
    }

    const addressId = getAddressId(address);
    setSelectedAddressId(addressId);
    window.localStorage.setItem(SELECTED_ADDRESS_STORAGE_KEY, String(addressId));
    setFormData((current) => ({
      ...current,
      ...mapAddressToForm(address),
    }));
  };

  const refreshAddresses = async (preferredAddressId) => {
    const savedAddresses = await getAddresses();
    setAddresses(savedAddresses);
    const preferredAddress = savedAddresses.find(
      (address) => String(getAddressId(address)) === String(preferredAddressId)
    );
    const nextAddress = preferredAddress || getLatestAddress(savedAddresses);
    selectAddress(nextAddress);
    return nextAddress;
  };

  const saveCurrentAddress = async () => {
    const errors = validateCheckoutForm();
    setFormErrors(errors);
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return null;

    setIsSavingAddress(true);
    setAddressError('');

    try {
      const payload = getAddressPayload();
      const result = selectedAddressId
        ? await updateAddress(selectedAddressId, payload)
        : await createAddress(payload);
      const savedAddressId = Number(
        getAddressId(result) || result?.data?.addressId || result?.data?.customerAddressId || selectedAddressId || 0
      );
      const selectedAddress = await refreshAddresses(savedAddressId || undefined);
      return getAddressId(selectedAddress) || savedAddressId || null;
    } catch (error) {
      console.error('Unable to save customer address.', error.response?.data || error);
      setAddressError(getApiErrorMessage(error, 'Unable to save the address. Please try again.'));
      return null;
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!addressId || isSavingAddress || isPlacingOrder) return;

    setIsSavingAddress(true);
    setAddressError('');

    try {
      await deleteAddress(addressId);
      const nextAddress = await refreshAddresses(undefined);
      if (!nextAddress) {
        setSelectedAddressId(null);
        window.localStorage.removeItem(SELECTED_ADDRESS_STORAGE_KEY);
        setFormData((current) => ({
          ...current,
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          alternatePhone: '',
          address: '',
          city: '',
          state: '',
          zip: '',
        }));
      }
    } catch (error) {
      console.error('Unable to delete customer address.', error.response?.data || error);
      setAddressError(getApiErrorMessage(error, 'Unable to delete the address. Please try again.'));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePaymentDetailChange = (event) => {
    const { name, value } = event.target;

    const sanitizedValue = (() => {
      if (name === 'cardNumber') return value.replace(/\D/g, '').slice(0, 16);
      if (name === 'cvv') return value.replace(/\D/g, '').slice(0, 3);
      if (name === 'expiryDate') return formatExpiryDate(value);
      return value;
    })();

    setPaymentDetails((current) => ({ ...current, [name]: sanitizedValue }));
    setPaymentErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleAddBank = () => {
    const bankName = newBankName.trim().replace(/\s+/g, ' ');

    if (!bankName) {
      setBankAddMessage({ type: 'error', text: t('bankNameRequired') });
      return;
    }

    if (bankName.length < 3) {
      setBankAddMessage({ type: 'error', text: t('bankNameMin') });
      return;
    }

    const isDuplicate = availableBanks.some((bank) => bank.toLowerCase() === bankName.toLowerCase());
    if (isDuplicate) {
      setBankAddMessage({ type: 'error', text: t('bankAlreadyExists') });
      return;
    }

    setAvailableBanks((current) => [...current, bankName]);
    setPaymentDetails((current) => ({ ...current, bankName }));
    setPaymentErrors((current) => ({ ...current, bankName: '' }));
    setNewBankName('');
    setIsAddingBank(false);
    setBankAddMessage({ type: 'success', text: t('bankAddedSuccessfully') });
  };

  const handleNetBankingFieldChange = (event) => {
    const { name, value } = event.target;
    const sanitizedValue = name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value;

    setNetBankingFlow((current) => ({
      ...current,
      [name]: sanitizedValue,
      errors: { ...current.errors, [name]: '' },
    }));
  };

  const generateOrderId = () => {
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `SAT${dateCode}${randomCode}`;
  };

  const persistPaymentTransaction = (updates) => {
    setPaymentTransaction((current) => {
      const next = { ...current, ...updates };
      window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const getPaymentInitiationPayload = (orderId) => {
    const base = { amount: Number(grandTotal), orderId };
    if (formData.paymentMethod === 'cod') {
      return { ...base, paymentMethod: 'CashOnDelivery' };
    }
    if (onlinePaymentType === 'upi') {
      return { ...base, paymentMethod: 'UPI', upiId: paymentDetails.upiId.trim() };
    }
    if (onlinePaymentType === 'debit-card' || onlinePaymentType === 'credit-card') {
      return {
        ...base,
        paymentMethod: 'Card',
        cardNumber: paymentDetails.cardNumber,
        nameOnCard: paymentDetails.cardName.trim(),
        expiryDate: paymentDetails.expiryDate.trim(),
        cvv: paymentDetails.cvv,
      };
    }
    if (onlinePaymentType === 'net-banking') {
      return { ...base, paymentMethod: 'NetBanking', bankName: paymentDetails.bankName.trim() };
    }
    return null;
  };

  const startPayment = async (orderId, orderData = {}) => {
    const payload = getPaymentInitiationPayload(orderId);
    if (!payload) throw new Error('This payment method is not supported by the payment service.');
    const result = await initiatePayment(payload);
    if (!result?.transactionId) throw new Error('The payment server did not return a transaction ID.');
    persistPaymentTransaction({
      ...orderData,
      transactionId: result.transactionId,
      paymentStatus: result.status || 'Pending',
      paymentMethod: payload.paymentMethod,
      orderId,
      message: result.message || '',
    });
    return result;
  };

  const createOrderForPayment = async (backendPaymentMethod) => {
    if (!backendPaymentMethod) throw new Error('Please select a payment method.');
    await waitForCartSync();
    if (!cartItems.length) throw new Error('Your cart is empty. Add a product before placing the order.');
    if (!Number.isFinite(Number(grandTotal)) || Number(grandTotal) <= 0) {
      throw new Error('The order total is invalid. Refresh checkout and try again.');
    }

    const addressId = await saveCurrentAddress();
    if (!addressId) throw new Error('Save a valid delivery address before placing the order.');

    const backendOrder = await placeOrderSuccess({
      customerAddressId: addressId,
      paymentMethod: backendPaymentMethod,
      couponCode: couponCode.trim(),
      coinsRedeemed: Number(checkoutSummary?.coinsToRedeem ?? coinsRedeem),
    });
    const orderId = String(
      backendOrder?.orderId || backendOrder?.orderID || backendOrder?.orderNumber || backendOrder?.id || ''
    );
    if (!orderId) throw new Error('The order server did not return an order ID.');

    return { backendOrder, orderId };
  };

  const validateOnlinePayment = () => {
    if (formData.paymentMethod !== 'online') return true;

    const errors = {};

    if (onlinePaymentType === 'upi') {
      const upiId = paymentDetails.upiId.trim();
      if (!upiId) errors.upiId = t('upiRequired');
      else if (!upiRegex.test(upiId)) errors.upiId = t('upiInvalid');
    }

    if (onlinePaymentType === 'debit-card' || onlinePaymentType === 'credit-card') {
      const cardNumber = paymentDetails.cardNumber;
      if (!cardNumber) errors.cardNumber = t('cardNumberRequired');
      else if (!/^\d{16}$/.test(cardNumber)) errors.cardNumber = t('cardNumberInvalid');
      if (!paymentDetails.cardName.trim()) errors.cardName = t('cardNameRequired');
      else if (!nameRegex.test(paymentDetails.cardName.trim())) errors.cardName = 'Name on card should contain only letters and spaces.';
      if (!paymentDetails.expiryDate.trim()) errors.expiryDate = t('expiryDateRequired');
      else if (!expiryRegex.test(paymentDetails.expiryDate.trim())) errors.expiryDate = t('expiryDateFormat');
      else if (isExpiredCard(paymentDetails.expiryDate.trim())) errors.expiryDate = t('expiryDateExpired');
      if (!paymentDetails.cvv.trim()) errors.cvv = t('cvvRequired');
      else if (!/^\d{3}$/.test(paymentDetails.cvv.trim())) errors.cvv = t('cvvInvalid');
    }

    if (onlinePaymentType === 'net-banking' && !paymentDetails.bankName.trim()) {
      errors.bankName = t('bankRequired');
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const completeOrder = async (
    paymentMethod,
    orderId = generateOrderId(),
    backendPaymentMethod = getBackendPaymentMethod(formData.paymentMethod, onlinePaymentType),
    transaction = paymentTransaction,
    existingBackendOrder = null
  ) => {
    if (isPlacingOrder) return false;
    setIsPlacingOrder(true);
    setAddressError('');

    if (!backendPaymentMethod) {
      setAddressError('Please select a payment method.');
      setIsPlacingOrder(false);
      return false;
    }

    let backendOrder = existingBackendOrder;
    if (!backendOrder) {
      const addressId = await saveCurrentAddress();
      if (!addressId) {
        setIsPlacingOrder(false);
        return false;
      }

      try {
        backendOrder = await placeOrderSuccess({
          customerAddressId: addressId,
          paymentMethod: backendPaymentMethod,
          couponCode: couponCode.trim(),
          coinsRedeemed: Number(checkoutSummary?.coinsToRedeem ?? coinsRedeem),
        });
      } catch (error) {
        console.error('Unable to place order.', error.response?.data || error);
        setAddressError(getApiErrorMessage(error, 'Unable to place the order. Please try again.'));
        setIsPlacingOrder(false);
        return false;
      }
    }

    const confirmedOrderId = String(
      backendOrder?.orderId || backendOrder?.orderID || backendOrder?.orderNumber || backendOrder?.id || orderId
    );
    const paymentStatus = formData.paymentMethod === 'cod' ? t('paymentPending') : t('paid');
    const customerMobile = user?.phone || user?.mobileNumber || user?.MobileNumber || formData.phone;
    const order = {
      id: confirmedOrderId,
      items: cartItems.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: productText(item, 'displayName') || item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
        total: item.lineTotal,
      })),
      subtotal: cartSubtotal,
      taxableAmount,
      cgst,
      sgst,
      gst,
      totalGst,
      deliveryCharge,
      discount: discountTotal,
      couponDiscount,
      coinsDiscount,
      couponCode: appliedCoupon?.code || '',
      total: grandTotal,
      customerMobile,
      mobileNumber: customerMobile,
      paymentMethod,
      paymentStatus: transaction?.paymentStatus || paymentStatus,
      transactionId: transaction?.transactionId || '',
      paymentMessage: transaction?.message || '',
      billingDetails: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
      },
      shippingAddress: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        type: formData.addressType,
      },
      status: t('orderPlaced'),
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);
    setPlacedOrder(order);
    clearCart();
    setIsPlacingOrder(false);
    return true;
  };

  const handleQrPaymentStatus = async (status, paymentMethod, orderId, transactionId, backendOrder) => {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'success' || normalizedStatus === 'paid') {
      setQrPayment(qrPaymentInitialState);
      qrStatusUnsubscribeRef.current?.();
      qrStatusUnsubscribeRef.current = null;
      try {
        const statusResult = await getPaymentStatus(transactionId);
        const transaction = {
          transactionId,
          orderId,
          paymentMethod: 'UPI',
          paymentStatus: statusResult?.status || 'Success',
          paymentGatewayStatus: statusResult?.status || 'Success',
          paymentCompleted: true,
          qrStatus: 'Completed',
          message: statusResult?.message || '',
        };
        persistPaymentTransaction(transaction);
        await completeOrder(paymentMethod, orderId, 'UPI', transaction, backendOrder);
      } catch (error) {
        setQrPayment((current) => ({
          ...current,
          status: 'failed',
          error: getApiErrorMessage(error, 'Unable to complete the QR payment.'),
        }));
      }
      return;
    }

    setQrPayment((current) => ({
      ...current,
      status: normalizedStatus === 'processing' ? 'processing' : normalizedStatus === 'failed' ? 'failed' : 'waiting',
    }));
  };

  const openQrPayment = async (paymentMethod) => {
    const orderId = generateOrderId();
    setQrPayment({
      ...qrPaymentInitialState,
      isVisible: true,
      isLoading: true,
      status: 'generating',
      orderId,
    });

    try {
      const preparedOrder = await createOrderForPayment('UPI');
      const initiationResult = await startPayment(preparedOrder.orderId, {
        backendOrder: preparedOrder.backendOrder,
      });
      const paymentQr = await getPaymentQr({
        orderId: preparedOrder.orderId,
        amount: grandTotal,
      });
      const qrSource = getQrSource(paymentQr);
      if (!qrSource) throw new Error('The payment gateway did not return a valid QR code.');
      const transactionId = paymentQr.transactionId || initiationResult.transactionId;
      persistPaymentTransaction({
        backendOrder: preparedOrder.backendOrder,
        transactionId,
        orderId: preparedOrder.orderId,
        paymentMethod: 'UPI',
        paymentStatus: 'Pending',
        paymentGatewayStatus: 'QrGenerated',
        qrStatus: 'Generated',
        message: paymentQr.message || initiationResult.message || '',
      });

      setQrPayment((current) => ({
        ...current,
        isLoading: false,
        status: 'waiting',
        orderId: preparedOrder.orderId,
        qrSource,
      }));

      qrStatusUnsubscribeRef.current?.();
      qrStatusUnsubscribeRef.current = watchPaymentStatus(
        transactionId,
        (statusResult) => handleQrPaymentStatus(
          statusResult?.status || statusResult?.paymentStatus,
          paymentMethod,
          preparedOrder.orderId,
          transactionId,
          preparedOrder.backendOrder
        ),
        (error) => setQrPayment((current) => ({
          ...current,
          error: getApiErrorMessage(error, 'Unable to refresh payment status.'),
        }))
      );
    } catch (error) {
      setQrPayment((current) => ({
        ...current,
        isLoading: false,
        status: 'failed',
        error: error.message || 'Unable to generate the secure payment QR.',
      }));
    }
  };

  const openNetBankingFlow = async () => {
    const checkoutErrors = validateCheckoutForm();
    setSubmitAttempted(true);
    setTouchedFields((current) => ({
      ...current,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    }));
    setFormErrors(checkoutErrors);
    if (Object.keys(checkoutErrors).length > 0) return;

    if (!paymentDetails.bankName.trim()) {
      setPaymentErrors({ bankName: t('bankRequired') });
      return;
    }

    setPaymentErrors({});
    setIsPlacingOrder(true);
    setAddressError('');
    try {
      const preparedOrder = await createOrderForPayment('NET_BANKING');
      await startPayment(preparedOrder.orderId, { backendOrder: preparedOrder.backendOrder });
      setNetBankingFlow({ ...netBankingInitialState, isOpen: true, errors: {} });
    } catch (error) {
      setAddressError(getApiErrorMessage(error, 'Unable to initiate net banking payment.'));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleNetBankingPayNow = (event) => {
    openNetBankingFlow(event.currentTarget.form);
  };

  const handleNetBankingLoginSubmit = async () => {
    const errors = {};

    if (!netBankingFlow.username.trim()) errors.username = t('usernameRequired');
    if (!netBankingFlow.password.trim()) errors.password = t('passwordRequired');

    if (Object.keys(errors).length > 0) {
      setNetBankingFlow((current) => ({ ...current, errors }));
      return;
    }

    setNetBankingFlow((current) => ({ ...current, isLoading: true, errors: {} }));
    try {
      await netBankingLogin({
        transactionId: paymentTransaction.transactionId,
        username: netBankingFlow.username.trim(),
        password: netBankingFlow.password,
      });
      persistPaymentTransaction({
        netBankingLoginStatus: 'Success',
        paymentGatewayStatus: 'NetBankingLoginSuccess',
      });
      setNetBankingFlow((current) => ({ ...current, step: 'otp', isLoading: false, errors: {} }));
    } catch (error) {
      setNetBankingFlow((current) => ({
        ...current,
        isLoading: false,
        errors: { api: getApiErrorMessage(error, 'Net banking login failed.') },
      }));
    }
  };

  const handleNetBankingOtpSubmit = async () => {
    const errors = {};

    if (!netBankingFlow.otp.trim()) errors.otp = t('otpRequired');
    else if (!/^\d{6}$/.test(netBankingFlow.otp)) errors.otp = t('otpInvalid');

    if (Object.keys(errors).length > 0) {
      setNetBankingFlow((current) => ({ ...current, errors }));
      return;
    }

    setNetBankingFlow((current) => ({ ...current, isLoading: true, errors: {} }));
    try {
      await verifyNetBankingOtp({
        transactionId: paymentTransaction.transactionId,
        otp: netBankingFlow.otp,
      });
      persistPaymentTransaction({
        otpVerified: true,
        otpVerificationStatus: 'Verified',
        paymentGatewayStatus: 'OtpVerified',
      });
      const result = await completePayment({ transactionId: paymentTransaction.transactionId });
      const statusResult = await getPaymentStatus(paymentTransaction.transactionId);
      const transaction = {
        ...paymentTransaction,
        paymentStatus: statusResult?.status || result?.status || 'Success',
        paymentGatewayStatus: statusResult?.status || result?.status || 'Success',
        paymentCompleted: true,
        otpVerified: true,
        otpVerificationStatus: 'Verified',
        netBankingLoginStatus: 'Success',
        message: statusResult?.message || result?.message || 'Payment completed successfully.',
      };
      persistPaymentTransaction(transaction);
      setNetBankingFlow((current) => ({ ...current, step: 'success', isLoading: false, errors: {} }));
      const orderCompleted = await completeOrder(
        `Net Banking - ${paymentDetails.bankName}`,
        paymentTransaction.orderId,
        'NET_BANKING',
        transaction,
        paymentTransaction.backendOrder
      );
      if (orderCompleted) setNetBankingFlow({ ...netBankingInitialState, errors: {} });
    } catch (error) {
      setNetBankingFlow((current) => ({
        ...current,
        step: error.paymentFailed ? 'failed' : current.step,
        isLoading: false,
        errors: { api: getApiErrorMessage(error, 'OTP verification failed.') },
      }));
    }
  };

  const handleConfirmNetBankingPayment = () => {
    const selectedBank = paymentDetails.bankName;
    setNetBankingFlow((current) => ({ ...current, step: 'success', errors: {} }));

    setTimeout(async () => {
      const orderCompleted = await completeOrder(`Net Banking - ${selectedBank}`);
      if (orderCompleted) {
        setNetBankingFlow({ ...netBankingInitialState, errors: {} });
      }
    }, 1100);
  };

  const handleNetBankingFailure = () => {
    setNetBankingFlow((current) => ({ ...current, step: 'failed', errors: {} }));
  };

  const retryNetBankingPayment = () => {
    setNetBankingFlow({
      ...netBankingInitialState,
      isOpen: true,
      errors: {},
    });
  };

  const changeNetBankingPaymentMethod = () => {
    setNetBankingFlow({ ...netBankingInitialState, errors: {} });
    setOnlinePaymentType('upi');
    setPaymentErrors({});
  };

  const closeNetBankingFlow = () => {
    setNetBankingFlow({ ...netBankingInitialState, errors: {} });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const checkoutErrors = validateCheckoutForm();
    setSubmitAttempted(true);
    setTouchedFields((current) => ({
      ...current,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    }));
    setFormErrors(checkoutErrors);

    if (Object.keys(checkoutErrors).length > 0) return;

    if (!isPaymentPage) {
      setIsPlacingOrder(true);
      setAddressError('');
      try {
        const addressId = await saveCurrentAddress();
        if (!addressId) return;
        navigate('/payment', {
          state: {
            ...checkoutDiscount,
            selectedAddressId: addressId,
            checkoutSummary,
            formData,
          },
        });
      } finally {
        setIsPlacingOrder(false);
      }
      return;
    }

    if (formData.paymentMethod === 'online' && onlinePaymentType === 'net-banking') {
      openNetBankingFlow(event.currentTarget);
      return;
    }

    if (!validateOnlinePayment()) return;

    const paymentMethod =
      formData.paymentMethod === 'cod' ? t('cashOnDelivery') : onlinePaymentLabels[onlinePaymentType];

    if (formData.paymentMethod === 'online' && onlinePaymentType === 'qr-payment') {
      openQrPayment(paymentMethod);
      return;
    }

    setIsPlacingOrder(true);
    setAddressError('');
    try {
      const backendPaymentMethod = getBackendPaymentMethod(formData.paymentMethod, onlinePaymentType);
      const preparedOrder = await createOrderForPayment(backendPaymentMethod);
      const { orderId, backendOrder } = preparedOrder;
      const initiationResult = await startPayment(orderId, { backendOrder });
      const completionResult = await completePayment({ transactionId: initiationResult.transactionId });
      const statusResult = await getPaymentStatus(initiationResult.transactionId);
      const transaction = {
        transactionId: initiationResult.transactionId,
        paymentStatus: statusResult?.status || completionResult?.status || initiationResult.status || (formData.paymentMethod === 'cod' ? t('paymentPending') : t('paid')),
        paymentGatewayStatus: statusResult?.status || completionResult?.status || initiationResult.status || 'Success',
        paymentCompleted: true,
        paymentMethod: getPaymentInitiationPayload(orderId).paymentMethod,
        orderId,
        message: statusResult?.message || completionResult?.message || initiationResult.message || '',
      };
      persistPaymentTransaction(transaction);
      setIsPlacingOrder(false);
      await completeOrder(paymentMethod, orderId, backendPaymentMethod, transaction, backendOrder);
    } catch (error) {
      setAddressError(getApiErrorMessage(error, 'Unable to process the payment. Please try again.'));
      setIsPlacingOrder(false);
    }
  };

  const goToTracking = () => {
    if (!placedOrder?.id) return;
    window.scrollTo(0, 0);
    navigate(`/track-order?orderId=${encodeURIComponent(placedOrder.id)}`);
  };

  const continueShopping = () => navigate('/products');
  const currentNetBankingStepIndex = Math.max(0, netBankingSteps.findIndex((step) => step.id === netBankingFlow.step));

  if (loading || (error && !checkoutSummary)) {
    return (
      <div className="checkout-page-shell flex flex-col min-h-screen bg-[#f8f9fa]">
        <Header onLoginClick={() => setIsLoginOpen(true)} />
        <main className="checkout-container">
          <div className="checkout-card text-center">
            {loading ? (
              'Loading Checkout...'
            ) : (
              <>
                <p>{error}</p>
                <button type="button" onClick={loadCheckoutSummary}>Retry</button>
              </>
            )}
          </div>
        </main>
        <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    );
  }

  if (placedOrder) {
    return (
      <OrderSuccessPage
        order={placedOrder}
        formatCurrency={formatCurrency}
        onTrackOrder={goToTracking}
        onContinueShopping={continueShopping}
      />
    );
  }

  return (
    <div className="checkout-page-shell flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="checkout-container">
        <span className="eco-leaf eco-leaf-one" aria-hidden="true"></span>
        <span className="eco-leaf eco-leaf-two" aria-hidden="true"></span>
        <div className="checkout-header">
          <span className="checkout-eyebrow">{t('ecoSecureCheckout')}</span>
          <h1>{isPaymentPage ? t('paymentMethod') : t('secureCheckout')}</h1>
          <p>{isPaymentPage ? 'Choose your payment method and complete the order securely.' : t('checkoutSubtitle')}</p>
        </div>

        <div className="checkout-layout">
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} noValidate>
              {isPaymentPage && (
                <button
                  type="button"
                  className="save-address-btn"
                  onClick={() => navigate('/checkout', { state: checkoutDiscount })}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Checkout
                </button>
              )}
              {!isPaymentPage && (
              <div className="checkout-card">
                <h3><i className="fas fa-shipping-fast"></i> {t('shippingInformation')}</h3>
                <div className="checkout-warning-box">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>Ensure your shipping details are accurate for a smooth delivery experience.</span>
                </div>
                {addressError && <span className="field-error">{addressError}</span>}
                {addresses.length > 0 && (
                  <div className="payment-options" aria-label="Saved addresses">
                    {addresses.map((address) => {
                      const addressId = getAddressId(address);
                      const isSelected = String(selectedAddressId) === String(addressId);

                      return (
                        <div
                          key={addressId}
                          role="button"
                          tabIndex={isSavingAddress || isPlacingOrder ? -1 : 0}
                          className={`payment-option ${isSelected ? 'active' : ''}`}
                          onClick={() => selectAddress(address)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              selectAddress(address);
                            }
                          }}
                          aria-pressed={isSelected}
                        >
                          <div className="pay-icon">
                            <i className={String(address.addressType).toLowerCase() === 'work' ? 'fas fa-briefcase' : 'fas fa-home'}></i>
                          </div>
                          <div className="pay-text">
                            <strong>
                              {address.addressType || 'Address'} {isSelected ? '• Selected' : ''}
                            </strong>
                            <span>
                              {[address.fullAddress, address.city, address.state, address.pincode]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                            <button
                              type="button"
                              className="save-address-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteAddress(addressId);
                              }}
                              disabled={isSavingAddress || isPlacingOrder}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="form-row">
                  <div className="input-group">
                    <label>{t('firstName')} *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Enter first name"
                      className={getFieldClassName('firstName')}
                    />
                    {shouldShowError('firstName') && formErrors.firstName && (
                      <span className="field-error">{formErrors.firstName}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>{t('lastName')} *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Enter last name"
                      className={getFieldClassName('lastName')}
                    />
                    {shouldShowError('lastName') && formErrors.lastName && (
                      <span className="field-error">{formErrors.lastName}</span>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>{t('emailAddress')} *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Enter email address"
                      className={getFieldClassName('email')}
                    />
                    {shouldShowError('email') && formErrors.email && (
                      <span className="field-error">{formErrors.email}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>{t('phoneNumber')} *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Enter 10-digit mobile number"
                      maxLength="10"
                      inputMode="numeric"
                      className={getFieldClassName('phone')}
                    />
                    {shouldShowError('phone') && formErrors.phone && (
                      <span className="field-error">{formErrors.phone}</span>
                    )}
                  </div>
                </div>
                <div className="input-group full-width">
                  <label>Alternate Phone Number</label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleInputChange}
                    placeholder="Enter alternate mobile number"
                    maxLength="10"
                    inputMode="numeric"
                  />
                </div>
                <div className="input-group full-width">
                  <label>{t('fullAddress')} *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    rows="3"
                    placeholder="Flat/House/Building name"
                    className={getFieldClassName('address')}
                  ></textarea>
                  {shouldShowError('address') && formErrors.address && (
                    <span className="field-error">{formErrors.address}</span>
                  )}
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>{t('city')} *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="City"
                      className={getFieldClassName('city')}
                    />
                    {shouldShowError('city') && formErrors.city && (
                      <span className="field-error">{formErrors.city}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>{t('state')} *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="State"
                      className={getFieldClassName('state')}
                    />
                    {shouldShowError('state') && formErrors.state && (
                      <span className="field-error">{formErrors.state}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>{t('pincode')} *</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Pincode"
                      maxLength="6"
                      inputMode="numeric"
                      className={getFieldClassName('zip')}
                    />
                    {shouldShowError('zip') && formErrors.zip && (
                      <span className="field-error">{formErrors.zip}</span>
                    )}
                  </div>
                </div>
                <div className="address-actions">
                  <div className="address-type-group" aria-label="Address type">
                    {['Home', 'Work'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`address-type-btn ${formData.addressType === type ? 'active' : ''}`}
                        onClick={() => handleAddressTypeChange(type)}
                      >
                        <i className={type === 'Home' ? 'fas fa-home' : 'fas fa-briefcase'}></i>
                        {type}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="save-address-btn"
                    onClick={saveCurrentAddress}
                    disabled={isSavingAddress || isPlacingOrder}
                  >
                    <i className="fas fa-bookmark"></i>
                    {isSavingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </div>
              )}

              {isPaymentPage && (
              <div className="checkout-card payment-card">
                <h3><i className="fas fa-credit-card"></i> {t('paymentMethod')}</h3>
                {addressError && <span className="field-error">{addressError}</span>}
                <div className="payment-options">
                  <label className={`payment-option ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                    />
                    <div className="pay-icon"><i className="fas fa-money-bill-wave"></i></div>
                    <div className="pay-text">
                      <strong>{t('cashOnDelivery')}</strong>
                      <span>{t('payOnDelivery')}</span>
                    </div>
                  </label>
                  <label className={`payment-option ${formData.paymentMethod === 'online' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={handleInputChange}
                    />
                    <div className="pay-icon"><i className="fas fa-university"></i></div>
                    <div className="pay-text">
                      <strong>{t('netBankingUpi')}</strong>
                      <span>{t('onlinePaymentDescription')}</span>
                    </div>
                  </label>
                </div>

                {formData.paymentMethod === 'online' && (
                  <div className={`payment-workspace ${qrPayment.isVisible ? 'has-qr' : ''}`}>
                    <div className="online-payment-panel">
                      <h4>{t('paymentDetails')}</h4>
                      <div className="payment-type-grid">
                      {[
                        { id: 'upi', label: t('upiId') },
                        { id: 'debit-card', label: t('debitCard') },
                        { id: 'credit-card', label: t('creditCard') },
                        { id: 'net-banking', label: t('netBanking') },
                        { id: 'qr-payment', label: 'QR Payment' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setOnlinePaymentType(option.id);
                            setPaymentErrors({});
                            qrStatusUnsubscribeRef.current?.();
                            qrStatusUnsubscribeRef.current = null;
                            setQrPayment(option.id === 'qr-payment'
                              ? {
                                  ...qrPaymentInitialState,
                                  isVisible: true,
                                  status: 'waiting',
                                  orderId: generateOrderId(),
                                }
                              : qrPaymentInitialState);
                          }}
                          className={`payment-type-btn ${onlinePaymentType === option.id ? 'active' : ''}`}
                        >
                          {option.label}
                        </button>
                      ))}
                      </div>

                    {onlinePaymentType === 'upi' && (
                      <div className="input-group full-width payment-field">
                        <label>{t('upiId')} *</label>
                        <input
                          type="text"
                          name="upiId"
                          value={paymentDetails.upiId}
                          onChange={handlePaymentDetailChange}
                          placeholder={t('upiPlaceholder')}
                        />
                        {paymentErrors.upiId && <span className="field-error">{paymentErrors.upiId}</span>}
                      </div>
                    )}

                    {(onlinePaymentType === 'debit-card' || onlinePaymentType === 'credit-card') && (
                      <>
                        <div className="input-group full-width payment-field">
                          <label>{t('cardNumber')} *</label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={paymentDetails.cardNumber}
                          onChange={handlePaymentDetailChange}
                          placeholder="1234567890123456"
                          maxLength="16"
                          inputMode="numeric"
                          autoComplete="cc-number"
                        />
                          {paymentErrors.cardNumber && <span className="field-error">{paymentErrors.cardNumber}</span>}
                        </div>
                        <div className="input-group full-width payment-field">
                          <label>{t('nameOnCard')} *</label>
                          <input
                            type="text"
                            name="cardName"
                            value={paymentDetails.cardName}
                            onChange={handlePaymentDetailChange}
                            placeholder={t('cardNamePlaceholder')}
                          />
                          {paymentErrors.cardName && <span className="field-error">{paymentErrors.cardName}</span>}
                        </div>
                        <div className="form-row">
                          <div className="input-group">
                            <label>{t('expiryDate')} *</label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={paymentDetails.expiryDate}
                              onChange={handlePaymentDetailChange}
                              placeholder="MM/YY"
                              maxLength="5"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                            />
                            {paymentErrors.expiryDate && <span className="field-error">{paymentErrors.expiryDate}</span>}
                          </div>
                          <div className="input-group">
                            <label>{t('cvv')} *</label>
                            <input
                              type="password"
                              name="cvv"
                              value={paymentDetails.cvv}
                              onChange={handlePaymentDetailChange}
                              placeholder="123"
                              maxLength="3"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                            />
                            {paymentErrors.cvv && <span className="field-error">{paymentErrors.cvv}</span>}
                          </div>
                        </div>
                      </>
                    )}

                      {onlinePaymentType === 'net-banking' && (
                      <div className="input-group full-width payment-field">
                        <label>{t('bankName')} *</label>
                        <select
                          name="bankName"
                          value={paymentDetails.bankName}
                          onChange={handlePaymentDetailChange}
                        >
                          <option value="">{t('selectBank')}</option>
                          {availableBanks.map((bank) => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="add-bank-toggle-btn"
                          onClick={() => {
                            setIsAddingBank((current) => !current);
                            setBankAddMessage({ type: '', text: '' });
                          }}
                        >
                          + {t('addBank')}
                        </button>
                        {isAddingBank && (
                          <div className="add-bank-panel">
                            <input
                              type="text"
                              value={newBankName}
                              onChange={(event) => {
                                setNewBankName(event.target.value);
                                setBankAddMessage({ type: '', text: '' });
                              }}
                              placeholder={t('enterBankName')}
                            />
                            <button type="button" onClick={handleAddBank}>
                              {t('add')}
                            </button>
                          </div>
                        )}
                        {bankAddMessage.text && (
                          <span className={`bank-add-message ${bankAddMessage.type}`}>
                            {bankAddMessage.text}
                          </span>
                        )}
                        {paymentDetails.bankName && (
                          <div className="bank-selection-note">
                            {t('selectedBankNote').replace('{{bankName}}', paymentDetails.bankName)}
                          </div>
                        )}
                        {paymentErrors.bankName && <span className="field-error">{paymentErrors.bankName}</span>}
                        {paymentDetails.bankName && (
                          <button
                            type="button"
                            className="netbanking-pay-now-btn"
                            onClick={handleNetBankingPayNow}
                          >
                            {t('payNow')}
                          </button>
                        )}
                      </div>
                      )}
                    </div>

                    {qrPayment.isVisible && (
                      <aside className="payment-qr-panel" aria-live="polite" aria-busy={qrPayment.isLoading}>
                        <div className="payment-qr-heading">
                          <span className="payment-qr-lock"><i className="fas fa-lock"></i></span>
                          <div>
                            <span>Secure UPI Payment</span>
                            <h4>Scan &amp; Pay</h4>
                          </div>
                        </div>

                        {qrPayment.isLoading ? (
                          <div className="payment-qr-loading">
                            <span className="payment-qr-spinner" aria-hidden="true"></span>
                            <strong>Generating Secure Payment QR...</strong>
                          </div>
                        ) : qrPayment.qrSource ? (
                          <>
                            <div className="payment-qr-code-wrap">
                              <img src={qrPayment.qrSource} alt={`Payment QR for order ${qrPayment.orderId}`} />
                            </div>
                            <div className="payment-qr-meta">
                              <div><span>Amount</span><strong>{formatCurrency(grandTotal)}</strong></div>
                              <div><span>Order ID</span><strong>{qrPayment.orderId}</strong></div>
                            </div>
                            <div className="payment-qr-apps">
                              <span>Scan using</span>
                              <p>Google Pay · PhonePe · Paytm · BHIM UPI · Any UPI App</p>
                            </div>
                          </>
                        ) : qrPayment.error ? (
                          <div className="payment-qr-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <strong>QR unavailable</strong>
                            <p>{qrPayment.error}</p>
                          </div>
                        ) : (
                          <>
                            {/* Replace this placeholder when the gateway returns a URL, Base64 image, or SVG. */}
                            <div className="payment-qr-placeholder" aria-label="Payment QR placeholder">
                              <i className="fas fa-qrcode" aria-hidden="true"></i>
                              <span>Secure QR will appear here</span>
                            </div>
                            <div className="payment-qr-meta">
                              <div><span>Amount</span><strong>{formatCurrency(grandTotal)}</strong></div>
                              <div><span>Order ID</span><strong>{qrPayment.orderId}</strong></div>
                            </div>
                            <div className="payment-qr-apps">
                              <span>Supported Apps</span>
                              <p>Google Pay · PhonePe · Paytm · BHIM UPI · Any UPI App</p>
                            </div>
                          </>
                        )}

                        <div className={`payment-qr-status ${qrPayment.status}`}>
                          <span aria-hidden="true"></span>
                          {qrPayment.status === 'processing'
                            ? 'Payment Processing'
                            : qrPayment.status === 'failed'
                              ? 'Payment Failed'
                              : qrPayment.status === 'generating'
                                ? 'Connecting securely'
                                : 'Waiting for Payment'}
                        </div>
                      </aside>
                    )}
                  </div>
                )}
              </div>
              )}

              <button
                type="submit"
                className="place-order-btn"
                disabled={!isCheckoutFormValid || isSavingAddress || isPlacingOrder}
              >
                {!isPaymentPage
                  ? `${isPlacingOrder || isSavingAddress ? 'Saving...' : 'Confirm & Pay'} ${formatCurrency(grandTotal)}`
                  : `${isPlacingOrder
                    ? 'Processing Payment...'
                    : formData.paymentMethod === 'online' && onlinePaymentType === 'qr-payment'
                    ? t('payNow')
                    : t('payNow')} ${formatCurrency(grandTotal)}`}
              </button>
            </form>
          </div>

          <div className="checkout-summary-section">
            <div className="order-summary-card">
              <h3>{t('orderSummary')}</h3>
              <div className="summary-items">
                {cartItems.map((item) => (
                  <div key={item.cartId} className="summary-item">
                    <div className="s-item-img app-line-thumb-sm">
                      <img src={getProductImage(item)} alt={productText(item, 'displayName')} loading="lazy" onError={handleProductImageError} />
                      <span className="s-item-qty">{item.quantity}</span>
                    </div>
                    <div className="s-item-info">
                      <h4>{productText(item, 'displayName')}</h4>
                      <span>{t('sku')}: {item.sku}</span>
                      <span>Selling Price: {formatCurrency(item.price)}</span>
                    </div>
                    <div className="s-item-price">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                {!isPaymentPage && (
                <>
                <div className="total-row">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                  />
                  <button type="button" onClick={loadCheckoutSummary} disabled={loading}>
                    Apply Coupon
                  </button>
                </div>
                <div className="total-row">
                  <label htmlFor="checkout-coins">Available Coins: {checkoutSummary?.availableCoins ?? 0}</label>
                  <input
                    id="checkout-coins"
                    type="number"
                    min="0"
                    max={checkoutSummary?.availableCoins ?? 0}
                    value={coinsRedeem}
                    onChange={(event) => setCoinsRedeem(Math.max(0, Number(event.target.value) || 0))}
                    aria-label="Coins to redeem"
                  />
                </div>
                </>
                )}
                <div className="total-row">
                  <span>Total Items</span>
                  <span>{checkoutSummary?.totalItems ?? 0}</span>
                </div>
                <div className="total-row">
                  <span>{t('subtotal').replace(':', '')}</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="total-row">
                  <span className="tax-summary-label">
                    {t('estimatedTax')}
                    <TaxInfoPopup taxableAmount={taxableAmount} cgst={cgst} sgst={sgst} totalGst={totalGst} />
                  </span>
                  <span>{formatCurrency(totalGst)}</span>
                </div>
                <div className="total-row">
                  <span>CGST</span>
                  <span>{formatCurrency(cgst)}</span>
                </div>
                <div className="total-row">
                  <span>SGST</span>
                  <span>{formatCurrency(sgst)}</span>
                </div>
                <div className="total-row">
                  <span>{t('shippingCharges')}</span>
                  <span className={deliveryCharge === 0 ? 'free' : ''}>
                    {deliveryCharge === 0 ? t('free').toUpperCase() : formatCurrency(deliveryCharge)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="total-row discount-row">
                    <span>{t('couponDiscount')}{appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}</span>
                    <span>- {formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {coinsDiscount > 0 && (
                  <div className="total-row discount-row">
                    <span>{t('coinsDiscount')}</span>
                    <span>- {formatCurrency(coinsDiscount)}</span>
                  </div>
                )}
                <div className="grand-total-row">
                  <span>{t('grandTotal')}</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="trust-badges">
                <div className="badge">
                  <i className="fas fa-shield-alt"></i>
                  <span>{t('sslSecure')}</span>
                </div>
                <div className="badge">
                  <i className="fas fa-undo"></i>
                  <span>{t('sevenDaysReturn')}</span>
                </div>
                <div className="badge">
                  <i className="fas fa-headset"></i>
                  <span>{t('expertSupport')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketplaceBanner enableFeatureDetails />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {netBankingFlow.isOpen && (
        <div className="bank-payment-overlay" role="dialog" aria-modal="true" aria-labelledby="bank-payment-title">
          <div className="bank-payment-modal">
            <div className="bank-payment-header">
              <div>
                <span className="bank-payment-kicker">{t('secureNetBanking')}</span>
                <h2 id="bank-payment-title">{paymentDetails.bankName}</h2>
              </div>
              {netBankingFlow.step !== 'success' && (
                <button type="button" className="bank-modal-close" onClick={closeNetBankingFlow} aria-label={t('closePaymentFlow')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {netBankingFlow.step !== 'failed' && (
              <div className="bank-payment-steps">
                {netBankingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`bank-payment-step ${index <= currentNetBankingStepIndex ? 'active' : ''} ${
                      step.id === netBankingFlow.step ? 'current' : ''
                    }`}
                  >
                    <span>{index < currentNetBankingStepIndex ? <i className="fas fa-check"></i> : index + 1}</span>
                    <small>{t(step.labelKey)}</small>
                  </div>
                ))}
              </div>
            )}

            <div className="bank-payment-body">
              {netBankingFlow.step === 'login' && (
                <div className="bank-payment-screen">
                  <div className="bank-payment-icon">
                    <i className="fas fa-university"></i>
                  </div>
                  <h3>{t('securePaymentGateway')}</h3>
                  <p>{t('gatewayDescription').replace('{{bankName}}', paymentDetails.bankName)}</p>
                  <div className="bank-form-grid">
                    <div className="bank-input-group">
                      <label>{t('username')} *</label>
                      <input
                        type="text"
                        name="username"
                        value={netBankingFlow.username}
                        onChange={handleNetBankingFieldChange}
                        placeholder={t('enterUsername')}
                        autoComplete="username"
                      />
                      {netBankingFlow.errors.username && <span className="field-error">{netBankingFlow.errors.username}</span>}
                    </div>
                    <div className="bank-input-group">
                      <label>{t('password')} *</label>
                      <input
                        type="password"
                        name="password"
                        value={netBankingFlow.password}
                        onChange={handleNetBankingFieldChange}
                        placeholder={t('enterPassword')}
                        autoComplete="current-password"
                      />
                      {netBankingFlow.errors.password && <span className="field-error">{netBankingFlow.errors.password}</span>}
                    </div>
                  </div>
                  <div className="bank-payment-actions">
                    {netBankingFlow.errors.api && <span className="field-error">{netBankingFlow.errors.api}</span>}
                    <button type="button" className="bank-primary-btn" onClick={handleNetBankingLoginSubmit} disabled={netBankingFlow.isLoading}>
                      {netBankingFlow.isLoading ? 'Please wait...' : t('proceedToOtp')}
                    </button>
                    <button type="button" className="bank-secondary-btn" onClick={closeNetBankingFlow}>
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}

              {netBankingFlow.step === 'otp' && (
                <div className="bank-payment-screen">
                  <div className="bank-payment-icon">
                    <i className="fas fa-key"></i>
                  </div>
                  <h3>{t('otpVerification')}</h3>
                  <p>{t('otpInstruction').replace('{{bankName}}', paymentDetails.bankName)}</p>
                  <div className="bank-input-group otp-field">
                    <label>{t('otp')} *</label>
                    <input
                      type="text"
                      name="otp"
                      value={netBankingFlow.otp}
                      onChange={handleNetBankingFieldChange}
                      placeholder="123456"
                      maxLength="6"
                      inputMode="numeric"
                    />
                    {netBankingFlow.errors.otp && <span className="field-error">{netBankingFlow.errors.otp}</span>}
                  </div>
                  <div className="bank-payment-actions">
                    {netBankingFlow.errors.api && <span className="field-error">{netBankingFlow.errors.api}</span>}
                    <button type="button" className="bank-primary-btn" onClick={handleNetBankingOtpSubmit} disabled={netBankingFlow.isLoading}>
                      {netBankingFlow.isLoading ? 'Please wait...' : t('verifyOtp')}
                    </button>
                    <button
                      type="button"
                      className="bank-secondary-btn"
                      onClick={() => setNetBankingFlow((current) => ({ ...current, step: 'login', errors: {} }))}
                    >
                      {t('back')}
                    </button>
                  </div>
                </div>
              )}

              {netBankingFlow.step === 'confirm' && (
                <div className="bank-payment-screen">
                  <div className="bank-payment-icon">
                    <i className="fas fa-receipt"></i>
                  </div>
                  <h3>{t('confirmPayment')}</h3>
                  <p>{t('reviewPaymentDetails')}</p>
                  <div className="bank-transaction-summary">
                    <div>
                      <span>{t('selectedBank')}</span>
                      <strong>{paymentDetails.bankName}</strong>
                    </div>
                    <div>
                      <span>{t('paymentAmount')}</span>
                      <strong>{'\u20B9'}{grandTotal.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span>{t('merchant')}</span>
                      <strong>{t('merchantName')}</strong>
                    </div>
                  </div>
                  <div className="bank-payment-actions">
                    <button type="button" className="bank-primary-btn" onClick={handleConfirmNetBankingPayment}>
                      {t('confirmPayment')}
                    </button>
                    <button type="button" className="bank-danger-btn" onClick={handleNetBankingFailure}>
                      {t('simulateFailure')}
                    </button>
                  </div>
                </div>
              )}

              {netBankingFlow.step === 'success' && (
                <div className="bank-payment-screen result-screen">
                  <div className="bank-result-icon success">
                    <i className="fas fa-check"></i>
                  </div>
                  <h3>{t('paymentSuccess')}</h3>
                  <p>{t('redirectingOrderConfirmation')}</p>
                </div>
              )}

              {netBankingFlow.step === 'failed' && (
                <div className="bank-payment-screen result-screen">
                  <div className="bank-result-icon failed">
                    <i className="fas fa-exclamation"></i>
                  </div>
                  <h3>{t('paymentFailed')}</h3>
                  <p>{t('paymentFailedMessage')}</p>
                  <div className="bank-payment-actions">
                    <button type="button" className="bank-primary-btn" onClick={retryNetBankingPayment}>
                      {t('retryPayment')}
                    </button>
                    <button type="button" className="bank-secondary-btn" onClick={changeNetBankingPaymentMethod}>
                      {t('changePaymentMethod')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CheckoutPage;
