import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useCategories } from '../context/CategoryContext';
import ProductCard from '../components/ProductCard';
import CategoryBanner from '../components/CategoryBanner';
import { useLanguage } from '../context/LanguageContext';
import { scrollToElementForOneSecond } from '../utils/smoothScroll';
import { getProductsByCategory, getProductsBySubcategory } from '../../services/productService';
import { Filter, ChevronDown, Grid, List } from 'lucide-react';
import './SingleCategoryPage.css';

const ITEMS_PER_PAGE = 12;

const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const productMatchesSubcategory = (product, subcategory) => {
  if (!subcategory) return true;

  const productSubcategoryValues = [
    product.subcategoryId,
    product.subCategoryId,
    product.subcategory,
    product.subCategory,
  ].map(normalizeValue);

  return [
    subcategory.id,
    subcategory.slug,
    subcategory.name,
  ].map(normalizeValue).some((value) => value && productSubcategoryValues.includes(value));
};

const SingleCategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [pendingStockFilter, setPendingStockFilter] = useState('all');
  const [appliedStockFilter, setAppliedStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState('');
  const productListRef = useRef(null);
  const { t, categoryText, subcategoryText } = useLanguage();
  const {
    mappedCategories,
    categoriesLoading: loadingCategories,
    subcategoriesLoading: loadingSubcategories,
    categoriesError: categoryError,
    subcategoriesError: subcategoryError,
  } = useCategories();
  const currentCategory = mappedCategories.find(
    (category) => String(category.id) === id || category.slug === id
  );
  const title = categoryText(currentCategory) || id.replace(/-/g, ' ');
  const categoryDescription = categoryText(currentCategory, 'description') || '';
  const subcategoriesForCategory = currentCategory?.subcategories || [];
  const selectedSubcategoryData = subcategoriesForCategory.find(
    (subcategory) => String(subcategory.id) === selectedSubcategory
  );

  useEffect(() => {
    setSelectedSubcategory('all');
    setPriceFilter('all');
    setPendingStockFilter('all');
    setAppliedStockFilter('all');
    setCurrentPage(1);
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      if (!currentCategory?.id) {
        setCategoryProducts([]);
        setProductError('');
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      setProductError('');

      try {
        const productData = selectedSubcategory === 'all'
          ? await getProductsByCategory(currentCategory.id)
          : await getProductsBySubcategory(selectedSubcategory);

        if (isMounted) setCategoryProducts(productData);
      } catch (error) {
        console.error('Unable to load products.', error);
        if (isMounted) {
          setCategoryProducts([]);
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
  }, [currentCategory?.id, selectedSubcategory]);

  const stockCounts = useMemo(
    () => ({
      'in-stock': categoryProducts.filter((product) => product.stockStatus === 'in-stock').length,
      'out-of-stock': categoryProducts.filter((product) => product.stockStatus === 'out-of-stock').length,
    }),
    [categoryProducts]
  );

  const filteredProducts = categoryProducts.filter(p => {
    const subcategoryMatch = selectedSubcategory === 'all' || productMatchesSubcategory(p, selectedSubcategoryData);
    const stockMatch = appliedStockFilter === 'all' || p.stockStatus === appliedStockFilter;
    let priceMatch = true;
    if (priceFilter === 'under1000') priceMatch = p.price < 1000;
    else if (priceFilter === '1000-5000') priceMatch = p.price >= 1000 && p.price <= 5000;
    else if (priceFilter === 'over5000') priceMatch = p.price > 5000;
    return subcategoryMatch && priceMatch && stockMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubcategory, priceFilter, appliedStockFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const resetFilters = () => {
    setSelectedSubcategory('all');
    setPriceFilter('all');
    setPendingStockFilter('all');
    setAppliedStockFilter('all');
    setCurrentPage(1);
  };

  const applyStockFilter = () => {
    setAppliedStockFilter(pendingStockFilter);
    setCurrentPage(1);
  };

  const changePage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.setTimeout(() => {
      scrollToElementForOneSecond(productListRef.current);
    }, 0);
  };

  const handleSortMenuNavigate = (path) => {
    setIsSortMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      {loadingCategories ? (
        <div className="py-12 text-center text-sm font-semibold text-gray-500">Loading...</div>
      ) : categoryError || !currentCategory ? (
        <div className="py-12 text-center text-sm font-semibold text-gray-500">
          {categoryError || 'No Categories Available'}
          {categoryError && (
            <>
              <br />
              Please try again.
            </>
          )}
        </div>
      ) : (
        <CategoryBanner
          category={currentCategory}
          title={title}
          description={categoryDescription}
          t={t}
        />
      )}

      {!loadingCategories && !categoryError && currentCategory && (
      <main className="mx-auto w-full max-w-[1600px] px-3 pb-24 pt-3 md:px-4 lg:px-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          
          {/* Sidebar Filters */}
          <aside className="category-filter-sidebar w-full shrink-0 lg:w-[240px]">
            <div className="category-filter-panel border border-border bg-white p-3">
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-2.5">
                <span className="icon-shade icon-teal icon-shade-sm"><Filter size={18} /></span>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-dark">{t('filterProducts')}</h3>
              </div>

              {/* Shop By Sub-Category */}
              <div className="mb-6">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('subCategories')}</h4>
                {loadingSubcategories ? (
                  <div className="text-sm text-gray-400">Loading...</div>
                ) : subcategoryError ? (
                  <div className="text-sm leading-5 text-gray-400">
                    Unable to load Subcategories.
                    <br />
                    Please try again.
                  </div>
                ) : subcategoriesForCategory.length === 0 ? (
                  <div className="text-sm text-gray-400">No Subcategories Available</div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div
                      onClick={() => setSelectedSubcategory('all')}
                      className={`flex items-center justify-between text-sm font-normal transition-colors cursor-pointer group ${
                        selectedSubcategory === 'all' ? 'text-primary' : 'text-gray-600 hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="icon-shade icon-grey icon-shade-sm"><i className="fas fa-border-all text-xs"></i></span>
                        {t('allProducts')}
                      </div>
                      <span className="text-[10px] bg-light px-2 py-0.5 rounded text-gray-400">{categoryProducts.length}</span>
                    </div>
                    {subcategoriesForCategory.map((sub) => {
                      const subcategoryProductCount = categoryProducts.filter(
                        (product) => productMatchesSubcategory(product, sub)
                      ).length;

                      return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => setSelectedSubcategory(String(sub.id))}
                        className={`subcategory-sidebar-item group ${
                          selectedSubcategory === String(sub.id) ? 'subcategory-sidebar-item-active' : ''
                        }`}
                      >
                        <span className="subcategory-sidebar-media">
                          <span className="subcategory-sidebar-copy">
                            <span className="subcategory-sidebar-name">{subcategoryText(sub)}</span>
                            {sub.description && (
                              <span className="subcategory-sidebar-description">
                                {sub.description}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="subcategory-sidebar-count">
                          {subcategoryProductCount}
                        </span>
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('filterByPrice')}</h4>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'all', label: t('allPrices') },
                    { id: 'under1000', label: t('under1000') },
                    { id: '1000-5000', label: t('price1000To5000') },
                    { id: 'over5000', label: t('over5000') }
                  ].map((filter) => (
                    <label key={filter.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="price" 
                        className="accent-primary w-4 h-4"
                        checked={priceFilter === filter.id}
                        onChange={() => setPriceFilter(filter.id)}
                      />
                      <span className={`text-sm font-normal transition-colors ${priceFilter === filter.id ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}`}>
                        {filter.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">{t('stockAvailability')}</h4>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'in-stock', label: t('inStock'), count: stockCounts['in-stock'] },
                    { id: 'out-of-stock', label: t('outOfStock'), count: stockCounts['out-of-stock'] },
                  ].map((filter) => (
                    <label key={filter.id} className="flex items-center justify-between gap-3 cursor-pointer group">
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="categoryStock"
                          className="accent-primary w-4 h-4"
                          checked={pendingStockFilter === filter.id}
                          onChange={() => setPendingStockFilter(filter.id)}
                        />
                        <span className={`text-sm font-normal transition-colors ${pendingStockFilter === filter.id ? 'text-primary' : 'text-gray-600 group-hover:text-primary'}`}>
                          {filter.label}
                        </span>
                      </span>
                      <span className="text-[10px] bg-light px-2 py-0.5 rounded text-gray-400">{filter.count}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button type="button" onClick={resetFilters} className="rounded-md border border-primary bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10">
                    {t('reset')}
                  </button>
                  <button type="button" onClick={applyStockFilter} className="rounded-full border border-primary bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#5eaa28] hover:border-[#5eaa28]">
                    {t('apply')}
                  </button>
                </div>
              </div>

              <button onClick={resetFilters} className="w-full rounded-full bg-primary py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#5eaa28]">{t('reset')}</button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex flex-grow flex-col" ref={productListRef}>
            <div className="mb-3 flex items-center justify-between border border-border bg-white px-3 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {t('showing')} {filteredProducts.length} {t('items').toLowerCase()}
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 border-r border-border pr-6 hidden md:flex">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label={t('gridView')}
                    className={viewMode === 'grid' ? 'text-primary' : 'text-gray-300 hover:text-primary'}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label={t('listView')}
                    className={viewMode === 'list' ? 'text-primary' : 'text-gray-300 hover:text-primary'}
                  >
                    <List size={18} />
                  </button>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortMenuOpen((open) => !open)}
                    className="flex items-center gap-2 cursor-pointer group"
                    aria-haspopup="menu"
                    aria-expanded={isSortMenuOpen}
                  >
                    <span className="text-xs font-semibold uppercase tracking-widest">{t('sortBy')}: {t('featured')}</span>
                    <span className="icon-shade icon-grey icon-shade-sm"><ChevronDown size={14} /></span>
                  </button>

                  {isSortMenuOpen && (
                    <div className="absolute right-0 top-full z-40 mt-3 w-64 border border-border bg-white shadow-2xl">
                      <button
                        type="button"
                        onClick={() => handleSortMenuNavigate('/featured')}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-dark transition-colors hover:bg-light hover:text-primary"
                      >
                        {t('featured')}
                      </button>
                      <div className="border-t border-border py-2">
                        {mappedCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleSortMenuNavigate(`/category/${category.id}`)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-light hover:text-primary ${
                              currentCategory?.id === category.id ? 'text-primary' : 'text-gray-500'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
                Loading...
              </div>
            ) : productError ? (
              <div className="border border-border bg-white px-6 py-10 text-center">
                <h3 className="mb-2 text-xl font-bold">{productError}</h3>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5' : 'flex flex-col gap-3'}>
                  {paginatedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} layout={viewMode} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => changePage(1)} disabled={currentPage === 1} className="pagination-btn">{t('first')}</button>
                    <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">{t('previous')}</button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => changePage(page)}
                        className={`pagination-btn min-w-10 ${currentPage === page ? 'pagination-btn-active' : ''}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn">{t('next')}</button>
                    <button type="button" onClick={() => changePage(totalPages)} disabled={currentPage === totalPages} className="pagination-btn">{t('last')}</button>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-border bg-white px-6 py-10 text-center">
                <h3 className="mb-2 text-xl font-bold">No Products Available</h3>
                <p className="mb-5 text-sm text-gray-500">{t('tryAdjustingFilters')}</p>
                <button onClick={resetFilters} className="btn-primary">{t('reset')}</button>
              </div>
            )}
          </div>

        </div>
      </main>
      )}

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default SingleCategoryPage;
