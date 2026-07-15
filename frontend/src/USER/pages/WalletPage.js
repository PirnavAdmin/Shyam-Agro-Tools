import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { getWallet, getWalletTransactions } from '../../services/walletService';
import './WalletPage.css';

const formatCurrency = (value, currency = 'INR') => (
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
);

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const WalletPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, currency: 'INR', totalEarned: 0, totalRedeemed: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWallet = async () => {
    setLoading(true);
    setError('');

    try {
      const [walletData, transactionData] = await Promise.all([
        getWallet(),
        getWalletTransactions(),
      ]);
      setWallet(walletData);
      setTransactions(transactionData);
    } catch (requestError) {
      console.error('Unable to load wallet.', requestError);
      setError('Unable to load wallet details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const stats = useMemo(() => {
    const credited = transactions
      .filter((transaction) => transaction.isCredit)
      .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0);
    const debited = transactions
      .filter((transaction) => !transaction.isCredit)
      .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0);

    return {
      credited: wallet.totalEarned || credited,
      debited: wallet.totalRedeemed || debited,
      count: transactions.length,
    };
  }, [transactions, wallet.totalEarned, wallet.totalRedeemed]);

  return (
    <div className="wallet-page-shell flex min-h-screen flex-col bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="wallet-page-container">
        <section className="wallet-hero">
          <div>
            <span>Account</span>
            <h1>Wallet</h1>
            <p>View your wallet balance and recent wallet activity.</p>
          </div>
          <button type="button" onClick={loadWallet} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'wallet-spin' : ''} />
            Refresh
          </button>
        </section>

        <section className="wallet-summary-grid">
          <article className="wallet-balance-card">
            <span className="wallet-summary-icon"><Wallet size={26} /></span>
            <small>Available Balance</small>
            <strong>{loading ? 'Loading...' : formatCurrency(wallet.balance, wallet.currency)}</strong>
            {wallet.updatedAt && <p>Updated {formatDate(wallet.updatedAt)}</p>}
          </article>
          <article className="wallet-stat-card">
            <small>Total Credited</small>
            <strong>{formatCurrency(stats.credited, wallet.currency)}</strong>
          </article>
          <article className="wallet-stat-card">
            <small>Total Debited</small>
            <strong>{formatCurrency(stats.debited, wallet.currency)}</strong>
          </article>
          <article className="wallet-stat-card">
            <small>Transactions</small>
            <strong>{stats.count}</strong>
          </article>
        </section>

        {error && (
          <div className="wallet-alert" role="alert">
            {error}
          </div>
        )}

        <section className="wallet-transactions-panel">
          <div className="wallet-transactions-header">
            <div>
              <span>History</span>
              <h2>Wallet Transactions</h2>
            </div>
          </div>

          {loading ? (
            <div className="wallet-empty-state">Loading wallet transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="wallet-empty-state">No wallet transactions yet.</div>
          ) : (
            <div className="wallet-transaction-list">
              {transactions.map((transaction) => {
                const Icon = transaction.isCredit ? ArrowDownLeft : ArrowUpRight;
                return (
                  <article className="wallet-transaction-row" key={transaction.id}>
                    <span className={`wallet-transaction-icon ${transaction.isCredit ? 'credit' : 'debit'}`}>
                      <Icon size={18} />
                    </span>
                    <div className="wallet-transaction-main">
                      <strong>{transaction.title}</strong>
                      <span>{transaction.type} {transaction.reference ? `- ${transaction.reference}` : ''}</span>
                    </div>
                    <div className="wallet-transaction-meta">
                      <strong className={transaction.isCredit ? 'credit' : 'debit'}>
                        {transaction.isCredit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), wallet.currency)}
                      </strong>
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default WalletPage;
