import { normalizeAssetUrl } from './assetUrl';

export const PRODUCT_ASSET_BASE_URL = (
  process.env.REACT_APP_PRODUCT_ASSET_BASE_URL ||
  process.env.REACT_APP_PRODUCT_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://shyamagrotools.com'
).replace(/\/$/, '');
export const PRODUCT_IMAGE_FALLBACK = '/hero_banner.png';

const getPath = (value) => {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  return getPath(value.imageUrl || value.imageURL || value.url || value.path);
};

export const getProductImage = (product) => {
  if (!product) return PRODUCT_IMAGE_FALLBACK;

  const mediaImage = Array.isArray(product.media)
    ? product.media.find((item) => item?.type === 'image' && getPath(item))
    : null;
  const firstImage = Array.isArray(product.images) ? product.images[0] : product.images?.front;
  const firstGalleryImage = Array.isArray(product.gallery) ? product.gallery[0] : null;
  const firstProductImage = Array.isArray(product.productImages) ? product.productImages[0] : null;
  const path = getPath(
    product.imageUrl ||
    product.imageURL ||
    product.image ||
    product.productImage ||
    product.productImageUrl ||
    product.thumbnail ||
    product.thumbnailUrl ||
    product.coverImage ||
    product.featuredImage ||
    product.photo ||
    product.picture ||
    mediaImage ||
    firstImage ||
    firstGalleryImage ||
    firstProductImage
  );

  if (!path) return PRODUCT_IMAGE_FALLBACK;
  return normalizeAssetUrl(path, PRODUCT_ASSET_BASE_URL, PRODUCT_IMAGE_FALLBACK);
};

export const handleProductImageError = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PRODUCT_IMAGE_FALLBACK;
};
