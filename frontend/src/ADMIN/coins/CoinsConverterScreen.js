import React, { useMemo, useState, useEffect } from 'react';
import {
  BadgeIndianRupee,
  CheckCircle2,
  Coins,
  Gift,
  Info,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  WalletCards
} from 'lucide-react';
import '../catalog/adminModule.css';

const initialSettings = {
  rupeesPerCoin: 20,
  newUserBonus: 25,
  minimumOrderValue: 100,
  maxRedeemPercent: 20,
  bonusEnabled: true,
  expiryDays: 180,
  sampleOrderValue: 100,
  conversionRate: 1.0,
  minRedeemableCoins: 100,
  maxRedeemableCoins: 5000
};

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`;

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const StatCard = ({ icon: Icon, label, value, detail }) => (
  <div className="coin-stat-card">
    <span className="coin-stat-card__icon"><Icon size={18} /></span>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </div>
  </div>
);

const API_URL = 'http://shyamagrotools.com/api/Coins';

const CoinsConverterScreen = () => {
  const [settings, setSettings] = useState(initialSettings);
  const [savedMessage, setSavedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await fetch(API_URL, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (!res.ok) throw new Error(`Failed to fetch coins settings: ${res.status}`);
        const data = await res.json();
        
        if (isMounted && data) {
          setSettings((prev) => ({
            ...prev,
            id: data.id || 1,
            rupeesPerCoin: data.earnRate ? Math.round(1 / data.earnRate) : prev.rupeesPerCoin,
            conversionRate: data.conversionRate || 1.0,
            minRedeemableCoins: data.minRedeemableCoins || 100,
            maxRedeemableCoins: data.maxRedeemableCoins || 5000,
          }));
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load settings from API.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const rupeesPerCoin = numberValue(settings.rupeesPerCoin);
  const sampleOrderValue = numberValue(settings.sampleOrderValue);
  const newUserBonus = numberValue(settings.newUserBonus);
  const earnedCoins = rupeesPerCoin ? Math.floor(sampleOrderValue / rupeesPerCoin) : 0;
  const bonusPurchaseValue = newUserBonus * rupeesPerCoin;

  const examples = useMemo(() => {
    return [100, 250, 500, 1000].map((amount) => ({
      amount,
      coins: rupeesPerCoin ? Math.floor(amount / rupeesPerCoin) : 0
    }));
  }, [rupeesPerCoin]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSavedMessage('');
    setError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSavedMessage('');
    setError('');
    try {
      const payload = {
        id: settings.id || 1,
        conversionRate: Number(settings.conversionRate || 1.0),
        earnRate: settings.rupeesPerCoin ? (1 / Number(settings.rupeesPerCoin)) : 0.05,
        minRedeemableCoins: Number(settings.minRedeemableCoins || 100),
        maxRedeemableCoins: Number(settings.maxRedeemableCoins || 5000)
      };

      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      setSavedMessage('Coins settings updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setSavedMessage('');
    setError('');
  };

  if (isLoading) {
    return (
      <div className="coins-page">
        <section className="catalog-header coins-header">
          <div className="catalog-title-wrap">
            <span className="catalog-kicker">Coins Wallet</span>
            <h1>Coins Converter Settings</h1>
            <p>Loading loyalty settings from API...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="coins-page">
      <section className="catalog-header coins-header">
        <div className="catalog-title-wrap">
          <span className="catalog-kicker">Coins Wallet</span>
          <h1>Coins Converter Settings</h1>
          <p>Configure purchase-only loyalty coins for customer wallets. Current rule: every 20 rupees spent earns 1 coin.</p>
        </div>

        <div className="coins-hero-orbit" aria-hidden="true">
          <span className="coins-coin coins-coin--one">C</span>
          <span className="coins-coin coins-coin--two">C</span>
          <span className="coins-coin coins-coin--three">C</span>
          <WalletCards size={42} />
        </div>
      </section>

      {savedMessage && (
        <div className="catalog-alert">
          <CheckCircle2 size={18} />
          {savedMessage}
        </div>
      )}

      {error && (
        <div className="catalog-alert catalog-alert--warning" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Info size={18} />
          {error}
        </div>
      )}

      <section className="coins-stats-grid">
        <StatCard
          icon={BadgeIndianRupee}
          label="Earning Rule"
          value={`${formatCurrency(settings.rupeesPerCoin)} = 1 coin`}
          detail="A 100 rupee order gives 5 coins."
        />
        <StatCard
          icon={Gift}
          label="New User Bonus"
          value={`${settings.bonusEnabled ? newUserBonus : 0} coins`}
          detail="Bonus coins can be used only during purchase checkout."
        />
        <StatCard
          icon={ShieldCheck}
          label="Redeem Limit"
          value={`${settings.maxRedeemPercent}% of cart`}
          detail="Cart integration will be handled later."
        />
        <StatCard
          icon={TrendingUp}
          label="Sample Earned"
          value={`${earnedCoins} coins`}
          detail={`${formatCurrency(sampleOrderValue)} sample order value.`}
        />
      </section>

      <form className="coins-layout" onSubmit={handleSave}>
        <main className="catalog-stack">
          <section className="catalog-card">
            <div className="catalog-card__header">
              <div>
                <h2>Purchase Earning Rule</h2>
                <p className="catalog-card__subtitle">Coins are credited to the user's wallet after a successful order.</p>
              </div>
              <span className="catalog-badge catalog-badge--active">Purchase only</span>
            </div>

            <div className="catalog-form-grid">
              <div className="catalog-field">
                <label htmlFor="rupeesPerCoin">Rupees Required For 1 Coin</label>
                <input
                  id="rupeesPerCoin"
                  name="rupeesPerCoin"
                  type="number"
                  min="1"
                  value={settings.rupeesPerCoin}
                  onChange={handleChange}
                />
                <small>Set this to 20 for your required rule: 20 rupees = 1 coin.</small>
              </div>

              <div className="catalog-field">
                <label htmlFor="minimumOrderValue">Minimum Order Value</label>
                <input
                  id="minimumOrderValue"
                  name="minimumOrderValue"
                  type="number"
                  min="0"
                  value={settings.minimumOrderValue}
                  onChange={handleChange}
                />
                <small>Orders below this value can be excluded from coin earnings.</small>
              </div>

              <div className="catalog-field">
                <label htmlFor="sampleOrderValue">Preview Order Value</label>
                <input
                  id="sampleOrderValue"
                  name="sampleOrderValue"
                  type="number"
                  min="0"
                  value={settings.sampleOrderValue}
                  onChange={handleChange}
                />
                <small>Use this to test how many coins a customer earns.</small>
              </div>

              <div className="catalog-field">
                <label htmlFor="expiryDays">Coin Validity</label>
                <input
                  id="expiryDays"
                  name="expiryDays"
                  type="number"
                  min="1"
                  value={settings.expiryDays}
                  onChange={handleChange}
                />
                <small>Number of days coins remain valid in the wallet.</small>
              </div>

              <div className="catalog-field">
                <label htmlFor="conversionRate">Conversion Rate (INR per Coin)</label>
                <input
                  id="conversionRate"
                  name="conversionRate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.conversionRate || 1.0}
                  onChange={handleChange}
                />
                <small>Value of 1 coin when redeemed. E.g., 1.0 means 1 coin = INR 1.00.</small>
              </div>

              <div className="catalog-field">
                <label htmlFor="minRedeemableCoins">Minimum Redeemable Coins</label>
                <input
                  id="minRedeemableCoins"
                  name="minRedeemableCoins"
                  type="number"
                  min="0"
                  value={settings.minRedeemableCoins || 100}
                  onChange={handleChange}
                />
                <small>Minimum coin balance required to redeem during checkout.</small>
              </div>

              <div className="catalog-field">
                <label htmlFor="maxRedeemableCoins">Maximum Redeemable Coins</label>
                <input
                  id="maxRedeemableCoins"
                  name="maxRedeemableCoins"
                  type="number"
                  min="0"
                  value={settings.maxRedeemableCoins || 5000}
                  onChange={handleChange}
                />
                <small>Maximum coins allowed to be redeemed per single order.</small>
              </div>
            </div>

            <div className="coins-rule-preview">
              <div className="coins-rule-preview__icon">
                <Coins size={28} />
              </div>
              <div>
                <span>Live calculation</span>
                <strong>{formatCurrency(sampleOrderValue)} order = {earnedCoins} coins</strong>
                <p>Formula: floor(order value / {formatCurrency(rupeesPerCoin)}). For 100 rupees, the customer earns 5 coins.</p>
              </div>
            </div>
          </section>

          <section className="catalog-card">
            <div className="catalog-card__header">
              <div>
                <h2>New User Bonus</h2>
                <p className="catalog-card__subtitle">Reward newly logged-in or newly registered users with bonus coins for purchases.</p>
              </div>
              <label className="coins-toggle">
                <input
                  type="checkbox"
                  name="bonusEnabled"
                  checked={settings.bonusEnabled}
                  onChange={handleChange}
                />
                <span />
              </label>
            </div>

            <div className="catalog-form-grid">
              <div className="catalog-field">
                <label htmlFor="newUserBonus">Bonus Coins</label>
                <input
                  id="newUserBonus"
                  name="newUserBonus"
                  type="number"
                  min="0"
                  value={settings.newUserBonus}
                  onChange={handleChange}
                  disabled={!settings.bonusEnabled}
                />
                <small>Coins added to the user's coins wallet when the new-user bonus is active.</small>
              </div>

              <div className="catalog-field">
                <label htmlFor="maxRedeemPercent">Maximum Cart Redeem Percent</label>
                <input
                  id="maxRedeemPercent"
                  name="maxRedeemPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.maxRedeemPercent}
                  onChange={handleChange}
                />
                <small>Reserved for final cart redemption step later.</small>
              </div>
            </div>

            <div className="coins-bonus-panel">
              <Sparkles size={20} />
              <div>
                <strong>{settings.bonusEnabled ? `${newUserBonus} welcome coins enabled` : 'Welcome bonus disabled'}</strong>
                <p>
                  {settings.bonusEnabled
                    ? `At the current earning rate, this bonus has the same coin value as ${formatCurrency(bonusPurchaseValue)} of eligible purchase earnings.`
                    : 'Enable the switch when you want to grant bonus coins to new users.'}
                </p>
              </div>
            </div>
          </section>
        </main>

        <aside className="catalog-stack">
          <section className="catalog-card coins-wallet-card">
            <div className="coins-wallet-visual" aria-hidden="true">
              <span className="coins-wallet-coin coins-wallet-coin--a">C</span>
              <span className="coins-wallet-coin coins-wallet-coin--b">C</span>
              <span className="coins-wallet-coin coins-wallet-coin--c">C</span>
              <WalletCards size={56} />
            </div>
            <h2>Wallet Flow</h2>
            <p>Successful order -> coins added to user wallet -> coins redeemed only during future purchases.</p>
          </section>

          <section className="catalog-card">
            <div className="catalog-card__header">
              <div>
                <h2>Example Earnings</h2>
                <p className="catalog-card__subtitle">Based on the current conversion rule.</p>
              </div>
            </div>

            <div className="coins-example-list">
              {examples.map((item) => (
                <div key={item.amount}>
                  <span>{formatCurrency(item.amount)}</span>
                  <strong>{item.coins} coins</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="catalog-card">
            <div className="catalog-card__header">
              <div>
                <h2>Rules Summary</h2>
                <p className="catalog-card__subtitle">Clear behavior for future API/cart work.</p>
              </div>
            </div>

            <div className="coins-policy-list">
              <div>
                <ShoppingCart size={17} />
                <span>Coins are earned only from completed orders.</span>
              </div>
              <div>
                <WalletCards size={17} />
                <span>Earned and bonus coins sit in the user coins wallet.</span>
              </div>
              <div>
                <ShieldCheck size={17} />
                <span>Coins can only be redeemed for purchases, not cash withdrawal.</span>
              </div>
              <div>
                <Info size={17} />
                <span>Cart redemption will be connected in the final checkout step later.</span>
              </div>
            </div>
          </section>

          <div className="coins-actions">
            <button className="catalog-btn" type="button" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset
            </button>
            <button className="catalog-btn catalog-btn--primary" type="submit" disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default CoinsConverterScreen;
