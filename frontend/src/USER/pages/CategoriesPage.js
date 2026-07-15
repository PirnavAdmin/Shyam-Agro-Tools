import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import CategoryCard from '../components/CategoryCard';
import { useCategories } from '../context/CategoryContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const CategoriesPage = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const {
    mappedCategories,
    categoriesLoading,
    subcategoriesLoading,
    categoriesError,
    subcategoriesError,
  } = useCategories();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const loading = categoriesLoading || subcategoriesLoading;

  return (
    <div className="flex flex-col min-h-screen bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />
      
      <main className="flex-grow px-2 py-3 md:px-3 lg:px-4">
        <div className="mx-auto w-full max-w-[1840px]">
          <div className="mb-3 text-center">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[3px] text-dark"
            >
              {t('ourCollections')}
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold uppercase text-dark md:text-4xl"
            >
              {t('allCategories')}
            </motion.h1>
          </div>

          <div className="categories-page-grid">
            {loading && (
              <div className="col-span-full py-10 text-center text-sm font-semibold text-gray-500">
                Loading...
              </div>
            )}

            {!loading && categoriesError && (
              <div className="col-span-full py-10 text-center text-sm font-semibold text-gray-500">
                {categoriesError}
                <br />
                Please try again.
              </div>
            )}

            {!loading && !categoriesError && subcategoriesError && (
              <div className="col-span-full py-4 text-center text-sm font-semibold text-gray-500">
                {subcategoriesError}
                <br />
                Please try again.
              </div>
            )}

            {!loading && !categoriesError && mappedCategories.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm font-semibold text-gray-500">
                No Categories Available
              </div>
            )}

            {!loading && !categoriesError && mappedCategories.map((cat, index) => (
              <motion.div 
                key={cat.id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CategoryCard
                  category={cat}
                  onExplore={() => navigate(`/category/${cat.id}`)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default CategoriesPage;
