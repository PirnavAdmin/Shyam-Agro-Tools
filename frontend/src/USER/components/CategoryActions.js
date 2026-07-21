import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Grid } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CategoryActions = ({ category }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!category) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      {/* Primary Button */}
      <button
        type="button"
        onClick={() => navigate(`/categories?category=${encodeURIComponent(category.id)}`)}
        className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#58B82E] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[#58B82E]/20 transition-all duration-250 hover:bg-[#479924] hover:shadow-lg hover:shadow-[#58B82E]/30 hover:scale-[1.03] active:scale-[0.98]"
      >
        <span>{t('exploreCategory') || 'Explore Category'}</span>
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
      </button>

      {/* Secondary Button */}
      <button
        type="button"
        onClick={() => navigate(`/products?category=${encodeURIComponent(category.id)}`)}
        className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-dark shadow-sm transition-all duration-250 hover:border-[#58B82E] hover:bg-[#F3FAEF] hover:text-[#58B82E] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      >
        <Grid size={15} />
        <span>{t('viewAllProducts') || 'View All Products'}</span>
      </button>
    </div>
  );
};

export default CategoryActions;
