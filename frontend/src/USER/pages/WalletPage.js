import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { getWallet, getWalletTransactions, claimWelcomeBonus } from '../../services/walletService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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

const formatCoins = (value, lang = 'en') => {
  const num = Number(value) || 0;
  if (lang === 'te') {
    return `${num.toLocaleString('en-IN')} నాణేలు`;
  }
  if (lang === 'hi') {
    return `${num.toLocaleString('en-IN')} कॉइन`;
  }
  return `${num.toLocaleString('en-IN')} Coin${num !== 1 ? 's' : ''}`;
};

const walletTranslations = {
  en: {
    account: 'Account',
    wallet: 'Wallet',
    description: 'View your rewards coins balance and recent wallet activity.',
    refresh: 'Refresh',
    accessTitle: 'Access Your Coins Wallet',
    accessDesc: 'Please log in to view your available coins, bonus rewards, and transaction history.',
    loginSignUp: 'Login / Sign Up',
    availableCoins: 'Available Coins Balance',
    equivalentValue: 'Equivalent value',
    totalEarned: 'Total Earned',
    totalRedeemed: 'Total Redeemed',
    transactions: 'Transactions',
    records: 'Total records',
    history: 'History',
    title: 'Wallet Transactions',
    loading: 'Loading wallet transactions...',
    empty: 'No wallet transactions yet.',
    updated: 'Updated',
    value: 'Value',
  },
  te: {
    account: 'ఖాతా',
    wallet: 'వాలెట్',
    description: 'మీ రివార్డ్ నాణేల బ్యాలెన్స్ మరియు ఇటీవలి వాలెట్ లావాదేవీలను చూడండి.',
    refresh: 'రిఫ్రెష్',
    accessTitle: 'మీ నాణేల వాలెట్‌ను యాక్సెస్ చేయండి',
    accessDesc: 'మీ అందుబాటులో ఉన్న నాణేలు, బోనస్ రివార్డులు మరియు లావాదేవీల చరిత్రను చూడటానికి దయచేసి లాగిన్ చేయండి.',
    loginSignUp: 'లాగిన్ / సైన్ అప్',
    availableCoins: 'అందుబాటులో ఉన్న నాణేల బ్యాలెన్స్',
    equivalentValue: 'సమానమైన విలువ',
    totalEarned: 'మొత్తం సంపాదించినవి',
    totalRedeemed: 'మొత్తం రీడీమ్ చేసినవి',
    transactions: 'లావాదేవీలు',
    records: 'మొత్తం రికార్డులు',
    history: 'చరిత్ర',
    title: 'వాలెట్ లావాదేవీలు',
    loading: 'వాలెట్ లావాదేవీలు లోడ్ అవుతున్నాయి...',
    empty: 'ఇంకా వాలెట్ లావాదేవీలు లేవు.',
    updated: 'నవీకరించబడింది',
    value: 'విలువ',
  },
  hi: {
    account: 'खाता',
    wallet: 'वॉलेट',
    description: 'अपने रिवॉर्ड कॉइन का बैलेंस और हाल ही में वॉलेट का लेन-देन देखें।',
    refresh: 'रिफ्रेश',
    accessTitle: 'अपने कॉइन वॉलेट तक पहुंचें',
    accessDesc: 'अपने उपलब्ध कॉइन, बोनस पुरस्कार और लेन-देन इतिहास देखने के लिए कृपया लॉग इन करें।',
    loginSignUp: 'लॉगिन / साइन अप',
    availableCoins: 'उपलब्ध कॉइन बैलेंस',
    equivalentValue: 'समतुल्य मूल्य',
    totalEarned: 'कुल अर्जित',
    totalRedeemed: 'कुल भुनाया गया',
    transactions: 'लेन-देन',
    records: 'कुल रिकॉर्ड',
    history: 'इतिहास',
    title: 'वॉलेट लेन-देन',
    loading: 'वॉलेट लेन-देन लोड हो रहा है...',
    empty: 'अभी तक कोई वॉलेट लेन-देन नहीं है।',
    updated: 'अपडेट किया गया',
    value: 'मूल्य',
  }
};

const WalletPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { activeLanguage } = useLanguage();
  const code = activeLanguage?.code || 'en';
  const wt = walletTranslations[code] || walletTranslations.en;

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, currency: 'INR', totalEarned: 0, totalRedeemed: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [welcomeBonusClaimed, setWelcomeBonusClaimed] = useState(false);

  const loadWallet = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!welcomeBonusClaimed || force) {
        try {
          await claimWelcomeBonus();
          setWelcomeBonusClaimed(true);
        } catch (bonusErr) {
          console.log('Skipping welcome bonus claim:', bonusErr.message);
        }
      }

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
  }, [isAuthenticated, welcomeBonusClaimed]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadWallet();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, loadWallet]);

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
            <span>{wt.account}</span>
            <h1>{wt.wallet}</h1>
            <p>{wt.description}</p>
          </div>
          {isAuthenticated && (
            <button type="button" onClick={() => loadWallet(true)} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'wallet-spin' : ''} />
              {wt.refresh}
            </button>
          )}
        </section>

        {!isAuthenticated ? (
          <section className="wallet-unauthenticated-state">
            <Wallet size={48} className="unauth-wallet-icon" />
            <h3>{wt.accessTitle}</h3>
            <p>{wt.accessDesc}</p>
            <button type="button" onClick={() => setIsLoginOpen(true)} className="wallet-login-btn">
              {wt.loginSignUp}
            </button>
          </section>
        ) : (
          <>
            <section className="wallet-summary-grid">
              <article className="wallet-balance-card">
                <span className="wallet-summary-icon"><Wallet size={26} /></span>
                <small>{wt.availableCoins}</small>
                <strong>{loading ? 'Loading...' : formatCoins(wallet.balance, code)}</strong>
                <p className="wallet-currency-equivalent">
                  {loading ? '' : `${wt.equivalentValue}: ${formatCurrency(wallet.balance * (wallet.raw?.conversionRate || 1), wallet.currency)}`}
                </p>
                {wallet.updatedAt && <p className="wallet-update-time">{wt.updated} {formatDate(wallet.updatedAt)}</p>}
              </article>
              <article className="wallet-stat-card">
                <small>{wt.totalEarned}</small>
                <strong>{formatCoins(stats.credited, code)}</strong>
                <p className="wallet-currency-equivalent">
                  {`${wt.value}: ${formatCurrency(stats.credited * (wallet.raw?.conversionRate || 1), wallet.currency)}`}
                </p>
              </article>
              <article className="wallet-stat-card">
                <small>{wt.totalRedeemed}</small>
                <strong>{formatCoins(stats.debited, code)}</strong>
                <p className="wallet-currency-equivalent">
                  {`${wt.value}: ${formatCurrency(stats.debited * (wallet.raw?.conversionRate || 1), wallet.currency)}`}
                </p>
              </article>
              <article className="wallet-stat-card">
                <small>{wt.transactions}</small>
                <strong>{stats.count}</strong>
                <p className="wallet-currency-equivalent">{wt.records}</p>
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
                  <span>{wt.history}</span>
                  <h2>{wt.title}</h2>
                </div>
              </div>

              {loading ? (
                <div className="wallet-empty-state">{wt.loading}</div>
              ) : transactions.length === 0 ? (
                <div className="wallet-empty-state">{wt.empty}</div>
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
                            {transaction.isCredit ? '+' : '-'}{formatCoins(Math.abs(transaction.amount), code)}
                          </strong>
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default WalletPage;
