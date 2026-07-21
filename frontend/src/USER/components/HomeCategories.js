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
        <div className="mb-6 relative flex flex-col items-center justify-center gap-4">
          <SectionHeading
            title={t('allCategories')}
            subtitle={t('ourCollections')}
            align="center"
            className="mb-0 text-center"
          />
          <div className="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
            <button 
              type="button"
              onClick={() => navigate('/categories')}
              className="flex items-center gap-2 text-dark font-semibold hover:text-[#58B82E] transition-colors group"
            >
              <span>{t('viewAllResults')}</span> 
              <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center group-hover:bg-[#58B82E] group-hover:text-white group-hover:border-[#58B82E] transition-all shadow-sm">
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
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
