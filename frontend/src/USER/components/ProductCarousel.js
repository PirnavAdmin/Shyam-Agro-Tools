import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductCarousel = ({ products = [], emptyMessage = '' }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Allow a 4px tolerance
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    // Re-check after rendering finishes
    const t1 = setTimeout(checkScroll, 150);
    const t2 = setTimeout(checkScroll, 600);
    const t3 = setTimeout(checkScroll, 1500);

    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [products, checkScroll]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by roughly 2 cards width
    const scrollAmount = Math.max(260, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!products || products.length === 0) {
    if (emptyMessage) {
      return (
        <div className="py-6 text-center text-xs text-gray-400">
          {emptyMessage}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative group/carousel w-full">
      {/* Left Scroll Button (<) */}
      <button
        type="button"
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        aria-label="Previous products"
        className={`absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 transition-all duration-200 active:scale-90 ${
          canScrollLeft
            ? 'opacity-100 hover:bg-gray-50 hover:text-black hover:shadow-lg cursor-pointer'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft size={20} className="stroke-[2.2]" />
      </button>

      {/* Horizontal Product Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto scroll-smooth py-2 px-1 select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[220px] sm:w-[240px] md:w-[250px] lg:w-[260px] shrink-0 flex flex-col"
          >
            <ProductCard
              product={product}
              layout="grid"
              animateOnView={false}
              className="h-full rounded-xl"
            />
          </div>
        ))}
      </div>

      {/* Right Scroll Button (>) */}
      <button
        type="button"
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        aria-label="Next products"
        className={`absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 transition-all duration-200 active:scale-90 ${
          canScrollRight
            ? 'opacity-100 hover:bg-gray-50 hover:text-black hover:shadow-lg cursor-pointer'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight size={20} className="stroke-[2.2]" />
      </button>
    </div>
  );
};

export default ProductCarousel;
