import axios from '../api/axios';

export const COINS_API_BASE_URL = (
  process.env.REACT_APP_COINS_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');

const requestConfig = {
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const requiredCoinFields = [
  'conversionRate',
  'earnRate',
  'minRedeemableCoins',
  'maxRedeemableCoins',
  'rupeesRequiredForOneCoin',
  'minimumOrderValue',
  'maxCartRedeemPercent',
  'welcomeBonusCoins',
  'coinValidityDays',
  'isWelcomeBonusEnabled',
  'isActive',
];

export const isValidCoinsConfiguration = (coinsConfig) => (
  Boolean(coinsConfig) &&
  typeof coinsConfig === 'object' &&
  !Array.isArray(coinsConfig) &&
  requiredCoinFields.every((field) => Object.prototype.hasOwnProperty.call(coinsConfig, field))
);

export const getCoinsConfiguration = async () => {
  try {
    const response = await axios.get(`${COINS_API_BASE_URL}/api/Coins`, requestConfig);
    const coinsConfig = response.data?.data ?? response.data;

    if (!isValidCoinsConfiguration(coinsConfig)) {
      throw new Error('Invalid coins configuration response.');
    }

    return coinsConfig;
  } catch (error) {
    console.error('Unable to load coins configuration.', error);
    throw error;
  }
};

export const loadCoins = () => getCoinsConfiguration();

export const refreshCoins = () => getCoinsConfiguration();

export const getCoinsErrorMessage = (error) => {
  if (error?.code === 'ECONNABORTED') {
    return 'Coins configuration request timed out. Please try again.';
  }

  if (error?.response) {
    return 'Unable to load coins configuration from the server.';
  }

  if (error?.request) {
    return 'Network error while loading coins configuration.';
  }

  return error?.message || 'Unable to load coins configuration.';
};

export const calculateEarnedCoins = (orderAmount, coinsConfig) => (
  Math.floor(Math.max(Number(orderAmount) || 0, 0) * (Number(coinsConfig?.earnRate) || 0))
);

export const calculateCoinValue = (coins, coinsConfig) => (
  Math.max(Number(coins) || 0, 0) * (Number(coinsConfig?.conversionRate) || 0)
);

export const calculateMaxCartRedeemAmount = (cartTotal, coinsConfig) => (
  (Math.max(Number(cartTotal) || 0, 0) * (Number(coinsConfig?.maxCartRedeemPercent) || 0)) / 100
);

export const validateCoinRedemption = ({ coinsToRedeem, availableCoins, cartTotal, coinsConfig }) => {
  const requestedCoins = Math.max(Number(coinsToRedeem) || 0, 0);
  if (!requestedCoins) return '';

  if (!coinsConfig?.isActive) {
    return 'Coins are currently disabled.';
  }

  const minRedeemableCoins = Number(coinsConfig?.minRedeemableCoins) || 0;
  const maxRedeemableCoins = Number(coinsConfig?.maxRedeemableCoins) || 0;
  const minimumOrderValue = Number(coinsConfig?.minimumOrderValue) || 0;
  const redeemableCoins = Math.max(Number(availableCoins) || 0, 0);
  const maxCartRedeemAmount = calculateMaxCartRedeemAmount(cartTotal, coinsConfig);
  const requestedCoinValue = calculateCoinValue(requestedCoins, coinsConfig);

  if (redeemableCoins < minRedeemableCoins) {
    return `You need at least ${minRedeemableCoins} coins to redeem.`;
  }

  if (requestedCoins > redeemableCoins) {
    return `You only have ${redeemableCoins} coins available.`;
  }

  if (requestedCoins < minRedeemableCoins) {
    return `Minimum redeemable coins is ${minRedeemableCoins}.`;
  }

  if (maxRedeemableCoins > 0 && requestedCoins > maxRedeemableCoins) {
    return `Maximum redeemable coins is ${maxRedeemableCoins}.`;
  }

  if (minimumOrderValue > 0 && Number(cartTotal) < minimumOrderValue) {
    return `Minimum order value for coin redemption is ${minimumOrderValue}.`;
  }

  if (maxCartRedeemAmount > 0 && requestedCoinValue > maxCartRedeemAmount) {
    return `Coins can cover up to ${coinsConfig.maxCartRedeemPercent}% of the cart total.`;
  }

  return '';
};
