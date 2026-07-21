import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Eye, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { getProductImage, handleProductImageError } from '../../utils/productImage';

const CategoryFeaturedProducts = ({ products = [] }) => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const featuredList = Array.isArray(products) ? products.slice(0, 4) : [];

  if (featuredList.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-xs font-semibold text-gray-400">
        No featured products currently listed for this category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {featuredList.map((product) => {
        const inCart = isInCart(product.id);
        const inWish = isInWishlist(product.id);

        const price = Number(product.price || product.sellingPrice || 1200);
        const originalPrice = Number(product.originalPrice || product.mrp || price * 1.25);
        const discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);

        return (
          <div
            key={product.id}
            className="group relative flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all duration-250 hover:border-[#58B82E] hover:shadow-md"
          >
            {/* Discount Badge */}
            {discountPercentage > 0 && (
              <span className="absolute top-2 left-2 z-10 rounded-full bg-[#58B82E] px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                -{discountPercentage}%
              </span>
            )}

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
                showToast(inWish ? 'Removed from Wishlist' : 'Added to Wishlist');
              }}
              className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                inWish
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-gray-100 bg-white/90 text-gray-400 hover:text-red-500 hover:border-red-200'
              }`}
              aria-label="Wishlist"
            >
              <Heart size={13} className={inWish ? 'fill-current' : ''} />
            </button>

            {/* Product Image */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/product/${product.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(`/product/${product.id}`);
              }}
              className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50 cursor-pointer"
            >
              <img
                src={getProductImage(product.imageUrl || product.image)}
                alt={product.name || 'Product'}
                loading="lazy"
                onError={handleProductImageError}
                className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-dark shadow-md">
                  <Eye size={12} /> View
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="mt-2 flex-1 flex flex-col justify-between">
              <div>
                <h6
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="line-clamp-1 text-xs font-bold text-dark hover:text-[#58B82E] transition-colors cursor-pointer"
                >
                  {product.name}
                </h6>

                {/* Rating */}
                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                  <Star size={11} className="fill-current" />
                  <span>{product.rating || '4.8'}</span>
                  <span className="text-gray-400">({product.reviewsCount || 18})</span>
                </div>
              </div>

              {/* Price & Add to Cart */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-dark">₹{price.toLocaleString('en-IN')}</span>
                  {originalPrice > price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (inCart) {
                      navigate('/cart');
                    } else {
                      addToCart(product, 1);
                      showToast(`${product.name} added to cart!`);
                    }
                  }}
                  className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold uppercase transition-all duration-200 ${
                    inCart
                      ? 'bg-dark text-white hover:bg-black'
                      : 'bg-[#58B82E] text-white hover:bg-[#489c25] shadow-sm hover:shadow-md'
                  }`}
                >
                  {inCart ? (
                    <>
                      <Check size={12} /> Go to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={12} /> Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryFeaturedProducts;
