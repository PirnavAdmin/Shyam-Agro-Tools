import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Heart, Share2, ShieldCheck, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { shareProduct } from '../utils/productShare';
import { getProductImage, handleProductImageError } from '../../utils/productImage';

const formatPrice = (value) => {
  if (!value && value !== 0) return '';
  return `\u20B9${Number(value).toLocaleString('en-IN')}`;
};

const ProductCard = ({ product, layout = 'grid', animateOnView = true }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t, productText } = useLanguage();
  const { showToast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const isList = layout === 'list';
  const productName = productText(product, 'name');
  const productImage = getProductImage(product);
  const isInStock = product.stockStatus !== 'out-of-stock' && Number(product.stockQuantity ?? product.stockCount ?? 0) > 0;
  const stockLabel = isInStock ? t('inStock') : t('outOfStock');
  const shortDescription =
    productText(product, 'shortDesc') ||
    productText(product, 'shortDescription') ||
    product.shortDescription ||
    product.shortDesc;
  const hasOffer = Boolean(product.hasOffer) && (
    Number(product.discountPercent) > 0 || 
    (product.price && product.offerPrice && Number(product.price) > Number(product.offerPrice))
  );
  const displayPrice = hasOffer ? product.offerPrice || product.price : product.price;

  let discountPercent = Number(product.discountPercent || 0);
  if (hasOffer && !discountPercent && product.price && product.offerPrice) {
    const original = Number(product.price);
    const offer = Number(product.offerPrice);
    if (original > offer) {
      discountPercent = Math.round(((original - offer) / original) * 100);
    }
  }

  const discountLabel = (hasOffer && discountPercent > 0)
    ? `${discountPercent}% ${t('off') || 'OFF'}`
    : '';

  const handleViewDetails = () => navigate(`/product/${product.id}`);

  const handleWishlistClick = async (event) => {
    event.stopPropagation();
    const result = await toggleWishlist(product);

    if (result === 'added') showToast(t('addedToWishlist'));
    else if (result === 'removed') showToast(t('removedFromWishlist'));
    else if (result !== 'login-required') showToast(t('unableWishlist'), 'error');
  };

  const handleShareClick = async (event) => {
    event.stopPropagation();

    try {
      const result = await shareProduct({ product, productName });
      if (result === 'copied') showToast(t('productLinkCopied'));
    } catch (error) {
      console.error('Product share failed', error);
      showToast(t('unableShare'), 'error');
    }
  };

  const handleAddToCart = async (event) => {
    event.stopPropagation();
    if (!isInStock) {
      showToast(t('productUnavailable'), 'error');
      return;
    }

    const wasAdded = await addToCart(product);
    if (wasAdded) showToast(`${productName} ${t('addedToCart')}`);
  };

  return (
    <motion.article
      initial={animateOnView ? { opacity: 0, y: 16 } : false}
      whileInView={animateOnView ? { opacity: 1, y: 0 } : undefined}
      viewport={animateOnView ? { once: true, margin: '-40px' } : undefined}
      onClick={handleViewDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleViewDetails();
        }
      }}
      role="button"
      tabIndex={0}
      className={`product-card-static flex h-full cursor-pointer overflow-hidden border border-border bg-white ${
        isList ? 'flex-col md:flex-row' : 'flex-col'
      } ${isInStock ? '' : 'out-of-stock'}`}
    >
      <div
        className={`product-card-media product-image-wrapper relative bg-[#f7f8f4] ${
          isList ? 'product-card-media-list md:w-64 md:shrink-0' : ''
        }`}
      >
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          {product.madeInIndia && (
            <span className="product-stock-badge product-made-in-india-badge">
              {t('madeInIndia')}
            </span>
          )}
          {discountLabel && (
            <span className="w-fit bg-red-500 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
              {discountLabel}
            </span>
          )}
          <span className={`product-stock-badge ${isInStock ? 'product-stock-badge-in' : 'product-stock-badge-out'}`}>
            {stockLabel}
          </span>
        </div>

        <div className="product-card-actions absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`icon-shade icon-yellow h-8 w-8 border border-border ${
              isWishlisted ? 'text-primary' : 'text-dark'
            }`}
            aria-label={t('addToWishlist')}
          >
            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={handleShareClick}
            className="icon-shade icon-teal h-8 w-8 border border-border"
            aria-label={t('shareProduct')}
          >
            <Share2 size={15} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleViewDetails();
            }}
            className="icon-shade icon-grey h-8 w-8 border border-border"
            aria-label={t('viewDetails')}
          >
            <Eye size={15} />
          </button>
        </div>

        <img
          src={productImage}
          alt={productName}
          loading="lazy"
          onLoad={(event) => {
            event.currentTarget.classList.add('product-card-media-image-loaded');
          }}
          onError={handleProductImageError}
          className="product-card-media-image product-card-media-image-loaded p-3"
        />
      </div>

      <div className={`flex flex-1 flex-col p-3 ${isList ? 'md:p-4' : ''}`}>
        <div className="mb-1.5 flex items-center gap-1">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                size={12}
                className={`rating-star-hover icon-shade icon-yellow icon-shade-sm p-1 ${index < Math.round(product.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
              />
            ))}
            <span className="ml-1 text-xs font-semibold text-gray-500">{product.rating || '4.7'}</span>
          </div>
        </div>

        <div className="mb-1.5 text-left text-[13px] font-semibold uppercase leading-snug tracking-tight text-dark h-[38px] overflow-hidden line-clamp-2">
          {productName}
        </div>

        <div className="h-[32px] mb-2 overflow-hidden">
          {shortDescription ? (
            <p className="line-clamp-2 text-[11px] font-normal leading-4 text-gray-500">
              {shortDescription}
            </p>
          ) : null}
        </div>

        <div className={`mb-2 product-card-stock-line ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
          {stockLabel}
          {isInStock && Number(product.stockQuantity) > 0 ? ` • ${product.stockQuantity}` : ''}
        </div>

        <div className="mt-auto">
          <div className="mb-1.5 flex flex-wrap items-end gap-2">
            <span className="text-base font-bold text-primary">{formatPrice(displayPrice)}</span>
          </div>

          {product.codAvailable ? (
            <div className="product-cod-available-badge mb-2 inline-flex max-w-full items-center gap-1 bg-green-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-green-700">
              <span className="icon-shade icon-teal icon-shade-sm"><ShieldCheck size={12} /></span> {t('codAvailable')}
            </div>
          ) : (
            <div className="mb-2 h-[18px]" />
          )}

          <div className="grid gap-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="product-card-add-btn flex items-center justify-center gap-2 bg-dark px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              <span className="icon-shade icon-grey icon-shade-sm"><ShoppingCart size={15} /></span> {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
