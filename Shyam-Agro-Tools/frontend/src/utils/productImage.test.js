import {
  getProductImage,
  PRODUCT_ASSET_BASE_URL,
  PRODUCT_IMAGE_FALLBACK,
} from './productImage';

describe('getProductImage', () => {
  it('resolves the Product API images array shape', () => {
    expect(getProductImage({
      images: [{ imageUrl: '/uploads/images/product.png' }],
    })).toBe(`${PRODUCT_ASSET_BASE_URL}/uploads/images/product.png`);
  });

  it('preserves absolute image URLs', () => {
    const imageUrl = 'https://cdn.example.com/product.png';
    expect(getProductImage({ imageUrl })).toBe(imageUrl);
  });

  it('returns the shared fallback when an image is missing', () => {
    expect(getProductImage({})).toBe(PRODUCT_IMAGE_FALLBACK);
  });
});
