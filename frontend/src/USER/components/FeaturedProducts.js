import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
        <div className="mb-4 text-center">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-1 block text-xs font-bold uppercase tracking-[4px] text-primary"
          >
            {subtitle}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-xl font-bold uppercase text-dark md:text-3xl"
          >
            {title}
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            className="mx-auto mt-2 h-1 rounded-full bg-primary"
          ></motion.div>
        </div>

        {isLoadingProducts ? (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            Loading...
          </div>
        ) : productError ? (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            {productError}
          </div>
        ) : productSlides.length > 0 ? (
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
            No Products Available
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="icon-shade icon-teal h-8 w-8 border border-border"
            aria-label={t('previousProducts')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="icon-shade icon-teal h-8 w-8 border border-border"
            aria-label={t('nextProducts')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
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
