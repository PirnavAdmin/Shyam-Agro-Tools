import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../../services/productService';
import { useLanguage } from '../context/LanguageContext';
import { scrollToElementForOneSecond } from '../utils/smoothScroll';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import './ProductsPage.css';

const ITEMS_PER_PAGE = 12;

const productMatchesPowerTillers = (product = {}) => {
  const searchableValues = [
    product.name,
    product.displayName,
    product.category,
    product.subcategory,
    product.subCategory,
    product.shortDesc,
    product.shortDescription,
    product.description,
    product.longDesc,
    product.sku,
    product.brand,
    ...(Array.isArray(product.productDetails) ? product.productDetails : []),
    ...(Array.isArray(product.features) ? product.features : []),
  ];

  const searchableText = searchableValues
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /\bpower\s*-?\s*tillers?\b/.test(searchableText) || /\btillers?\b/.test(searchableText);
};

const Pagination = ({ currentPage, totalPages, onPageChange, t }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => onPageChange(1)} disabled={isFirstPage} className="pagination-btn">
        {t('first')}
      </button>
      <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={isFirstPage} className="pagination-btn">
        {t('previous')}
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`pagination-btn min-w-10 ${currentPage === page ? 'pagination-btn-active' : ''}`}
        >
          {page}
        </button>
      ))}
      <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={isLastPage} className="pagination-btn">
        {t('next')}
      </button>
      <button type="button" onClick={() => onPageChange(totalPages)} disabled={isLastPage} className="pagination-btn">
        {t('last')}
      </button>
    </div>
  );
};

const ProductsPage = ({ mode = 'all' }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingStockFilter, setPendingStockFilter] = useState('all');
  const [appliedStockFilter, setAppliedStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState('');
  const productListRef = useRef(null);
  const { search } = useLocation();
  const { t } = useLanguage();
  const queryMode = new URLSearchParams(search).get('filter');
  const activeMode = mode === 'all' && queryMode === 'featured' ? 'featured' : mode;

  useEffect(() => {
    document.documentElement.classList.add('products-page-hide-scrollbar');
    document.body.classList.add('products-page-hide-scrollbar');

    return () => {
      document.documentElement.classList.remove('products-page-hide-scrollbar');
      document.body.classList.remove('products-page-hide-scrollbar');
    };
  }, []);

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
        if (isMounted) {
          setProducts([]);
          setProductError('Unable to load products.');
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

  const baseProducts = useMemo(() => {
    if (activeMode === 'offers') {
      return products.filter((product) => (
        product.hasOffer ||
        Boolean(product.discount) ||
        Boolean(product.offerPrice) ||
        Number(product.discountPercent || 0) > 0
      ));
    }
    if (activeMode === 'forty-percent') {
      const fortyPercentProducts = products.filter(
        (product) => Number(product.discountPercent || 0) >= 40
      );
      return fortyPercentProducts;
    }
    if (activeMode === 'power-tillers' || activeMode === 'new-arrivals') {
      return products.filter(productMatchesPowerTillers);
    }
    if (activeMode === 'featured') return products.filter((product) => product.featured);
    return products;
  }, [activeMode, products]);

  const stockCounts = useMemo(
    () => ({
      'in-stock': baseProducts.filter((product) => product.stockStatus === 'in-stock').length,
      'out-of-stock': baseProducts.filter((product) => product.stockStatus === 'out-of-stock').length,
    }),
    [baseProducts]
  );

  const filteredProducts = useMemo(() => {
    if (appliedStockFilter === 'all') return baseProducts;
    return baseProducts.filter((product) => product.stockStatus === appliedStockFilter);
  }, [appliedStockFilter, baseProducts]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
    setPendingStockFilter('all');
    setAppliedStockFilter('all');
  }, [activeMode]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const changePage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.setTimeout(() => {
      scrollToElementForOneSecond(productListRef.current);
    }, 0);
  };

  const applyStockFilter = () => {
    setAppliedStockFilter(pendingStockFilter);
    setCurrentPage(1);
  };

  const resetStockFilter = () => {
    setPendingStockFilter('all');
    setAppliedStockFilter('all');
    setCurrentPage(1);
  };

  const title = activeMode === 'offers'
    ? 'All Active Offers'
    : activeMode === 'forty-percent'
      ? '40% and Above Discount Products'
      : activeMode === 'power-tillers' || activeMode === 'new-arrivals'
        ? 'Power Tillers'
        : activeMode === 'featured'
          ? t('featured')
          : t('allCategories');
  const emptyMessage = activeMode === 'forty-percent'
    ? 'No products with 40% or higher discount available.'
    : activeMode === 'power-tillers' || activeMode === 'new-arrivals'
      ? 'No power tiller products available.'
      : t('noProductsFound');
  const productGridClassName = activeMode === 'forty-percent'
    ? 'products-page-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
    : 'products-page-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5';

  return (
    <div className="products-page-shell flex min-h-screen flex-col bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <section className="bg-dark px-3 py-5 md:py-7">
        <div className="mx-auto max-w-[1440px] text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[3px] text-primary"
          >
            {t('ourCollections')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold uppercase tracking-tight text-white md:text-3xl"
          >
            {title}
          </motion.h1>
        </div>
      </section>

      <main className="products-page-main mx-auto w-full max-w-[1600px] flex-grow px-3 pt-3 md:px-4 lg:px-5">
        <div className="products-page-layout grid gap-3 lg:grid-cols-[230px_1fr]">
          <aside className="products-page-sidebar">
            <div className="products-page-filter-panel border border-border bg-white p-3">
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-2.5">
                <span className="icon-shade icon-teal icon-shade-sm"><Filter size={18} /></span>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-dark">{t('stockAvailability')}</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  { id: 'in-stock', label: t('inStock'), count: stockCounts['in-stock'] },
                  { id: 'out-of-stock', label: t('outOfStock'), count: stockCounts['out-of-stock'] },
                ].map((filter) => (
                  <label key={filter.id} className="flex cursor-pointer items-center justify-between gap-2 text-xs font-medium text-gray-600">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="productStock"
                        checked={pendingStockFilter === filter.id}
                        onChange={() => setPendingStockFilter(filter.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      {filter.label}
                    </span>
                    <span className="bg-light px-2 py-0.5 text-[10px] font-semibold text-gray-400">{filter.count}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={resetStockFilter} className="rounded-md border border-primary bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10">
                  {t('reset')}
                </button>
                <button type="button" onClick={applyStockFilter} className="rounded-full border border-primary bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#5eaa28] hover:border-[#5eaa28]">
                  {t('apply')}
                </button>
              </div>
            </div>
          </aside>

          <div ref={productListRef} className="products-page-results flex flex-col">
            <div className="mb-3 border border-border bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {filteredProducts.length} {t('items')}
              </p>
            </div>

            {isLoadingProducts ? (
              <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
                Loading...
              </div>
            ) : productError ? (
              <div className="border border-border bg-white px-6 py-10 text-center">
                <h3 className="mb-3 text-xl font-black text-dark">{productError}</h3>
                <button type="button" onClick={() => window.location.reload()} className="btn-primary">
                  {t('reset')}
                </button>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className={productGridClassName}>
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} animateOnView={false} />
                  ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={changePage} t={t} />
              </>
            ) : (
              <div className="border border-border bg-white px-6 py-10 text-center">
                <h3 className="mb-3 text-xl font-black text-dark">{emptyMessage || 'No Products Available'}</h3>
                <button type="button" onClick={resetStockFilter} className="btn-primary">
                  {t('reset')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default ProductsPage;
