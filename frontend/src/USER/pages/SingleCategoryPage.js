import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useCategories } from '../context/CategoryContext';
import ProductCard from '../components/ProductCard';
import CategoryBanner from '../components/CategoryBanner';
import { useLanguage } from '../context/LanguageContext';
import { scrollToElementForOneSecond } from '../utils/smoothScroll';
import { getProductsByCategory } from '../../services/productService';
import { getSubcategoryImage } from '../../services/subcategoryService';
import { handleProductImageError } from '../../utils/productImage';
import { Filter, ChevronDown, Grid, List, ChevronRight, ArrowRight, ArrowLeft, Sparkles, Package } from 'lucide-react';
import './SingleCategoryPage.css';

const ITEMS_PER_PAGE = 20;

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
  const [searchParams] = useSearchParams();
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

  // Clean raw id parameter in case of malformed URLs containing question marks
  const cleanId = String(id || '').split('?')[0].trim();

  const currentCategory = mappedCategories.find(
    (category) => String(category.id) === cleanId || category.slug === cleanId
  );
  const title = categoryText(currentCategory) || cleanId.replace(/-/g, ' ');
  const categoryDescription = categoryText(currentCategory, 'description') || '';
  const subcategoriesForCategory = currentCategory?.subcategories || [];
  const selectedSubcategoryData = subcategoriesForCategory.find(
    (subcategory) => String(subcategory.id) === selectedSubcategory
  );

  const handleSubcategorySelect = (subId) => {
    setSelectedSubcategory(String(subId));
    if (subId === 'all') return;
    setTimeout(() => {
      const targetElement = document.getElementById(`subcat-section-${subId}`) || productListRef.current;
      if (targetElement) {
        const yOffset = -110;
        const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 60);
  };

  useEffect(() => {
    const rawSearch = window.location.search || searchParams.toString();
    const sanitizedSearch = rawSearch ? '?' + rawSearch.replace(/^\?+/, '').replace(/\?+/g, '&') : '';
    const params = new URLSearchParams(sanitizedSearch);
    const subcatFromUrl = params.get('subcategory');

    if (subcatFromUrl) {
      setSelectedSubcategory(String(subcatFromUrl));
      setTimeout(() => {
        const targetElement = document.getElementById(`subcat-section-${subcatFromUrl}`) || productListRef.current;
        if (targetElement) {
          const yOffset = -110;
          const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 150);
    } else {
      setSelectedSubcategory('all');
    }
    setPriceFilter('all');
    setPendingStockFilter('all');
    setAppliedStockFilter('all');
    setCurrentPage(1);
  }, [id, searchParams]);

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
        const productData = await getProductsByCategory(currentCategory.id);
        if (isMounted) setCategoryProducts(productData || []);
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
  }, [currentCategory?.id]);

  const stockCounts = useMemo(
    () => ({
      'in-stock': categoryProducts.filter((product) => product.stockStatus === 'in-stock').length,
      'out-of-stock': categoryProducts.filter((product) => product.stockStatus === 'out-of-stock').length,
    }),
    [categoryProducts]
  );

  const filteredProducts = categoryProducts.filter((p) => {
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

  const isDefaultOverviewMode = selectedSubcategory === 'all' && priceFilter === 'all' && appliedStockFilter === 'all';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      {loadingCategories ? (
        <div className="py-12 text-center text-sm font-semibold text-gray-500">Loading...</div>
      ) : categoryError || !currentCategory ? (
        <div className="py-12 text-center text-sm font-semibold text-gray-500">
          {categoryError || 'No Categories Available'}
        </div>
      ) : (
        <>
          {/* TOOLSVILLA-STYLE TOP BREADCRUMB WITH BACK BUTTON */}
          <div className="bg-white border-b border-gray-100">
            <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-dark hover:border-primary hover:text-primary transition-all cursor-pointer mr-2"
                >
                  <ArrowLeft size={14} />
                  <span>{t('back') || 'Back'}</span>
                </button>
                <Link to="/" className="hover:text-primary transition-colors">{t('home') || 'Home'}</Link>
                <ChevronRight size={12} className="text-gray-400" />
                <Link to="/categories" className="hover:text-primary transition-colors">{t('categories') || 'Categories'}</Link>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-dark font-bold">{title}</span>
                {selectedSubcategoryData && (
                  <>
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="text-primary font-bold">{subcategoryText(selectedSubcategoryData)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <CategoryBanner
            category={currentCategory}
            title={title}
            description={categoryDescription}
            t={t}
          />
        </>
      )}

      {!loadingCategories && !categoryError && currentCategory && (
        <main className="mx-auto w-full max-w-[1600px] px-4 lg:px-6 pb-24 pt-6">
          
          {/* TOOLSVILLA SECTION 1: SHOP BY CATEGORY (SUBCATEGORIES CARDS) */}
          {subcategoriesForCategory.length > 0 && (
            <section className="toolsvilla-shop-by-category mb-10 bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-dark tracking-tight uppercase">
                    {t('shopByCategory') || 'Shop by Subcategory'}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Browse specialized equipment under {title}
                  </p>
                </div>
                {selectedSubcategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory('all')}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>View All Subcategories</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* ALL PRODUCTS CARD */}
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory('all')}
                  className={`subcat-card-toolsvilla border rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[80px] ${
                    selectedSubcategory === 'all'
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                      : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <span className="text-xs md:text-sm font-bold text-dark group-hover:text-primary transition-colors line-clamp-2">
                    {t('allProducts') || 'All Products'}
                  </span>
                  <span className={`text-[11px] font-bold mt-1.5 px-2.5 py-0.5 rounded-full ${
                    selectedSubcategory === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {categoryProducts.length} {t('items')}
                  </span>
                </button>

                {/* SUBCATEGORY CARDS (NO IMAGES - NAME & ITEM COUNT ONLY) */}
                {subcategoriesForCategory.map((sub) => {
                  const subTitle = subcategoryText(sub) || sub.name;
                  const isSelected = selectedSubcategory === String(sub.id);
                  const subProductsCount = categoryProducts.filter((p) => productMatchesSubcategory(p, sub)).length;

                  return (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => handleSubcategorySelect(sub.id)}
                      className={`subcat-card-toolsvilla border rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[80px] ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                          : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <span className="text-xs md:text-sm font-bold text-dark line-clamp-2 group-hover:text-primary transition-colors">
                        {subTitle}
                      </span>
                      <span className={`text-[11px] font-bold mt-1.5 px-2.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {subProductsCount} {t('items')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* TOOLSVILLA SECTION 2+: GROUPED SUBCATEGORY PRODUCTS OR FULL LISTING */}
          {isDefaultOverviewMode && subcategoriesForCategory.length > 0 ? (
            <div className="flex flex-col gap-10">
              {subcategoriesForCategory.map((sub) => {
                const subTitle = subcategoryText(sub) || sub.name;
                const subProds = categoryProducts.filter((p) => productMatchesSubcategory(p, sub));
                if (subProds.length === 0) return null;

                return (
                  <section
                    key={sub.id}
                    id={`subcat-section-${sub.id}`}
                    className="subcat-group-section bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-2xs"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-6 bg-primary rounded-full"></span>
                        <h3 className="text-lg md:text-xl font-black text-dark uppercase tracking-tight">
                          {subTitle}
                        </h3>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">
                          {subProds.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSubcategorySelect(sub.id)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider"
                      >
                        <span>{t('viewAll') || 'View All'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                      {subProds.slice(0, 5).map((p) => (
                        <ProductCard key={p.id} product={p} layout="grid" />
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* UNGROUPED PRODUCTS IF ANY */}
              {(() => {
                const ungroupedProds = categoryProducts.filter(
                  (p) => !subcategoriesForCategory.some((sub) => productMatchesSubcategory(p, sub))
                );
                if (ungroupedProds.length === 0) return null;

                return (
                  <section className="subcat-group-section bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-6 bg-primary rounded-full"></span>
                        <h3 className="text-lg md:text-xl font-black text-dark uppercase tracking-tight">
                          Other Products
                        </h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                      {ungroupedProds.map((p) => (
                        <ProductCard key={p.id} product={p} layout="grid" />
                      ))}
                    </div>
                  </section>
                );
              })()}
            </div>
          ) : (
            /* GRID VIEW (WHEN FILTERED BY SUBCATEGORY OR PRICE) */
            <div className="flex flex-col gap-5">
              {/* Product Grid */}
              <div className="flex flex-grow flex-col" ref={productListRef}>
                <div className="mb-4 flex items-center justify-between border border-gray-100 bg-white px-4 py-3 rounded-xl shadow-2xs">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {t('showing')} {filteredProducts.length} {t('items').toLowerCase()}
                  </p>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 border-r border-gray-100 pr-6 hidden md:flex">
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
                      >
                        <span className="text-xs font-bold uppercase tracking-widest text-dark">
                          {t('sortBy')}: {t('featured')}
                        </span>
                        <ChevronDown size={14} className="text-gray-400" />
                      </button>

                      {isSortMenuOpen && (
                        <div className="absolute right-0 top-full z-40 mt-3 w-64 border border-gray-100 bg-white shadow-2xl rounded-md p-2">
                          <button
                            type="button"
                            onClick={() => handleSortMenuNavigate('/featured')}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-dark hover:bg-gray-50 hover:text-primary rounded-sm"
                          >
                            {t('featured')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isLoadingProducts ? (
                  <div className="border border-gray-100 bg-white px-6 py-12 text-center text-sm font-semibold text-gray-500 rounded-xl">
                    Loading...
                  </div>
                ) : productError ? (
                  <div className="border border-gray-100 bg-white px-6 py-12 text-center rounded-xl">
                    <h3 className="mb-2 text-xl font-bold text-dark">{productError}</h3>
                  </div>
                ) : paginatedProducts.length > 0 ? (
                  <>
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5'
                          : 'flex flex-col gap-4'
                      }
                    >
                      {paginatedProducts.map((p) => (
                        <ProductCard key={p.id} product={p} layout={viewMode} />
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
                          {t('first')}
                        </button>
                        <button
                          type="button"
                          onClick={() => changePage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="pagination-btn"
                        >
                          {t('previous')}
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
                          {t('next')}
                        </button>
                        <button
                          type="button"
                          onClick={() => changePage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="pagination-btn"
                        >
                          {t('last')}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border border-gray-100 bg-white px-6 py-12 text-center rounded-xl">
                    <Package size={32} className="mx-auto mb-3 text-gray-300" />
                    <h3 className="mb-2 text-lg font-bold text-dark">No Products Available</h3>
                    <p className="mb-5 text-xs text-gray-500">{t('tryAdjustingFilters')}</p>
                    <button type="button" onClick={resetFilters} className="btn-primary text-xs">
                      {t('reset')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default SingleCategoryPage;
