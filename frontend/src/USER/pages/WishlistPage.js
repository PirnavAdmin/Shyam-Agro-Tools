import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, ShoppingCart, Trash2, Tag, Package } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import MarketplaceBanner from '../components/MarketplaceBanner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import './CartWishlistPerformance.css';
import './WishlistPage.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t, productText } = useLanguage();
  const { showToast } = useToast();
  const { wishlistItems, removeFromWishlist, refreshWishlist, loading } = useWishlist();
  const { isLoggedIn, user } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const userPhone = user?.phone || '';

  // Always re-fetch from API when navigating to this page so product
  // details are always up-to-date (not the optimistic-update cache).
  useEffect(() => {
    if (isLoggedIn && userPhone) {
      refreshWishlist();
    }
  }, [isLoggedIn, userPhone, refreshWishlist]);

  const handleAddToCart = async (product) => {
    const added = await addToCart(product);
    if (added) showToast(`${productText(product, 'name')} ${t('addedToCart')}`);
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    const removed = await removeFromWishlist(productId);
    setRemovingId(null);
    if (removed === true) showToast(t('removedFromWishlist'));
    else if (removed !== 'login-required') showToast(t('unableWishlist'), 'error');
  };

  return (
    <div className="cart-wishlist-page flex min-h-screen flex-col bg-[#f4f5f7]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      {/* Hero Banner */}
      <section className="wishlist-hero bg-dark px-4 py-8 md:py-12">
        <div className="mx-auto max-w-[1440px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-xs font-bold uppercase tracking-[4px] text-primary"
          >
            {t('savedProducts')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold uppercase tracking-tight text-white md:text-4xl"
          >
            {t('yourWishlist')}{' '}
            <span className="wishlist-count-badge">{wishlistItems.length}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm text-gray-400"
          >
            {wishlistItems.length === 0
              ? t('wishlistEmptyMessage')
              : `${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved for later`}
          </motion.p>
        </div>
      </section>

      <main className="cart-wishlist-main mx-auto w-full max-w-[1440px] flex-grow px-4 py-6 md:px-6 md:py-8 lg:px-10">
        <AnimatePresence mode="wait">
          {loading ? (
            /* ── Loading Skeleton ── */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="wishlist-table-wrapper"
            >
              <div className="wishlist-table-header">
                <div className="wt-col-product"><Package size={13} className="inline mr-1.5 opacity-60" />{t('productDetails')}</div>
                <div className="wt-col-price"><Tag size={13} className="inline mr-1.5 opacity-60" />{t('price')}</div>
                <div className="wt-col-actions">{t('actions')}</div>
              </div>
              <div className="wishlist-table-body">
                {[1, 2].map((i) => (
                  <div key={i} className="wishlist-row">
                    <div className="wishlist-product-cell">
                      <div className="wishlist-thumb wishlist-skeleton" style={{background:'#eee'}} />
                      <div style={{flex:1}}>
                        <div className="wishlist-skeleton" style={{height:14,width:'70%',marginBottom:8,borderRadius:4}} />
                        <div className="wishlist-skeleton" style={{height:10,width:'30%',borderRadius:4}} />
                      </div>
                    </div>
                    <div className="wt-col-price">
                      <div className="wishlist-skeleton" style={{height:18,width:60,borderRadius:4}} />
                    </div>
                    <div className="wishlist-actions-cell">
                      <div className="wishlist-skeleton" style={{height:36,width:160,borderRadius:6}} />
                      <div className="wishlist-skeleton" style={{height:36,width:160,borderRadius:6}} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : wishlistItems.length === 0 ? (
            /* ── Empty State ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="wishlist-empty-state"
            >
              <div className="wishlist-empty-icon">
                <Heart size={36} />
              </div>
              <h2 className="wishlist-empty-title">{t('wishlistEmptyTitle')}</h2>
              <p className="wishlist-empty-msg">{t('wishlistEmptyMessage')}</p>
              <button
                onClick={() => navigate('/categories')}
                className="wishlist-shop-btn"
              >
                {t('returnToShop')} <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : (
            /* ── Wishlist Table ── */
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="wishlist-table-wrapper"
            >
              {/* Table Header */}
              <div className="wishlist-table-header">
                <div className="wt-col-product">
                  <Package size={13} className="inline mr-1.5 opacity-60" />
                  {t('productDetails')}
                </div>
                <div className="wt-col-price">
                  <Tag size={13} className="inline mr-1.5 opacity-60" />
                  {t('price')}
                </div>
                <div className="wt-col-actions">{t('actions')}</div>
              </div>

              {/* Rows */}
              <div className="wishlist-table-body">
                <AnimatePresence>
                  {wishlistItems.map((item, index) => {
                    const name = productText(item, 'name') || item.name || 'Product';
                    const price = Number(item.price || item.sellingPrice || 0);
                    const mrp = Number(item.mrp || item.oldPrice || price);
                    const hasDiscount = mrp > price && price > 0;
                    const discountPct = hasDiscount
                      ? Math.round(((mrp - price) / mrp) * 100)
                      : 0;
                    const isRemoving = removingId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={`wishlist-row${isRemoving ? ' wishlist-row--removing' : ''}`}
                      >
                        {/* Product Details */}
                        <div className="wt-col-product wishlist-product-cell">
                          <button
                            type="button"
                            onClick={() => navigate(`/product/${item.id}`)}
                            className="wishlist-thumb"
                            aria-label={`View ${name}`}
                          >
                            <img
                              src={getProductImage(item)}
                              alt={name}
                              loading="lazy"
                              onError={handleProductImageError}
                            />
                          </button>
                          <div className="wishlist-product-info">
                            <button
                              type="button"
                              onClick={() => navigate(`/product/${item.id}`)}
                              className="wishlist-product-name"
                              title={name}
                            >
                              {name}
                            </button>
                            <span className="wishlist-sku">SKU: {item.sku || '—'}</span>
                            {item.stockStatus === 'Out of Stock' && (
                              <span className="wishlist-out-of-stock">Out of Stock</span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="wt-col-price wishlist-price-cell">
                          <span className="wishlist-price">
                            &#8377;{price > 0 ? price.toLocaleString() : '—'}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="wishlist-mrp">&#8377;{mrp.toLocaleString()}</span>
                              <span className="wishlist-discount-badge">{discountPct}% OFF</span>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="wt-col-actions wishlist-actions-cell">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="wishlist-btn wishlist-btn--primary"
                            disabled={isRemoving}
                          >
                            <ShoppingCart size={14} />
                            <span>{t('addToCart')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="wishlist-btn wishlist-btn--ghost"
                            disabled={isRemoving}
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 size={14} />
                            <span>{t('remove')}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="wishlist-table-footer">
                <button
                  onClick={() => navigate('/categories')}
                  className="wishlist-continue-btn"
                >
                  <ArrowRight size={15} /> {t('returnToShop') || 'Continue Shopping'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="cart-wishlist-bottom-section">
        <MarketplaceBanner />
      </div>
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default WishlistPage;
