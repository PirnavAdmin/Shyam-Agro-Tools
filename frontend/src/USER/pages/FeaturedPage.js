import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { getProducts } from '../../services/productService';

const FeaturedPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState('');
  const { t } = useLanguage();
  const featuredProducts = products.filter((product) => product.featured).length
    ? products.filter((product) => product.featured)
    : products;

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

  return (
    <div className="flex min-h-screen flex-col bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <section className="bg-dark px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1440px] text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 block text-xs font-bold uppercase tracking-[4px] text-primary"
          >
            {t('ourCollections')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold uppercase tracking-tight text-white md:text-4xl"
          >
            {t('featured')}
          </motion.h1>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] flex-grow px-3 py-5 md:px-5 lg:px-8">
        <div className="mb-4 border border-border bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {featuredProducts.length} {t('items')}
          </p>
        </div>

        {isLoadingProducts ? (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            Loading...
          </div>
        ) : productError ? (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            {productError}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            No Products Available
          </div>
        )}
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default FeaturedPage;
