import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Copy, ImageOff, RefreshCw, ShieldCheck, Tag } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useToast } from '../context/ToastContext';
import { getCoupons } from '../../services/couponService';
import './OffersPage.css';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDiscount = (coupon) => {
  const type = String(coupon.discountType || '').toLowerCase();
  const value = Number(coupon.discountValue || 0);

  if (!value) return 'Special offer';
  if (type.includes('percent') || type === '%' || type.includes('percentage')) {
    return `${value}% OFF`;
  }
  return `Rs. ${value.toLocaleString('en-IN')} OFF`;
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const getUsageText = (coupon) => {
  const usedCount = Number(coupon.usedCount || 0);
  const usageLimit = Number(coupon.usageLimit || 0);

  if (usageLimit > 0) return `${usedCount.toLocaleString('en-IN')} / ${usageLimit.toLocaleString('en-IN')} used`;
  if (usedCount > 0) return `${usedCount.toLocaleString('en-IN')} used`;
  return 'No usage yet';
};

const getTermsList = (terms) => {
  if (Array.isArray(terms)) {
    return terms.map((term) => String(term || '').trim()).filter(Boolean);
  }

  return String(terms || '')
    .split(/\r?\n|;|\|/)
    .map((term) => term.trim())
    .filter(Boolean);
};

const buildCouponNote = (coupon) => {
  const notes = [];
  const validUntil = formatDate(coupon.endDate);

  if (coupon.minOrderValue > 0) {
    notes.push(`Minimum order ${formatCurrency(coupon.minOrderValue)}`);
  }
  if (coupon.maxDiscountAmount > 0) {
    notes.push(`Max discount ${formatCurrency(coupon.maxDiscountAmount)}`);
  }
  if (validUntil) {
    notes.push(`Valid till ${validUntil}`);
  }

  return notes;
};

const copyText = async (text) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

const OffersPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const { showToast } = useToast();

  const loadCoupons = async () => {
    setIsLoading(true);
    setError('');

    try {
      const couponData = await getCoupons();
      setCoupons(couponData);
    } catch (loadError) {
      console.error('Unable to load coupons.', loadError);
      setCoupons([]);
      setError('Unable to load coupons right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCoupons = async () => {
      setIsLoading(true);
      setError('');

      try {
        const couponData = await getCoupons();
        if (isMounted) setCoupons(couponData);
      } catch (loadError) {
        console.error('Unable to load coupons.', loadError);
        if (isMounted) {
          setCoupons([]);
          setError('Unable to load coupons right now.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCoupons();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedCoupons = useMemo(
    () => [...coupons].sort((first, second) => Number(second.discountValue || 0) - Number(first.discountValue || 0)),
    [coupons]
  );
  const activeCouponsCount = useMemo(
    () => sortedCoupons.filter((coupon) => coupon.isActive !== false).length,
    [sortedCoupons]
  );

  const handleCopy = async (code) => {
    try {
      await copyText(code);
      setCopiedCode(code);
      showToast(`${code} copied.`);
      window.setTimeout(() => {
        setCopiedCode((currentCode) => (currentCode === code ? '' : currentCode));
      }, 1800);
    } catch (copyError) {
      console.error('Unable to copy coupon code.', copyError);
      showToast('Unable to copy coupon code.', 'error');
    }
  };

  return (
    <div className="offers-page-shell min-h-screen bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <section className="offers-page-hero bg-dark px-4 py-7 md:py-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] text-primary">
              <Tag size={14} />
              Coupons
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              Available Offers
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/70">
              Copy a coupon code and use it during checkout.
            </p>
          </div>
          <div className="offers-page-count border border-white/15 bg-white/10 px-4 py-3 text-left md:text-right">
            <span className="block text-[10px] font-black uppercase tracking-[2px] text-white/50">Active coupons</span>
            <strong className="text-2xl font-black text-white">{activeCouponsCount}</strong>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] px-3 py-5 md:px-5 md:py-7">
        {isLoading ? (
          <div className="offers-page-state border border-border bg-white px-6 py-12 text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin text-primary" size={28} />
            <p className="text-sm font-black uppercase tracking-[2px] text-gray-500">Loading coupons...</p>
          </div>
        ) : error ? (
          <div className="offers-page-state border border-border bg-white px-6 py-12 text-center">
            <h2 className="mb-3 text-xl font-black text-dark">{error}</h2>
            <button type="button" onClick={loadCoupons} className="btn-primary inline-flex items-center gap-2">
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : sortedCoupons.length > 0 ? (
          <div className="offers-page-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedCoupons.map((coupon) => {
              const notes = buildCouponNote(coupon);
              const isCopied = copiedCode === coupon.code;
              const couponTitle = String(coupon.title || '').trim();
              const terms = getTermsList(coupon.termsAndConditions);
              const isActive = coupon.isActive !== false;

              return (
                <article key={coupon.id} className="offers-page-card border border-border bg-white p-4">
                  {coupon.backgroundImage ? (
                    <div className="offers-page-image mb-4 overflow-hidden bg-gray-100">
                      <img src={coupon.backgroundImage} alt="" loading="lazy" />
                    </div>
                  ) : (
                    <div className="offers-page-image offers-page-image-empty mb-4 flex items-center justify-center bg-gray-100 text-gray-400">
                      <ImageOff size={22} />
                    </div>
                  )}

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-block bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[2px] text-primary">
                          {formatDiscount(coupon)}
                        </span>
                        <span className={`offers-page-status px-2.5 py-1 text-[10px] font-black uppercase tracking-[2px] ${isActive ? 'offers-page-status-active' : 'offers-page-status-inactive'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <h2 className="break-words text-lg font-black uppercase leading-tight text-dark">
                        {couponTitle}
                      </h2>
                    </div>
                    <span className="offers-page-ticket-icon icon-shade icon-teal shrink-0">
                      <Tag size={18} />
                    </span>
                  </div>

                  {coupon.description ? (
                    <p className="mb-4 text-sm font-medium leading-6 text-gray-500">{coupon.description}</p>
                  ) : null}

                  <div className="offers-page-code-row mb-4 flex items-center justify-between gap-2 border border-dashed border-primary/50 bg-[#F5FBF1] p-2">
                    <code className="min-w-0 flex-1 break-all px-2 text-sm font-black uppercase tracking-[1px] text-dark">
                      {coupon.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className="offers-page-copy-btn inline-flex shrink-0 items-center gap-2 bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-[#5eaa28]"
                      aria-label={`Copy coupon code ${coupon.code}`}
                    >
                      {isCopied ? <Check size={15} /> : <Copy size={15} />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <dl className="offers-page-details grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt>Discount type</dt>
                      <dd>{coupon.discountType || 'Offer'}</dd>
                    </div>
                    <div>
                      <dt>Discount value</dt>
                      <dd>{formatDiscount(coupon)}</dd>
                    </div>
                    <div>
                      <dt>Min order value</dt>
                      <dd>{coupon.minOrderValue > 0 ? formatCurrency(coupon.minOrderValue) : 'No minimum'}</dd>
                    </div>
                    <div>
                      <dt>Max discount amount</dt>
                      <dd>{coupon.maxDiscountAmount > 0 ? formatCurrency(coupon.maxDiscountAmount) : 'No cap'}</dd>
                    </div>
                    <div>
                      <dt>Start date</dt>
                      <dd>{formatDate(coupon.startDate) || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt>End date</dt>
                      <dd>{formatDate(coupon.endDate) || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt>Usage limit</dt>
                      <dd>{coupon.usageLimit > 0 ? coupon.usageLimit.toLocaleString('en-IN') : 'Unlimited'}</dd>
                    </div>
                    <div>
                      <dt>Used count</dt>
                      <dd>{getUsageText(coupon)}</dd>
                    </div>
                  </dl>

                  {notes.length > 0 ? (
                    <div className="offers-page-note mt-4 flex gap-2 text-xs font-semibold text-gray-500">
                      <CalendarDays size={15} className="mt-0.5 shrink-0 text-primary" />
                      <span>{notes.join(' | ')}</span>
                    </div>
                  ) : null}

                  {terms.length > 0 ? (
                    <div className="offers-page-terms mt-4 border-t border-border pt-4">
                      <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[1px] text-dark">
                        <ShieldCheck size={15} className="text-primary" />
                        Terms and conditions
                      </h3>
                      <ul className="space-y-1.5 text-xs font-semibold text-gray-500">
                        {terms.map((term) => (
                          <li key={term}>{term}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="offers-page-state border border-border bg-white px-6 py-12 text-center">
            <h2 className="mb-2 text-xl font-black text-dark">No coupons available.</h2>
            <p className="text-sm font-semibold text-gray-500">Please check back later for new offers.</p>
          </div>
        )}
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default OffersPage;
