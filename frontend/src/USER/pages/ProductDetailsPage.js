import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import RelatedProducts from '../components/RelatedProducts';
import { useCart } from '../context/CartContext';
import { useCategories } from '../context/CategoryContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { shareProduct } from '../utils/productShare';
import { getProductById } from '../../services/productService';
import { getProductFeatures } from '../../services/productFeatureService';
import { createProductReview, getProductReviews } from '../../services/productReviewService';
import { getProductImage, PRODUCT_IMAGE_FALLBACK } from '../../utils/productImage';
import './ProductDetailsPage.css';

const FALLBACK_IMAGE = PRODUCT_IMAGE_FALLBACK;
const loadedDetailImages = new Set();

const normalizeDetailImageUrl = (url) => getProductImage({ image: url });

const mapProductForCart = (product) => ({
  ...product,
  id: String(product.id ?? product.rawId),
  productId: Number(product.rawId ?? product.productId ?? product.id),
  name: product.name || product.productName || product.displayName || '',
  displayName: product.displayName || product.productName || product.name || '',
  price: Number(product.price ?? product.sellingPrice ?? 0),
  image: getProductImage(product),
  sku: product.sku || product.SKU || '',
});

const formatPrice = (value) => {
  if (!value && value !== 0) return '';
  return `\u20B9${Number(value).toLocaleString('en-IN')}`;
};

const formatSpecLabel = (label) =>
  label
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const getMediaTranslationKey = (labelKey) => {
  if (!labelKey) return '';
  const key = labelKey.split('.').pop();
  return `media${key.charAt(0).toUpperCase()}${key.slice(1)}`;
};

const emptyReviewForm = {
  name: '',
  rating: 0,
  message: '',
};

const buildBreakdownFromReviews = (reviews = []) =>
  reviews.reduce(
    (breakdown, review) => {
      const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 0)));
      if (rating) breakdown[rating] += 1;
      return breakdown;
    },
    { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  );

const getAverageRatingFromReviews = (reviews = []) => {
  const total = reviews.length;
  if (!total) return 0;

  const weightedTotal = reviews.reduce(
    (sum, review) => sum + Math.min(5, Math.max(1, Math.round(Number(review.rating) || 0))),
    0
  );
  return weightedTotal / total;
};

const formatReviewDate = (date) => {
  if (!date) return '';

  const parsedDate = new Date(date);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return String(date).replace(',', '');
};

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [visibleMainImage, setVisibleMainImage] = useState(FALLBACK_IMAGE);
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState(() => new Set());
  const [videoError, setVideoError] = useState(false);
  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState('');
  const [featureList, setFeatureList] = useState([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [featureError, setFeatureError] = useState('');
  const [reviewList, setReviewList] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewLoadError, setReviewLoadError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [reviewErrors, setReviewErrors] = useState({});
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const { addToCart, cartItems, removeFromCart } = useCart();
  const { t, productText, productListText, productSpecLabel, productSpecValue, reviewText } = useLanguage();
  const { showToast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { mappedCategories } = useCategories();

  const category = useMemo(
    () => mappedCategories.find((item) => (
      String(item.id) === String(product?.categoryId) || item.name === product?.category
    )),
    [mappedCategories, product]
  );
  const mediaItems = product?.media?.length
    ? product.media.map((media) => (
        media.type === 'image'
          ? { ...media, url: normalizeDetailImageUrl(media.url || media.fallbackUrl) }
          : media
      ))
    : [{ type: 'image', labelKey: 'media.front', url: getProductImage(product) }];
  const selectedMedia = mediaItems[selectedMediaIndex] || mediaItems[0];
  const lightboxMediaItems = mediaItems;
  const lightboxMedia = lightboxMediaItems[lightboxImageIndex] || lightboxMediaItems[0];
  const selectedImageSource = selectedMedia?.type === 'image'
    ? normalizeDetailImageUrl(selectedMedia?.url || getProductImage(product))
    : FALLBACK_IMAGE;
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const specifications = Object.entries(product?.specifications || {});
  const features = featureList;
  const productDetails = Array.isArray(product?.productDetails) ? product.productDetails : [];
  const reviews = reviewList;
  const ratingBreakdown = useMemo(() => buildBreakdownFromReviews(reviews), [reviews]);
  const totalReviews = reviews.length;
  const averageRating = useMemo(() => getAverageRatingFromReviews(reviews), [reviews]);
  const mrp = product?.mrp || product?.oldPrice;
  const discount = product?.discount;
  const isInStock = product?.stockStatus !== 'out-of-stock' && Number(product?.stockQuantity ?? product?.stockCount ?? 0) > 0;
  const stockLabel = isInStock ? t('inStock') : t('outOfStock');

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      setIsLoadingProduct(true);
      setProductError('');

      try {
        const productData = await getProductById(id);
        if (isMounted) setProduct(productData);
      } catch (error) {
        console.error('Unable to load products.', error);
        if (isMounted) {
          setProduct(null);
          setProductError('Unable to load products.');
        }
      } finally {
        if (isMounted) setIsLoadingProduct(false);
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setSelectedMediaIndex(0);
    setQuantity(1);
    setVideoError(false);
    setReviewList([]);
    setFeatureList([]);
    setIsReviewsExpanded(false);
    setReviewsPage(1);
    setIsReviewModalOpen(false);
    setReviewForm(emptyReviewForm);
    setReviewErrors({});
    setIsImageLightboxOpen(false);
    setLightboxImageIndex(0);
  }, [id]);

  useEffect(() => {
    if (!isImageLightboxOpen) return undefined;

    const handleLightboxKeyDown = (event) => {
      if (event.key === 'Escape') setIsImageLightboxOpen(false);
      if (event.key === 'ArrowLeft') {
        setLightboxImageIndex((current) => (
          current === 0 ? lightboxMediaItems.length - 1 : current - 1
        ));
      }
      if (event.key === 'ArrowRight') {
        setLightboxImageIndex((current) => (
          current === lightboxMediaItems.length - 1 ? 0 : current + 1
        ));
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleLightboxKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleLightboxKeyDown);
    };
  }, [lightboxMediaItems.length, isImageLightboxOpen]);

  useEffect(() => {
    let isMounted = true;
    const productId = product?.rawId || product?.id;

    const loadDetails = async () => {
      if (!productId) return;

      setIsLoadingFeatures(true);
      setIsLoadingReviews(true);
      setFeatureError('');
      setReviewLoadError('');

      try {
        const [featuresData, reviewsData] = await Promise.all([
          getProductFeatures(productId),
          getProductReviews(productId),
        ]);

        if (isMounted) {
          setFeatureList(featuresData.map((feature) => feature.feature).filter(Boolean));
          setReviewList(reviewsData);
        }
      } catch (error) {
        console.error('Unable to load product details.', error);
        if (isMounted) {
          setFeatureError('Unable to load features.');
          setReviewLoadError('Unable to load reviews.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingFeatures(false);
          setIsLoadingReviews(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [product?.rawId, product?.id]);

  useEffect(() => {
    setVideoError(false);
  }, [selectedMediaIndex]);

  useEffect(() => {
    setVisibleMainImage(selectedImageSource);
    setIsMainImageLoaded(loadedDetailImages.has(selectedImageSource));
  }, [selectedImageSource]);

  if (isLoadingProduct) {
    return (
      <div className="flex min-h-screen flex-col bg-light">
        <Header onLoginClick={() => setIsLoginOpen(true)} />
        <main className="mx-auto flex w-full max-w-[900px] flex-grow flex-col items-center justify-center px-4 py-24 text-center">
          <p className="text-sm font-semibold text-gray-500">Loading...</p>
        </main>
        <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-light">
        <Header onLoginClick={() => setIsLoginOpen(true)} />
        <main className="mx-auto flex w-full max-w-[900px] flex-grow flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="mb-4 text-3xl font-black uppercase text-dark">{t('productDetails')}</h1>
          <p className="mb-8 text-gray-500">{productError || t('noProductsFound')}</p>
          <Link to="/products" className="btn-primary">
            {t('returnToShop')}
          </Link>
        </main>
        <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    );
  }

  const shortDescription =
    productText(product, 'shortDesc') ||
    productText(product, 'shortDescription') ||
    product.shortDescription ||
    product.shortDesc;
  const fullDescription =
    productText(product, 'longDesc') ||
    productText(product, 'description') ||
    product.description ||
    product.longDesc;
  const productName = productText(product, 'name');
  const categoryName = category?.name || product.category;
  const categoryDescription = category?.description || '';
  const maxRatingCount = Math.max(...Object.values(ratingBreakdown), 1);
  const reviewsPerPage = 20;
  const shouldPaginateReviews = reviews.length > reviewsPerPage;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
  const expandedReviews = shouldPaginateReviews
    ? reviews.slice((reviewsPage - 1) * reviewsPerPage, reviewsPage * reviewsPerPage)
    : reviews;
  const displayedReviews = isReviewsExpanded ? expandedReviews : reviews.slice(0, 3);
  const formattedAverageRating = averageRating ? averageRating.toFixed(1) : '0.0';
  const currentProductId = String(product.rawId ?? product.productId ?? product.id);
  const cartItemForProduct = cartItems.find((item) => (
    String(item.id) === currentProductId ||
    String(item.productId) === currentProductId
  ));
  const isProductInCart = Boolean(cartItemForProduct);

  const selectPreviousMedia = () => {
    setSelectedMediaIndex((current) => (current === 0 ? mediaItems.length - 1 : current - 1));
  };

  const selectNextMedia = () => {
    setSelectedMediaIndex((current) => (current === mediaItems.length - 1 ? 0 : current + 1));
  };

  const openImageLightbox = (media = selectedMedia) => {
    const currentImageIndex = lightboxMediaItems.findIndex(
      (lightboxItem) => lightboxItem.url === media?.url
    );
    setLightboxImageIndex(Math.max(0, currentImageIndex));
    setIsImageLightboxOpen(true);
  };

  const selectPreviousLightboxImage = () => {
    setLightboxImageIndex((current) => (
      current === 0 ? lightboxMediaItems.length - 1 : current - 1
    ));
  };

  const selectNextLightboxImage = () => {
    setLightboxImageIndex((current) => (
      current === lightboxMediaItems.length - 1 ? 0 : current + 1
    ));
  };

  const handleAddToCart = async () => {
    if (!isInStock) {
      showToast(t('productUnavailable'), 'error');
      return;
    }

    setIsAddingToCart(true);
    try {
      const wasAdded = await addToCart(mapProductForCart(product), quantity);
      if (wasAdded) showToast(`${productName} ${t('addedToCart')}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isInStock) {
      showToast(t('productUnavailable'), 'error');
      return;
    }

    const wasAdded = await addToCart(mapProductForCart(product), quantity);
    if (wasAdded) navigate('/checkout');
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((current) => current - 1);
      return;
    }

    const cartItem = cartItems.find((item) => item.id === product.id);
    if (cartItem) {
      removeFromCart(product.id);
      showToast(t('remove'));
    }
  };

  const handleWishlistClick = async () => {
    const result = await toggleWishlist(product);
    if (result === 'added') showToast(t('addedToWishlist'));
    else if (result === 'removed') showToast(t('removedFromWishlist'));
    else if (result !== 'login-required') showToast(t('unableWishlist'), 'error');
  };

  const handleShareClick = async () => {
    try {
      const result = await shareProduct({ product, productName });
      if (result === 'copied') showToast(t('productLinkCopied'));
    } catch (error) {
      console.error('Product share failed', error);
      showToast(t('unableShare'), 'error');
    }
  };

  const handleReviewInputChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((current) => ({ ...current, [name]: value }));
    setReviewErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleReviewRatingSelect = (rating) => {
    setReviewForm((current) => ({ ...current, rating }));
    setReviewErrors((current) => ({ ...current, rating: '' }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!reviewForm.name.trim()) errors.name = t('reviewNameRequired');
    if (!reviewForm.rating) errors.rating = t('reviewRatingRequired');
    if (!reviewForm.message.trim()) errors.message = t('reviewMessageRequired');

    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      return;
    }

    const submittedReview = {
      productId: Number(product.rawId || product.id),
      customerName: reviewForm.name.trim(),
      rating: Number(reviewForm.rating),
      reviewComment: reviewForm.message.trim(),
      verifiedPurchase: false,
      reviewDate: new Date().toISOString(),
    };

    try {
      await createProductReview(submittedReview);
      const refreshedReviews = await getProductReviews(product.rawId || product.id);
      setReviewList(refreshedReviews);
      setIsReviewsExpanded(true);
      setReviewsPage(1);
      setIsReviewModalOpen(false);
      setReviewForm(emptyReviewForm);
      setReviewErrors({});
      showToast(t('reviewSubmitted'));
    } catch (error) {
      console.error('Unable to submit review.', error);
      showToast('Unable to load reviews.', 'error');
    }
  };

  const renderSelectedMedia = () => {
    if (selectedMedia?.type === 'video') {
      const videoUrl = selectedMedia.url;
      const isYoutube = /youtube\.com|youtu\.be/.test(videoUrl || '') || selectedMedia.videoType === 'youtube';

      if (!videoUrl || videoError) {
        return (
          <div className="flex h-full min-h-[260px] items-center justify-center bg-dark px-6 text-center text-sm font-bold uppercase tracking-widest text-white/80">
            {t('noProductVideo')}
          </div>
        );
      }

      if (isYoutube) {
        return (
          <iframe
            title={selectedMedia.title || productName}
            src={videoUrl}
            className="product-detail-main-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setVideoError(true)}
          />
        );
      }

      return (
        <video
          className="product-detail-main-video bg-dark"
          controls
          poster={selectedMedia.poster || product.image}
          onError={() => setVideoError(true)}
        >
          <source src={videoUrl} type="video/mp4" />
          {t('noProductVideo')}
        </video>
      );
    }

    return (
      <img
        key={visibleMainImage}
        src={failedImageUrls.has(visibleMainImage) ? FALLBACK_IMAGE : visibleMainImage}
        alt={`${productName} ${selectedMedia?.labelKey || ''}`}
        className={`product-detail-main-image ${isMainImageLoaded ? 'product-detail-main-image-loaded' : ''}`}
        loading="eager"
        decoding="async"
        draggable="false"
        role="button"
        tabIndex={0}
        aria-label="Open larger product image"
        onClick={() => openImageLightbox()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openImageLightbox();
          }
        }}
        onLoad={() => {
          loadedDetailImages.add(visibleMainImage);
          setIsMainImageLoaded(true);
        }}
        onError={() => {
          console.error('Product detail image failed:', visibleMainImage);
          setFailedImageUrls((current) => new Set(current).add(visibleMainImage));

          if (visibleMainImage !== FALLBACK_IMAGE) {
            setVisibleMainImage(FALLBACK_IMAGE);
            setIsMainImageLoaded(loadedDetailImages.has(FALLBACK_IMAGE));
          }
        }}
      />
    );
  };

  return (
    <div className="product-detail-page flex min-h-screen flex-col bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <main className="mx-auto w-full max-w-[1440px] flex-grow px-3 py-5 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="product-detail-layout grid gap-5 lg:grid-cols-[44%_1fr]"
        >
          <section className="product-detail-media-column">
            <div className="product-detail-media-card relative rounded-md">
              {product.madeInIndia && (
                <span className="absolute left-4 top-4 z-20 bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                  {t('madeInIndia')}
                </span>
              )}

              <div className="absolute right-4 top-4 z-20 flex gap-2">
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className={`product-icon-button ${
                    isWishlisted ? 'text-primary' : 'text-dark hover:text-primary'
                  }`}
                  aria-label={t('addToWishlist')}
                >
                  <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="product-icon-button"
                  aria-label={t('shareProduct')}
                >
                  <Share2 size={18} />
                </button>
              </div>

              <div className="product-detail-main-media relative flex items-center justify-center bg-white p-8">
                {renderSelectedMedia()}
                <button type="button" onClick={selectPreviousMedia} className="product-media-nav left-4 rounded-full" aria-label={t('previousMedia')}>
                  <ChevronLeft size={20} />
                </button>
                <button type="button" onClick={selectNextMedia} className="product-media-nav right-4 rounded-full" aria-label={t('nextMedia')}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="product-detail-thumbnail-strip mt-3 grid grid-cols-5 gap-2">
              {mediaItems.map((media, index) => {
                const translationKey = getMediaTranslationKey(media.labelKey);
                const label = translationKey ? t(translationKey) : media.label || '';
                const isSelected = selectedMediaIndex === index;

                return (
                  <button
                    key={`${media.type}-${media.id || media.labelKey || index}`}
                    type="button"
                    onClick={() => {
                      setSelectedMediaIndex(index);
                      openImageLightbox(media);
                    }}
                    className={`product-detail-thumb rounded-md border bg-white p-2 text-center transition-all ${
                      isSelected ? 'selected-thumb border-primary shadow-md' : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <div className="product-detail-thumb-media mb-1 flex items-center justify-center overflow-hidden">
                      {media.type === 'video' ? (
                        <Zap size={20} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                      ) : (
                        <img
                          src={normalizeDetailImageUrl(media.url || media.fallbackUrl || getProductImage(product))}
                          alt={label}
                          className="product-detail-thumb-image"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      )}
                    </div>
                    <span className="block truncate text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="product-detail-info-column space-y-4">
            <div className="rounded-md border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400">
                <Link to="/" className="hover:text-primary">{t('home')}</Link>
                <span>/</span>
                <Link to={category ? `/category/${category.id}` : '/products'} className="hover:text-primary">{categoryName}</Link>
                <span>/</span>
                <span className="text-dark">{productName}</span>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
                <span>{t('brand')}: {product.brand}</span>
                <span className="text-gray-300">|</span>
                <span>{t('sku')}: {product.sku}</span>
              </div>

              <h1 className="mb-3 text-2xl font-black uppercase leading-tight text-dark md:text-3xl">
                {productName}
              </h1>

              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="product-rating-badge">
                  <Star size={14} fill="currentColor" className="rating-star-hover" />
                  <span>{formattedAverageRating}</span>
                </div>
                {product.codAvailable && (
                  <span className="product-cod-badge">
                    <ShieldCheck size={14} /> {t('codAvailable')}
                  </span>
                )}
                <span className={`product-detail-stock-badge ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                  {stockLabel}
                  {isInStock && Number(product.stockQuantity) > 0 ? ` • ${product.stockQuantity}` : ''}
                </span>
              </div>

              {!isInStock && (
                <div className="product-unavailable-message">
                  {t('productUnavailable')}
                </div>
              )}

              <div className="mb-5 flex flex-wrap items-end gap-3">
                <span className="product-price">{formatPrice(product.price)}</span>
                {mrp && <span className="product-mrp">{t('mrp')} {formatPrice(mrp)}</span>}
                {discount && <span className="product-discount">{discount}</span>}
              </div>

              <div className="grid gap-3 sm:grid-cols-[140px_1fr_1fr]">
                <div className={`product-quantity-box ${!isInStock ? 'disabled' : ''}`}>
                  <button type="button" onClick={handleDecreaseQuantity} aria-label={t('decreaseQuantity')}>
                    <Minus size={16} />
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label={t('increaseQuantity')} disabled={!isInStock}>
                    <Plus size={16} />
                  </button>
                </div>
                <button type="button" onClick={handleAddToCart} className="product-add-cart-btn" disabled={!isInStock || isAddingToCart}>
                  <ShoppingCart size={18} /> {isAddingToCart ? 'Adding...' : isProductInCart ? t('addedToCartStandalone') : t('addToCart')}
                </button>
                <button type="button" onClick={handleBuyNow} className="product-buy-now-btn" disabled={!isInStock}>
                  {t('buyItNow')}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="product-service-box">
                <div className="product-service-title">
                  <Truck size={16} /> {t('estimatedDelivery')}
                </div>
                <p className="text-sm leading-6 text-gray-600">{product.estimatedDelivery}</p>
              </div>
              <div className="product-service-box">
                <div className="product-service-title">
                  <ShieldCheck size={16} /> {t('deliveryReturn')}
                </div>
                <p className="text-sm leading-6 text-gray-600">{t('easyReturns')} • {t('countryOfOrigin')}: {product.countryOfOrigin}</p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-white p-5">
              <h2 className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary">{categoryName}</h2>
              <p className="text-sm leading-7 text-gray-600">{categoryDescription || shortDescription}</p>
            </div>

            <div className="product-detail-content-container">
            <div className="product-detail-content-section">
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-dark">{t('shortDescription')}</h2>
              <p className="text-sm leading-7 text-gray-600">{shortDescription}</p>
            </div>

            {specifications.length > 0 && (
              <div className="product-detail-content-section">
                <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-dark">{t('specifications')}</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {specifications.map(([key, value]) => (
                    <div key={key} className="border border-border bg-light px-3 py-2">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">{productSpecLabel(key) || formatSpecLabel(key)}</span>
                      <span className="text-sm font-bold text-dark">{productSpecValue(product, key, value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="product-detail-content-section">
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-dark">{t('keyFeatures')}</h2>
              {isLoadingFeatures ? (
                <p className="text-sm leading-6 text-gray-600">Loading...</p>
              ) : featureError ? (
                <p className="text-sm leading-6 text-gray-600">{featureError}</p>
              ) : features.length > 0 ? (
                <ul className="product-key-features-list grid gap-2 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <li key={feature} className="flex gap-2 text-sm leading-6 text-gray-600">
                      <ShieldCheck size={16} className="mt-1 shrink-0 text-primary" />
                      <span>{productListText(product, 'features', feature, index)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6 text-gray-600">No Features Available</p>
              )}
            </div>

            <div className="product-detail-content-section">
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-dark">{t('productDetails')}</h2>
              <p className="mb-4 text-sm leading-7 text-gray-600">{fullDescription}</p>
              {productDetails.length > 0 && (
                <ul className="space-y-2">
                  {productDetails.map((detail, index) => (
                    <li key={detail} className="text-sm leading-6 text-gray-600">• {productListText(product, 'productDetails', detail, index)}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="product-detail-content-section">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-dark">{t('reviewsRatings')}</h2>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="review-action-btn border border-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  {t('writeReview')}
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
                <div className="rounded-md bg-light p-5 text-center">
                  <div className="text-4xl font-black text-primary">{formattedAverageRating}</div>
                  <div className="my-2 flex justify-center gap-1">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={`rating-star-hover ${index < Math.round(averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {totalReviews} {t('totalReviews')}
                  </p>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingBreakdown[star] || 0;
                    const width = `${(count / maxRatingCount) * 100}%`;

                    return (
                      <div key={star} className="grid grid-cols-[44px_1fr_36px] items-center gap-3">
                        <span className="text-xs font-black text-dark">{star} ★</span>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-primary" style={{ width }} />
                        </div>
                        <span className="text-right text-xs font-bold text-gray-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isLoadingReviews ? (
                <p className="mt-6 text-sm leading-6 text-gray-600">Loading...</p>
              ) : reviewLoadError ? (
                <p className="mt-6 text-sm leading-6 text-gray-600">{reviewLoadError}</p>
              ) : reviews.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {displayedReviews.map((review, index) => (
                    <article key={`${review.userName}-${index}`} className="review-card border border-border">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <strong className="text-sm font-black text-dark">{reviewText(product, review, 'userName')}</strong>
                        <span className="flex items-center gap-1">
                          {[...Array(5)].map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              size={13}
                              className={`rating-star-hover ${starIndex < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                            />
                          ))}
                        </span>
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 bg-green-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-green-700">
                            <ShieldCheck size={12} /> {t('verifiedPurchase')}
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-400">{formatReviewDate(review.date)}</span>
                      </div>
                      <p className="text-sm leading-6 text-gray-600">{reviewText(product, review, 'comment')}</p>
                    </article>
                  ))}
                  <div className="review-list-actions">
                    {reviews.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsReviewsExpanded((expanded) => !expanded);
                          setReviewsPage(1);
                        }}
                        className="review-toggle-btn text-xs font-black uppercase tracking-widest text-primary hover:text-dark"
                      >
                        {isReviewsExpanded ? t('showLess') : t('viewAllReviews')}
                      </button>
                    )}

                    {isReviewsExpanded && shouldPaginateReviews && (
                      <div className="review-pagination" aria-label={t('reviewsPagination')}>
                        <button
                          type="button"
                          onClick={() => setReviewsPage((page) => Math.max(1, page - 1))}
                          disabled={reviewsPage === 1}
                          aria-label={t('previousReviewsPage')}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span>{reviewsPage} / {totalReviewPages}</span>
                        <button
                          type="button"
                          onClick={() => setReviewsPage((page) => Math.min(totalReviewPages, page + 1))}
                          disabled={reviewsPage === totalReviewPages}
                          aria-label={t('nextReviewsPage')}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-gray-600">No Reviews Available</p>
              )}
            </div>
            </div>

            <RelatedProducts currentProduct={product} />
          </section>
        </motion.div>
      </main>

      {isImageLightboxOpen && lightboxMedia && (
        <div
          className="product-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image gallery`}
          onClick={() => setIsImageLightboxOpen(false)}
        >
          <button
            type="button"
            className="product-image-lightbox-close"
            onClick={() => setIsImageLightboxOpen(false)}
            aria-label="Close image gallery"
          >
            <X size={24} />
          </button>

          <div className="product-image-lightbox-content" onClick={(event) => event.stopPropagation()}>
            {lightboxMedia.type === 'video' ? (
              /youtube\.com|youtu\.be/.test(lightboxMedia.url || '') || lightboxMedia.videoType === 'youtube' ? (
                <iframe
                  title={`${productName} video`}
                  src={lightboxMedia.url}
                  className="product-image-lightbox-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video className="product-image-lightbox-video" controls autoPlay>
                  <source src={lightboxMedia.url} type="video/mp4" />
                  {t('noProductVideo')}
                </video>
              )
            ) : (
              <img
                src={normalizeDetailImageUrl(lightboxMedia.url || lightboxMedia.fallbackUrl)}
                alt={`${productName} ${lightboxMedia.label || lightboxImageIndex + 1}`}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            )}

            {lightboxMediaItems.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-image-lightbox-nav previous"
                  onClick={selectPreviousLightboxImage}
                  aria-label="Previous product image"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  className="product-image-lightbox-nav next"
                  onClick={selectNextLightboxImage}
                  aria-label="Next product image"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <span className="product-image-lightbox-count">
              {lightboxImageIndex + 1} / {lightboxMediaItems.length}
            </span>
          </div>
        </div>
      )}

      {isReviewModalOpen && (
        <div className="review-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <form className="review-modal" onSubmit={handleReviewSubmit}>
            <div className="review-modal-header">
              <div>
                <span className="review-modal-kicker">{productName}</span>
                <h2 id="review-modal-title">{t('writeReview')}</h2>
              </div>
              <button
                type="button"
                className="review-modal-close"
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewErrors({});
                }}
                aria-label={t('closeReviewForm')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="review-modal-body">
              <label className="review-field">
                <span>{t('reviewName')}</span>
                <input
                  type="text"
                  name="name"
                  value={reviewForm.name}
                  onChange={handleReviewInputChange}
                  placeholder={t('reviewNamePlaceholder')}
                />
                {reviewErrors.name && <small>{reviewErrors.name}</small>}
              </label>

              <div className="review-field">
                <span>{t('reviewRating')}</span>
                <div className="review-star-picker" role="radiogroup" aria-label={t('reviewRating')}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleReviewRatingSelect(rating)}
                      className={rating <= reviewForm.rating ? 'selected' : ''}
                      aria-checked={rating === reviewForm.rating}
                      aria-label={`${rating} ${t('star')}`}
                      role="radio"
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
                {reviewErrors.rating && <small>{reviewErrors.rating}</small>}
              </div>

              <label className="review-field">
                <span>{t('reviewMessage')}</span>
                <textarea
                  name="message"
                  value={reviewForm.message}
                  onChange={handleReviewInputChange}
                  placeholder={t('reviewMessagePlaceholder')}
                  rows="4"
                />
                {reviewErrors.message && <small>{reviewErrors.message}</small>}
              </label>
            </div>

            <div className="review-modal-actions">
              <button type="button" onClick={() => setIsReviewModalOpen(false)} className="review-cancel-btn">
                {t('cancel')}
              </button>
              <button type="submit" className="review-submit-btn">
                {t('submitReview')}
              </button>
            </div>
          </form>
        </div>
      )}

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default ProductDetailsPage;
