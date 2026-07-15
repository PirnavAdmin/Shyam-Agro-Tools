import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import MarketplaceBanner from '../components/MarketplaceBanner';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import './CartWishlistPerformance.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t, productText } = useLanguage();
  const { showToast } = useToast();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleAddToCart = async (product) => {
    const added = await addToCart(product);
    if (added) showToast(`${productText(product, 'name')} ${t('addedToCart')}`);
  };

  const handleRemove = async (productId) => {
    const removed = await removeFromWishlist(productId);
    if (removed === true) showToast(t('removedFromWishlist'));
    else if (removed !== 'login-required') showToast(t('unableWishlist'), 'error');
  };

  return (
    <div className="cart-wishlist-page flex min-h-screen flex-col bg-[#f8f9fa]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <section className="bg-dark px-4 py-7 md:py-10">
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
            {t('yourWishlist')} <span className="text-primary">({wishlistItems.length})</span>
          </motion.h1>
        </div>
      </section>

      <main className="cart-wishlist-main mx-auto w-full max-w-[1440px] flex-grow px-3 py-5 md:px-6 md:py-8 lg:px-10">
        <AnimatePresence mode="wait">
          {wishlistItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center border border-border bg-white px-5 py-8 text-center shadow-sm md:px-8 md:py-10"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-light text-gray-300">
                <Heart size={32} />
              </div>
              <h2 className="mb-2 text-xl font-bold uppercase tracking-tight text-dark">{t('wishlistEmptyTitle')}</h2>
              <p className="mb-5 max-w-sm text-sm font-medium leading-6 text-gray-500">
                {t('wishlistEmptyMessage')}
              </p>
              <button onClick={() => navigate('/categories')} className="btn-primary flex items-center gap-2 px-7 py-3">
                {t('returnToShop')} <ArrowRight size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border border-border bg-white shadow-sm"
            >
              <div className="hidden grid-cols-[1fr_120px_260px] gap-3 border-b border-border bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 md:grid">
                <div>{t('productDetails')}</div>
                <div className="text-center">{t('price')}</div>
                <div className="text-right">{t('actions')}</div>
              </div>

              <div className="cart-wishlist-list divide-y divide-gray-100">
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="cart-wishlist-row grid grid-cols-1 items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50 md:grid-cols-[1fr_120px_260px]"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${item.id}`)}
                        className="app-line-thumb shrink-0 border border-gray-100 bg-light p-2"
                      >
                        <img src={getProductImage(item)} alt={productText(item, 'name')} loading="lazy" onError={handleProductImageError} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/product/${item.id}`)}
                          className="mb-1 block max-w-full truncate text-left font-bold uppercase tracking-wide text-dark transition-colors hover:text-primary"
                        >
                          {productText(item, 'name')}
                        </button>
                        <p className="text-[10px] font-bold uppercase text-gray-400">SKU: {item.sku}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 font-bold text-dark md:block md:border-t-0 md:pt-0 md:text-center">
                      <span className="text-[10px] font-black uppercase text-gray-400 md:hidden">{t('price')}:</span>
                      &#8377;{Number(item.price || 0).toLocaleString()}
                    </div>

                    <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-2 md:border-t-0 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="btn-primary flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase"
                      >
                        <ShoppingCart size={14} /> {t('addToCart')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="btn-outline flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase"
                      >
                        <Trash2 size={14} /> {t('remove')}
                      </button>
                    </div>
                  </div>
                ))}
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
