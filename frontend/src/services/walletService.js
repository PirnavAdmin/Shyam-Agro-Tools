import apiClient from '../api/axios';
import { getAuthSession } from '../utils/auth';

const getUserWalletKey = () => {
  try {
    const session = getAuthSession();
    const userId = session?.user?.id || session?.user?.phone || 'guest';
    return `Agro_wallet_${userId}`;
  } catch (e) {
    return 'Agro_wallet_guest';
  }
};

export const WALLET_API_BASE_URL = (
  process.env.REACT_APP_WALLET_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');

const requestConfig = {
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

const unwrap = (data) => data?.data?.wallet || data?.wallet || data?.data || data || {};

const extractTransactions = (data) => {
  const source = unwrap(data);
  if (Array.isArray(source)) return source;
  if (Array.isArray(source.transactions)) return source.transactions;
  if (Array.isArray(source.Transactions)) return source.Transactions;
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.results)) return source.results;
  if (Array.isArray(data?.transactions)) return data.transactions;
  if (Array.isArray(data?.data?.transactions)) return data.data.transactions;
  return [];
};

export const normalizeWallet = (data = {}) => {
  const wallet = unwrap(data);
  const balance = Number(getFirstValue(wallet, [
    'availableCoins',
    'AvailableCoins',
    'balance',
    'Balance',
    'walletBalance',
    'WalletBalance',
    'amount',
    'Amount',
    'coinsBalance',
    'CoinsBalance',
  ]) || 0);

  return {
    id: getFirstValue(wallet, ['id', 'Id', 'walletId', 'WalletId', 'customerId', 'CustomerId', 'userId', 'UserId']),
    balance,
    currency: getFirstValue(wallet, ['currency', 'Currency']) || 'INR',
    totalEarned: Number(getFirstValue(wallet, ['totalEarnedCoins', 'TotalEarnedCoins', 'totalEarned', 'TotalEarned', 'earned', 'Earned']) || 0),
    totalRedeemed: Number(getFirstValue(wallet, ['totalRedeemedCoins', 'TotalRedeemedCoins', 'totalRedeemed', 'TotalRedeemed', 'redeemed', 'Redeemed']) || 0),
    updatedAt: getFirstValue(wallet, ['updatedAt', 'UpdatedAt', 'lastUpdated', 'LastUpdated']),
    raw: wallet,
  };
};

export const normalizeWalletTransaction = (transaction = {}, index = 0) => {
  const amount = Number(getFirstValue(transaction, ['amount', 'Amount', 'value', 'Value', 'coins', 'Coins']) || 0);
  const type = String(getFirstValue(transaction, ['type', 'Type', 'transactionType', 'TransactionType', 'status', 'Status']) || '');
  const direction = String(getFirstValue(transaction, ['direction', 'Direction']) || '').toLowerCase();
  const isCredit = direction === 'credit' || type.toLowerCase().includes('credit') || amount > 0;

  return {
    id: String(getFirstValue(transaction, ['id', 'Id', 'transactionId', 'TransactionId']) || `wallet-transaction-${index}`),
    title: getFirstValue(transaction, ['title', 'Title', 'description', 'Description', 'remarks', 'Remarks', 'reason', 'Reason']) || 'Wallet transaction',
    type: type || (isCredit ? 'Credit' : 'Debit'),
    amount,
    isCredit,
    date: getFirstValue(transaction, ['createdAt', 'CreatedAt', 'date', 'Date', 'transactionDate', 'TransactionDate']),
    reference: getFirstValue(transaction, ['reference', 'Reference', 'orderId', 'OrderId', 'paymentId', 'PaymentId']),
    balanceAfter: Number(getFirstValue(transaction, ['balanceAfter', 'BalanceAfter', 'closingBalance', 'ClosingBalance']) || 0),
    raw: transaction,
  };
};

export const normalizeWalletTransactions = (data = {}) => (
  extractTransactions(data).map(normalizeWalletTransaction)
);

export const updateLocalWalletAfterOrder = (coinsRedeemed = 0, coinsEarned = 0) => {
  try {
    const key = getUserWalletKey();
    const rawLocal = localStorage.getItem(key);
    let walletObj = null;
    if (rawLocal) {
      walletObj = JSON.parse(rawLocal);
    }
    
    if (!walletObj) {
      walletObj = {
        id: 'local-wallet',
        balance: 25,
        currency: 'INR',
        totalEarned: 25,
        totalRedeemed: 0,
      };
    }
    
    walletObj.balance = Math.max(0, Number(walletObj.balance || 0) - Number(coinsRedeemed) + Number(coinsEarned));
    walletObj.totalEarned = Number(walletObj.totalEarned || 0) + Number(coinsEarned);
    walletObj.totalRedeemed = Number(walletObj.totalRedeemed || 0) + Number(coinsRedeemed);
    walletObj.updatedAt = new Date().toISOString();
    
    localStorage.setItem(key, JSON.stringify(walletObj));
  } catch (err) {
    console.warn('Failed to update local shadow wallet:', err);
  }
};

export const getWallet = async () => {
  try {
    const response = await apiClient.get(`${WALLET_API_BASE_URL}/api/Wallet`, requestConfig);
    const apiWallet = normalizeWallet(response.data);
    const key = getUserWalletKey();
    localStorage.setItem(key, JSON.stringify(apiWallet));
    return apiWallet;
  } catch (err) {
    console.warn('Failed to fetch wallet from API, falling back to local shadow wallet:', err);
    try {
      const key = getUserWalletKey();
      const rawLocal = localStorage.getItem(key);
      if (rawLocal) {
        return JSON.parse(rawLocal);
      }
    } catch (e) {
      console.warn('Failed to read from local storage:', e);
    }
    return {
      id: 'local-wallet',
      balance: 25,
      currency: 'INR',
      totalEarned: 25,
      totalRedeemed: 0,
      updatedAt: new Date().toISOString()
    };
  }
};

export const getWalletTransactions = async () => {
  const response = await apiClient.get(`${WALLET_API_BASE_URL}/api/Wallet/transactions`, requestConfig);
  return normalizeWalletTransactions(response.data);
};

export const claimWelcomeBonus = async () => {
  const response = await apiClient.post(`${WALLET_API_BASE_URL}/api/Wallet/welcome-bonus`, {}, requestConfig);
  return response.data;
};
