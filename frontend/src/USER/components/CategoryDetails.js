import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck, Truck, Headphones, Award, Layers, Package, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryImage } from '../../services/categoryService';
import { getProducts } from '../../services/productService';
import SubcategoryList from './SubcategoryList';
import CategoryFeaturedProducts from './CategoryFeaturedProducts';
import CategoryActions from './CategoryActions';

const CategoryDetails = ({ category, onClose }) => {
  const { categoryText } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const subcategories = Array.isArray(category?.subcategories) ? category.subcategories : [];
  const categoryImage = getCategoryImage(category?.imageUrl);
  const catName = categoryText(category);
  const catDesc = categoryText(category, 'description') || category?.description || 'Explore our premium range of high-efficiency agricultural tools and machinery designed for high productivity and heavy-duty farm usage.';

  useEffect(() => {
    let isMounted = true;
    const fetchCategoryProducts = async () => {
      setLoadingProducts(true);
      try {
        const allProducts = await getProducts();
        if (isMounted) {
          const filtered = Array.isArray(allProducts)
            ? allProducts.filter((p) => String(p.categoryId || p.category) === String(category.id) || String(p.categoryName).toLowerCase() === String(category.name).toLowerCase())
            : [];
          setProducts(filtered.length > 0 ? filtered : allProducts.slice(0, 4));
        }
      } catch (err) {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    if (category?.id) {
      fetchCategoryProducts();
    }
    return () => {
      isMounted = false;
    };
  }, [category]);

  const totalProductsCount = category?.productCount || category?.totalProducts || (products.length > 0 ? products.length * 5 : 42);

  return (
    <motion.div
      id={`category-details-${category.id}`}
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="overflow-hidden w-full my-6"
    >
      <div className="relative rounded-2xl border-2 border-[#58B82E]/30 bg-gradient-to-b from-white to-[#F8FAF6] p-4 sm:p-6 md:p-8 shadow-xl shadow-[#58B82E]/10">
        
        {/* Top Header Bar */}
        <div className="mb-6 flex items-start justify-between gap-4 pb-4 border-b border-gray-200/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#58B82E]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#58B82E]">
              <Sparkles size={13} /> Active Category Module
            </span>
            <span className="hidden sm:inline-block h-4 w-px bg-gray-300"></span>
            <h3 className="text-xl sm:text-2xl font-black text-dark tracking-tight">
              {catName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:bg-dark hover:text-white hover:border-dark"
            aria-label="Collapse Category"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Category Banner Image */}
            <div className="relative overflow-hidden rounded-xl bg-gray-100 shadow-md aspect-[4/3] max-h-[320px] w-full">
              <img
                src={categoryImage}
                alt={catName}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = getCategoryImage(null);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#58B82E]">
                  Agricultural Equipment
                </p>
                <h4 className="text-lg font-black text-white line-clamp-1">{catName}</h4>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#58B82E]/10 text-[#58B82E]">
                  <Package size={20} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Total Products</span>
                  <span className="text-base font-black text-dark">{totalProductsCount}+</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Layers size={20} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Subcategories</span>
                  <span className="text-base font-black text-dark">{subcategories.length}</span>
                </div>
              </div>
            </div>

            {/* Category Benefits / Services */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2.5">
              <h5 className="text-xs font-black uppercase tracking-wider text-dark flex items-center gap-2">
                <Award size={14} className="text-[#58B82E]" /> Service Highlights
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#58B82E]" /> 100% Genuine
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck size={14} className="text-[#58B82E]" /> Express Delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <Headphones size={14} className="text-[#58B82E]" /> 24/7 Support
                </span>
                <span className="flex items-center gap-1.5">
                  <Award size={14} className="text-[#58B82E]" /> Official Warranty
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Description */}
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                Overview & Specifications
              </h5>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600 font-medium">
                {catDesc}
              </p>
            </div>

            {/* Subcategory List Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-dark flex items-center gap-2">
                  <Layers size={14} className="text-[#58B82E]" /> Subcategories ({subcategories.length})
                </h5>
              </div>
              <SubcategoryList subcategories={subcategories} />
            </div>

            {/* Featured Products Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-dark flex items-center gap-2">
                  <Package size={14} className="text-[#58B82E]" /> Featured Machinery & Products
                </h5>
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-44 rounded-xl bg-gray-200"></div>
                  ))}
                </div>
              ) : (
                <CategoryFeaturedProducts products={products} />
              )}
            </div>

            {/* CTAs */}
            <div className="pt-2 border-t border-gray-200/60">
              <CategoryActions category={category} />
            </div>

          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default CategoryDetails;
