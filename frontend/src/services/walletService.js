import apiClient from '../api/axios';

export const WALLET_API_BASE_URL = (
  process.env.REACT_APP_WALLET_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://wildlife-unwieldy-devotee.ngrok-free.dev'
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
    id: getFirstValue(wallet, ['id', 'Id', 'walletId', 'WalletId']),
    balance,
    currency: getFirstValue(wallet, ['currency', 'Currency']) || 'INR',
    totalEarned: Number(getFirstValue(wallet, ['totalEarned', 'TotalEarned', 'earned', 'Earned']) || 0),
    totalRedeemed: Number(getFirstValue(wallet, ['totalRedeemed', 'TotalRedeemed', 'redeemed', 'Redeemed']) || 0),
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

export const getWallet = async () => {
  const response = await apiClient.get(`${WALLET_API_BASE_URL}/api/Wallet`, requestConfig);
  return normalizeWallet(response.data);
};

export const getWalletTransactions = async () => {
  const response = await apiClient.get(`${WALLET_API_BASE_URL}/api/Wallet/transactions`, requestConfig);
  return normalizeWalletTransactions(response.data);
};
