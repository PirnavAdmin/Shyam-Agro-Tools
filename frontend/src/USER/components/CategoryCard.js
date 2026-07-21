import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryImage } from '../../services/categoryService';
import './CategoryCard.css';

const CategoryCard = ({ category, onExplore, className = '' }) => {
  const navigate = useNavigate();
  const { t, categoryText, subcategoryText } = useLanguage();
  const subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
  const categoryImage = getCategoryImage(category.imageUrl);

  const handleClickCategory = (event) => {
    event?.stopPropagation();
    if (onExplore) {
      onExplore(category);
    } else {
      navigate(`/category/${category.id}`);
    }
  };

  const handleSubcategoryClick = (event, subcat) => {
    event.stopPropagation();
    navigate(`/category/${category.id}?subcategory=${encodeURIComponent(subcat.id || subcat.name)}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClickCategory}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClickCategory(event);
        }
      }}
      className={`app-category-card group cursor-pointer ${className}`}
      aria-label={`Explore ${categoryText(category)} products`}
    >
      {/* Cover View */}
      <div className="app-category-cover cursor-pointer">
        <img
          src={categoryImage}
          alt={categoryText(category)}
          className="app-category-cover-image"
          loading="lazy"
          onError={(event) => {
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

      {/* Details View (Shows on hover/touch) */}
      <span className="app-category-detail">
        <span className="app-category-card-top">
          <span className="app-category-icon">
            <i className="fas fa-layer-group"></i>
          </span>
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
              <span
                key={subcategory.id || subcategory.name}
                onClick={(e) => handleSubcategoryClick(e, subcategory)}
                className="app-category-subcategory-item hover:text-[#58B82E] transition-colors"
              >
                <span className="app-category-subcategory-dot"></span>
                <span>
                  <span className="block font-semibold">{subcategoryText(subcategory)}</span>
                  {subcategory.description && (
                    <span className="mt-0.5 block text-[10px] font-normal leading-4 text-gray-400 line-clamp-1">
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
          onClick={handleClickCategory}
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
