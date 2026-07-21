import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCategories } from '../context/CategoryContext';
import { useLanguage } from '../context/LanguageContext';
import { ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';
import SectionHeading from './SectionHeading';
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
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading
            title={t('allCategories')}
            subtitle={t('ourCollections')}
            align="left"
            className="mb-0"
          />
          <button 
            onClick={() => navigate('/categories')}
            className="flex items-center gap-2 text-dark font-semibold hover:text-dark transition-colors group mb-4 md:mb-0"
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
              {t('categoriesLoading') || 'Categories Loading...'}
            </div>
          )}
          {!loading && categoriesError && (
            <div className="col-span-full py-8 text-center text-sm text-gray-500">
              {t('failedLoadCategories') || 'Failed to load categories'}
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
