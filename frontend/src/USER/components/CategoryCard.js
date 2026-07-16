import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryImage } from '../../services/categoryService';
import './CategoryCard.css';

const CategoryCard = ({ category, onExplore, className = '' }) => {
  const { t, categoryText, subcategoryText } = useLanguage();
  const subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
  const categoryImage = getCategoryImage(category.imageUrl);

  if (process.env.NODE_ENV === 'development') {
    console.log(category.name, category.imageUrl, categoryImage);
  }

  const handleClick = () => {
    onExplore?.(category);
  };

  return (
    <button type="button" onClick={handleClick} className={`app-category-card group ${className}`}>
      <span className="app-category-cover">
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
      </span>

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
            <span className="app-category-subcategory-item">
              No Subcategories Available
            </span>
          )}
        </span>

        <span className="app-category-divider"></span>

        <span className="app-category-footer">
          <span>{t('exploreCollection')}</span>
          <span className="app-category-arrow">
            <ChevronRight size={15} />
          </span>
        </span>
      </span>
    </button>
  );
};

export default CategoryCard;
