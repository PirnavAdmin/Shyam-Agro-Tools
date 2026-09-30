import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Package, ArrowRight, Sparkles } from 'lucide-react';
import { getCategoryImage } from '../../services/categoryService';
import { getSubcategoryImage } from '../../services/subcategoryService';
import { getProducts } from '../../services/productService';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import { useLanguage } from '../context/LanguageContext';
import './CategoriesMegaMenu.css';

const CategoriesMegaMenu = ({ mappedCategories = [], onClose }) => {
  const navigate = useNavigate();
  const { t, productText, categoryText, subcategoryText } = useLanguage();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [activeSubcategoryIndex, setActiveSubcategoryIndex] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  const activeCategory = activeCategoryIndex !== null ? mappedCategories[activeCategoryIndex] : null;
  const subcategories = activeCategory?.subcategories || [];
  const activeSubcategory = (activeCategory && activeSubcategoryIndex !== null) ? subcategories[activeSubcategoryIndex] : null;

  // Pre-load all products once on mount for instant zero-latency hover filtering
  useEffect(() => {
    let isMounted = true;
    getProducts()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAllProducts(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to pre-fetch mega menu products:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset active subcategory index when category changes
  useEffect(() => {
    setActiveSubcategoryIndex(null);
  }, [activeCategoryIndex]);

  // Instant in-memory filtering for active subcategory
  const products = useMemo(() => {
    if (!activeSubcategory?.id) return [];
    const targetSubId = String(activeSubcategory.id).toLowerCase();
    const targetSubName = String(activeSubcategory.name || '').toLowerCase();

    return allProducts.filter((p) => {
      const pSubId = String(p.subcategoryId ?? p.subCategoryId ?? '').toLowerCase();
      const pSubName = String(p.subcategory ?? p.subCategory ?? '').toLowerCase();
      return pSubId === targetSubId || (targetSubName && pSubName === targetSubName);
    });
  }, [allProducts, activeSubcategory]);

  if (!mappedCategories || mappedCategories.length === 0) return null;

  const handleCategoryClick = (category) => {
    onClose?.();
    const catId = String(category?.id || '').split('?')[0];
    navigate(`/category/${catId}`);
  };

  const handleSubcategoryClick = (subcategory) => {
    onClose?.();
    const catId = String(activeCategory?.id || '').split('?')[0];
    navigate(`/category/${catId}?subcategory=${subcategory.id}`);
  };

  const handleProductClick = (productId) => {
    onClose?.();
    navigate(`/product/${productId}`);
  };

  return (
    <div
      className="mega-menu-container shadow-2xl rounded-b-md border border-gray-100 bg-white font-poppins transition-all duration-200"
      style={{
        width: activeSubcategory ? '860px' : activeCategory ? '520px' : '260px',
      }}
      onMouseLeave={onClose}
    >
      <div className="mega-menu-inner flex min-h-[420px] max-h-[520px]">
        
        {/* COLUMN 1: CATEGORIES LIST (ALWAYS VISIBLE) */}
        <div className="mega-col-categories w-[260px] shrink-0 border-r border-gray-100 bg-gray-50/50 py-3 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 mb-1 flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" />
            <span>{t('categories') || 'Categories'}</span>
          </div>

          <div className="flex flex-col">
            {mappedCategories.map((category, idx) => {
              const isActive = activeCategoryIndex === idx;
              const catTitle = categoryText(category) || category.name;
              const catImage = getCategoryIconUrl(category.imageUrl);

              return (
                <button
                  type="button"
                  key={category.id || idx}
                  onMouseEnter={() => {
                    setActiveCategoryIndex(idx);
                    setActiveSubcategoryIndex(null);
                  }}
                  onClick={() => handleCategoryClick(category)}
                  className={`mega-cat-item flex items-center justify-between px-4 py-3 text-left transition-all group ${
                    isActive
                      ? 'bg-white text-primary font-bold shadow-sm border-l-4 border-primary'
                      : 'text-dark hover:bg-white/80 hover:text-primary font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={catImage}
                        alt={catTitle}
                        onError={handleProductImageError}
                        className="w-5 h-5 object-contain"
                      />
                    </span>
                    <span className="text-xs truncate">{catTitle}</span>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-transform ${
                      isActive ? 'text-primary translate-x-0.5' : 'text-gray-400 group-hover:text-primary'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: SUBCATEGORIES LIST (ONLY REVEALED ON CATEGORY HOVER) */}
        {activeCategory && (
          <div className="mega-col-subcategories w-[260px] shrink-0 border-r border-gray-100 bg-white py-3 overflow-y-auto animate-fadeIn">
            <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 mb-1 flex items-center justify-between">
              <span>{t('subCategories') || 'Subcategories'}</span>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                {subcategories.length}
              </span>
            </div>

            {subcategories.length > 0 ? (
              <div className="flex flex-col">
                {subcategories.map((sub, subIdx) => {
                  const isSubActive = activeSubcategoryIndex === subIdx;
                  const subTitle = subcategoryText(sub) || sub.name;
                  const subImage = getSubcategoryImage(sub.imageUrl);

                  return (
                    <button
                      type="button"
                      key={sub.id || subIdx}
                      onMouseEnter={() => setActiveSubcategoryIndex(subIdx)}
                      onClick={() => handleSubcategoryClick(sub)}
                      className={`mega-sub-item flex items-center justify-between px-4 py-2.5 text-left transition-all group ${
                        isSubActive
                          ? 'bg-[#F3FAEF] text-primary font-bold border-r-2 border-primary'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs truncate">{subTitle}</span>
                      </div>
                      <ChevronRight
                        size={13}
                        className={`shrink-0 ${
                          isSubActive ? 'text-primary' : 'text-gray-300 group-hover:text-primary'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">
                No subcategories available
              </div>
            )}
          </div>
        )}

        {/* COLUMN 3: RELATED PRODUCTS GRID (ONLY REVEALED ON SUBCATEGORY HOVER) */}
        {activeCategory && activeSubcategory && (
          <div className="mega-col-products flex-1 bg-gray-50/30 p-4 flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {subcategoryText(activeSubcategory) || activeSubcategory.name} Products
                </span>
                <button
                  type="button"
                  onClick={() => handleSubcategoryClick(activeSubcategory)}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>{t('viewAll') || 'View All'}</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {products.slice(0, 4).map((product) => {
                    const pName = productText(product, 'name');
                    const pImage = getProductImage(product);
                    const pPrice = product.sellingPrice || product.price || product.mrp;

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="mega-product-card bg-white rounded-md border border-gray-100 p-2.5 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
                      >
                        <span className="w-12 h-12 rounded bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 p-1">
                          <img
                            src={pImage}
                            alt={pName}
                            onError={handleProductImageError}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-[11px] font-bold text-dark truncate group-hover:text-primary transition-colors">
                            {pName}
                          </h5>
                          <p className="text-xs font-black text-primary mt-0.5">
                            ₹{Number(pPrice || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-400">
                  <Package size={24} className="mx-auto mb-2 text-gray-300" />
                  <span>No products found under this subcategory</span>
                </div>
              )}
            </div>

            {/* BOTTOM QUICK FOOTER LINK */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
              <span className="text-gray-500">
                Explore full {categoryText(activeCategory) || activeCategory.name} collection
              </span>
              <button
                type="button"
                onClick={() => handleCategoryClick(activeCategory)}
                className="bg-primary text-white px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider"
              >
                <span>Shop Category</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const getCategoryIconUrl = (url) => {
  return getCategoryImage(url);
};

export default CategoriesMegaMenu;
