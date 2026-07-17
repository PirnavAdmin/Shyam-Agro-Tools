import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryImage } from '../../services/categoryService';
import './CategoryCard.css';

const CategoryCard = ({ category, onExplore, className = '' }) => {
  const { t, categoryText, subcategoryText } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
  const categoryImage = getCategoryImage(category.imageUrl);

  if (process.env.NODE_ENV === 'development') {
    console.log(category.name, category.imageUrl, categoryImage);
  }

  return (
    <div className={`app-category-card group ${isOpen ? 'active' : ''} ${className}`}>
      {/* Cover View (Click to Toggle Detail panel) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') setIsOpen(!isOpen);
        }}
        className="app-category-cover cursor-pointer"
        aria-label={`View ${categoryText(category)} details`}
      >
        <img
          src={categoryImage}
          alt={categoryText(category)}
          className="app-category-cover-image"
          loading="lazy"
          onError={(event) => {
            if (process.env.NODE_ENV === 'development') {
              console.error(
                'Category image failed',
                category.id,
                category.imageUrl
              );
            }
            event.currentTarget.onerror = null;
            if (event.currentTarget.src !== getCategoryImage(null)) {
              event.currentTarget.src = getCategoryImage(null);
            }
          }}
        />
        <span className="app-category-cover-overlay"></span>
        <span className="app-category-cover-content">
          <span className="app-category-icon app-category-cover-icon">
            <i className="fas fa-layer-group"></i>
          </span>
          <span className="app-category-count app-category-cover-count">
            {subcategories.length} {t('subCategories')}
          </span>
          <span className="app-category-cover-title">{categoryText(category)}</span>
        </span>
      </div>

      {/* Details View */}
      <span className="app-category-detail">
        <span className="app-category-card-top">
          <span className="app-category-icon">
            <i className="fas fa-layer-group"></i>
          </span>
          {/* Close button for touch devices */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(false);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3FAEF] text-[#58B82E] hover:bg-[#58B82E] hover:text-white transition-all md:hidden border border-dashed border-[#58B82E]/30"
            aria-label="Close category details"
          >
            <i className="fas fa-times text-[10px]"></i>
          </button>
          <span className="app-category-count">
            {subcategories.length} {t('subCategories')}
          </span>
        </span>

        <span className="app-category-title">{categoryText(category)}</span>
        <span className="mt-2 block text-xs leading-5 text-gray-500">
          {categoryText(category, 'description')}
        </span>

        <span className="app-category-subcategory-list">
          {subcategories.length > 0 ? (
            subcategories.map((subcategory) => (
              <span key={subcategory.id} className="app-category-subcategory-item">
                <span className="app-category-subcategory-dot"></span>
                <span>
                  <span className="block">{subcategoryText(subcategory)}</span>
                  {subcategory.description && (
                    <span className="mt-0.5 block text-[10px] font-normal leading-4 text-gray-400">
                      {subcategory.description}
                    </span>
                  )}
                </span>
              </span>
            ))
          ) : (
            <span className="app-category-subcategory-item text-xs italic text-gray-400">
              {t('noSubcategoriesAvailable', 'No Subcategories Available')}
            </span>
          )}
        </span>

        <span className="app-category-divider"></span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onExplore?.(category);
          }}
          className="app-category-footer w-full text-left flex items-center justify-between gap-3"
        >
          <span>{t('exploreCollection')}</span>
          <span className="app-category-arrow">
            <ChevronRight size={15} />
          </span>
        </button>
      </span>
    </div>
  );
};

export default CategoryCard;
