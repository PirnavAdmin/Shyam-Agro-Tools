import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useCategories } from '../context/CategoryContext';
import { buildSearchResults } from '../utils/searchIndex';
import { getProducts, searchProducts } from '../../services/productService';

const uniqueProducts = (products) =>
  Array.from(
    new Map(products.filter(Boolean).map((product, index) => [product.id || `product-${index}`, product])).values()
  );

const useSearchQuery = () => {
  const { search } = useLocation();
  return new URLSearchParams(search).get('q') || '';
};

const SearchPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();
  const query = useSearchQuery();
  const { t, productText } = useLanguage();
  const { mappedCategories, activeSubcategories } = useCategories();
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [productSearchError, setProductSearchError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      if (!query.trim()) {
        setSearchedProducts([]);
        setProductSearchError('');
        return;
      }

      setIsSearchingProducts(true);
      setProductSearchError('');

      try {
        const [keywordProducts, allProducts] = await Promise.all([
          searchProducts(query).catch(() => []),
          getProducts().catch(() => []),
        ]);
        if (isMounted) setSearchedProducts(uniqueProducts([...keywordProducts, ...allProducts]));
      } catch (error) {
        console.error('Unable to search products.', error);
        if (isMounted) {
          setSearchedProducts([]);
          setProductSearchError('Unable to load products.');
        }
      } finally {
        if (isMounted) setIsSearchingProducts(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const results = useMemo(
    () => buildSearchResults({
      query,
      productText,
      products: searchedProducts,
      categories: mappedCategories,
      subcategories: activeSubcategories,
    }),
    [activeSubcategories, mappedCategories, productText, query, searchedProducts]
  );

  return (
    <div className="flex min-h-screen flex-col bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      <section className="bg-dark px-3 py-5 md:py-7">
        <div className="mx-auto max-w-[1440px] text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[3px] text-primary"
          >
            {t('searchEverything')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold uppercase tracking-tight text-white md:text-3xl"
          >
            {t('searchResults')}
          </motion.h1>
          {query && (
            <p className="mx-auto mt-2 max-w-2xl text-xs font-medium text-white/70">
              {results.total} {t('allResults')} "{query}"
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1600px] flex-grow px-3 py-3 md:px-4 lg:px-5">
        {!query ? (
          <div className="border border-border bg-white px-6 py-10 text-center">
            <span className="icon-shade icon-teal mx-auto mb-3 h-12 w-12">
              <Search size={22} />
            </span>
            <h2 className="mb-2 text-xl font-semibold text-dark">{t('startSearching')}</h2>
            <p className="mx-auto max-w-xl text-sm leading-7 text-gray-500">
              {t('searchProducts')}
            </p>
          </div>
        ) : isSearchingProducts ? (
          <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
            Loading...
          </div>
        ) : productSearchError ? (
          <div className="border border-border bg-white px-6 py-10 text-center">
            <h2 className="mb-2 text-xl font-semibold text-dark">{productSearchError}</h2>
          </div>
        ) : results.total === 0 ? (
          <div className="border border-border bg-white px-6 py-10 text-center">
            <h2 className="mb-2 text-xl font-semibold text-dark">{t('noSearchResults')}</h2>
            <p className="mb-5 text-sm text-gray-500">"{query}"</p>
            <button type="button" onClick={() => navigate('/products')} className="btn-primary">
              {t('returnToShop')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.categories.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between border border-border bg-white px-3 py-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-dark">
                    {t('matchingCategories')}
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {results.categories.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {results.categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => navigate(`/category/${category.id}`)}
                      className="border border-border bg-white p-4 text-left"
                    >
                      <strong className="block text-sm uppercase text-dark">{category.name}</strong>
                      <span className="mt-2 block text-xs text-gray-500">{category.description}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.pages.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between border border-border bg-white px-3 py-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-dark">
                    Pages
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {results.pages.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {results.pages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => navigate(page.path)}
                      className="border border-border bg-white p-4 text-left"
                    >
                      <strong className="block text-sm uppercase text-dark">{page.title}</strong>
                      <span className="mt-2 block text-xs text-gray-500">{page.path}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.subcategories.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between border border-border bg-white px-3 py-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-dark">
                    {t('matchingSubcategories')}
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {results.subcategories.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {results.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => navigate(`/category/${subcategory.categoryId}`)}
                      className="border border-border bg-white p-4 text-left"
                    >
                      <strong className="block text-sm uppercase text-dark">{subcategory.name}</strong>
                      <span className="mt-2 block text-xs text-gray-500">{subcategory.description}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.products.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between border border-border bg-white px-3 py-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-dark">{t('matchingProducts')}</h2>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {results.products.length} {t('items')}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                  {results.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default SearchPage;
