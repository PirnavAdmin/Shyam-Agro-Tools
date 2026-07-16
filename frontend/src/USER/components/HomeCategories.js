import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCategories } from '../context/CategoryContext';
import { useLanguage } from '../context/LanguageContext';
import { ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';
import './HomeCategories.css';

const HomeCategories = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    mappedCategories,
    categoriesLoading,
    subcategoriesLoading,
    categoriesError,
  } = useCategories();
  const loading = categoriesLoading || subcategoriesLoading;

  return (
    <section className="home-categories-section bg-light">
      <div className="mx-auto max-w-[1840px]">
        <div className="mb-6 flex flex-col items-end justify-between gap-4 md:flex-row">
          <div>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="mb-1 block text-xs font-semibold uppercase tracking-[3px] text-dark"
            >
              {t('ourCollections')}
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold text-dark md:text-4xl"
            >
              {t('allCategories')}
            </motion.h2>
          </div>
          <button 
            onClick={() => navigate('/categories')}
            className="flex items-center gap-2 text-dark font-semibold hover:text-dark transition-colors group"
          >
            {t('viewAllResults')} 
            <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center group-hover:bg-dark group-hover:text-white transition-all">
              <ChevronRight size={16} />
            </div>
          </button>
        </div>

        <div className="home-category-card-grid">
          {loading && (
            <div className="col-span-full py-8 text-center text-sm text-gray-500">
              Categories Loading...
            </div>
          )}
          {!loading && categoriesError && (
            <div className="col-span-full py-8 text-center text-sm text-gray-500">
              Failed to load categories
            </div>
          )}
          {!loading && !categoriesError && mappedCategories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="home-category-card"
            >
              <CategoryCard category={cat} onExplore={() => navigate(`/category/${cat.id}`)} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCategories;
