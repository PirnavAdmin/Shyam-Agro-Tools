import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { getProducts } from '../../services/productService';

const ITEMS_PER_PAGE = 20;

const FeaturedPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useLanguage();

  const featuredProducts = useMemo(() => {
    return products.filter((product) => product.featured).length
      ? products.filter((product) => product.featured)
      : products;
  }, [products]);

  const totalPages = Math.max(1, Math.ceil(featuredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    return featuredProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [currentPage, featuredProducts]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setProductError('');

      try {
        const productData = await getProducts();
        if (isMounted) {
          setProducts(productData || []);
          setProductError('');
        }
      } catch (error) {
        console.error('Unable to load products. Retrying...', error);
        try {
          const retryData = await getProducts({ forceRefresh: true });
          if (isMounted) {
            setProducts(retryData || []);
            setProductError('');
          }
        } catch (retryErr) {
          console.error('Retry failed as well.', retryErr);
          if (isMounted) setProductError('Unable to load products.');
        }
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const changePage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-dark shadow-2xs hover:border-primary hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{t('back') || 'Back'}</span>
          </button>
        </div>

        <div className="mb-4 border border-border bg-white p-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {t('showing')} {paginatedProducts.length} of {featuredProducts.length} {t('items')} (20 per page)
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
        ) : paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => changePage(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  {t('first') || 'First'}
                </button>
                <button
                  type="button"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  {t('previous') || 'Previous'}
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => changePage(page)}
                    className={`pagination-btn min-w-10 ${
                      currentPage === page ? 'pagination-btn-active' : ''
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  {t('next') || 'Next'}
                </button>
                <button
                  type="button"
                  onClick={() => changePage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  {t('last') || 'Last'}
                </button>
              </div>
            )}
          </>
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
