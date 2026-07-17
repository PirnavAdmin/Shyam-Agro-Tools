import apiClient from '../api/axios';
import { normalizeAssetUrl } from '../utils/assetUrl';

export const COUPON_API_BASE_URL = (
  process.env.REACT_APP_COUPON_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');

const requestConfig = {
  skipAuth: true,
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

const getFirstValue = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'active', 'enabled'].includes(normalized)) return true;
  if (['false', '0', 'no', 'inactive', 'disabled'].includes(normalized)) return false;
  return fallback;
};

const titleCase = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

const getCouponTitleFromCode = (code) => {
  const baseName = String(code || '')
    .replace(/\d+/g, ' ')
    .replace(/[^a-zA-Z]+/g, ' ')
    .trim();

  return baseName ? `${titleCase(baseName)} coupon` : 'Checkout coupon';
};

const extractCoupons = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.Value)) return data.Value;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  if (Array.isArray(data?.coupons)) return data.coupons;
  if (Array.isArray(data?.Coupons)) return data.Coupons;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.Results)) return data.Results;
  return [];
};

export const normalizeCoupon = (coupon = {}, index = 0) => {
  const code = String(getFirstValue(coupon, ['code', 'Code', 'couponCode', 'CouponCode']) || '').trim();
  const title = String(
    getFirstValue(coupon, ['title', 'Title', 'name', 'Name', 'couponName', 'CouponName']) ||
      getCouponTitleFromCode(code)
  ).trim();
  const minOrderValue = toNumber(
    getFirstValue(coupon, [
      'minOrderValue',
      'MinOrderValue',
      'minimumOrderValue',
      'MinimumOrderValue',
      'minCartValue',
      'MinCartValue',
      'minimumCartValue',
      'MinimumCartValue',
    ])
  );
  const maxDiscountAmount = toNumber(
    getFirstValue(coupon, [
      'maxDiscountAmount',
      'MaxDiscountAmount',
      'maximumDiscountAmount',
      'MaximumDiscountAmount',
      'maxDiscount',
      'MaxDiscount',
      'maximumDiscount',
      'MaximumDiscount',
    ])
  );

  return {
    id: String(getFirstValue(coupon, ['id', 'Id', 'couponId', 'CouponId']) || code || `coupon-${index}`),
    code,
    title,
    name: title,
    description: String(getFirstValue(coupon, ['description', 'Description', 'details', 'Details']) || '').trim(),
    discountType: String(getFirstValue(coupon, ['discountType', 'DiscountType', 'type', 'Type']) || '').trim(),
    discountValue: toNumber(getFirstValue(coupon, ['discountValue', 'DiscountValue', 'value', 'Value'])),
    minOrderValue,
    minCartValue: minOrderValue,
    maxDiscountAmount,
    maxDiscount: maxDiscountAmount,
    usageLimit: toNumber(getFirstValue(coupon, ['usageLimit', 'UsageLimit', 'maxUsage', 'MaxUsage'])),
    usedCount: toNumber(getFirstValue(coupon, ['usedCount', 'UsedCount', 'usageCount', 'UsageCount'])),
    startDate: getFirstValue(coupon, ['startDate', 'StartDate', 'validFrom', 'ValidFrom']),
    endDate: getFirstValue(coupon, ['endDate', 'EndDate', 'validTill', 'ValidTill', 'validTo', 'ValidTo']),
    isActive: toBoolean(getFirstValue(coupon, ['isActive', 'IsActive', 'active', 'Active', 'status', 'Status']), true),
    backgroundImage: normalizeAssetUrl(
      String(
        getFirstValue(coupon, [
          'backgroundImage',
          'BackgroundImage',
          'backgroundImageUrl',
          'BackgroundImageUrl',
          'imageUrl',
          'ImageUrl',
          'bannerImage',
          'BannerImage',
        ]) || ''
      ).trim(),
      COUPON_API_BASE_URL,
      '/hero_banner.png'
    ),
    termsAndConditions:
      getFirstValue(coupon, [
        'termsAndConditions',
        'TermsAndConditions',
        'terms',
        'Terms',
        'tnc',
        'Tnc',
        'conditions',
        'Conditions',
      ]) || '',
    raw: coupon,
  };
};

const unwrapValidation = (data) => data?.data || data?.Data || data?.result || data?.Result || data || {};

export const getCoupons = async () => {
  const response = await apiClient.get(`${COUPON_API_BASE_URL}/api/Coupons`, requestConfig);
  return extractCoupons(response.data)
    .map(normalizeCoupon)
    .filter((coupon) => coupon.code);
};

export const validateCoupon = async ({ code, cartValue = 0 }) => {
  const couponCode = String(code || '').trim().toUpperCase();
  if (!couponCode) throw new Error('Coupon code is required.');

  const response = await apiClient.get(`${COUPON_API_BASE_URL}/api/Coupons/validate`, {
    ...requestConfig,
    params: {
      code: couponCode,
      cartValue,
    },
  });

  return unwrapValidation(response.data);
};
