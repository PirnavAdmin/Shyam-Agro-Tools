import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { getProducts } from '../../services/productService';
import 'swiper/css';
import 'swiper/css/navigation';

const getItemsPerSlide = () => {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 768) return 2;
  return 1;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const FeaturedProducts = ({ title = "FEATURED ITEMS", subtitle = "Special Products", limit = 8 }) => {
  const { t } = useLanguage();
  const swiperRef = useRef(null);
  const [itemsPerSlide, setItemsPerSlide] = useState(getItemsPerSlide);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState('');
  const featured = products.filter((product) => product.featured).length
    ? products.filter((product) => product.featured).slice(0, limit)
    : products.slice(0, limit);
  const productSlides = useMemo(() => chunkArray(featured, itemsPerSlide), [featured, itemsPerSlide]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setProductError('');

      try {
        const productData = await getProducts();
        if (isMounted) setProducts(productData);
      } catch (error) {
        console.error('Unable to load products.', error);
        if (isMounted) setProductError('Unable to load products.');
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerSlide(getItemsPerSlide());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    swiperRef.current?.slideTo(0, 0);
  }, [itemsPerSlide]);

  return (
    <section className="section-padding bg-white">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeading title={title} subtitle={subtitle} />

        {isLoadingProducts ? (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            {t('loading') || 'Loading...'}
          </div>
        ) : productError ? (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            {t(productError) || productError}
          </div>
        ) : (
          <div className="relative group">
            {productSlides.length > 0 ? (
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={16}
                slidesPerView={1}
                slidesPerGroup={1}
                speed={650}
                navigation={false}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: false,
                }}
                loop={productSlides.length > 1}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                className="product-carousel"
              >
                {productSlides.map((slideProducts, slideIndex) => (
                  <SwiperSlide key={`${title}-${itemsPerSlide}-${slideIndex}`}>
                    <div
                      className="product-slide-group"
                      style={{ gridTemplateColumns: `repeat(${itemsPerSlide}, minmax(0, 1fr))` }}
                    >
                      {slideProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
                {t('noProductsAvailable') || 'No Products Available'}
              </div>
            )}

            {/* Left Arrow Button at Extreme Left */}
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 text-dark shadow-xl flex items-center justify-center transition-all duration-250 hover:bg-[#58B82E] hover:border-[#58B82E] hover:text-white hover:scale-110 cursor-pointer active:scale-95"
              aria-label={t('previousProducts')}
            >
              <ChevronLeft size={24} className="stroke-[2.5]" />
            </button>

            {/* Right Arrow Button at Extreme Right */}
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-200 text-dark shadow-xl flex items-center justify-center transition-all duration-250 hover:bg-[#58B82E] hover:border-[#58B82E] hover:text-white hover:scale-110 cursor-pointer active:scale-95"
              aria-label={t('nextProducts')}
            >
              <ChevronRight size={24} className="stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .product-carousel .swiper-wrapper {
          align-items: stretch;
        }

        .product-carousel .swiper-slide {
          height: auto;
          display: flex;
        }

        .product-carousel .swiper-slide > * {
          width: 100%;
        }

        .product-slide-group {
          display: grid;
          gap: 16px;
          width: 100%;
          align-items: stretch;
        }

        .product-slide-group > * {
          width: 100%;
        }
      `}</style>
    </section>
  );
};

export default FeaturedProducts;
