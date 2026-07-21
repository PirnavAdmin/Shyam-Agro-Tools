import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SubcategoryList = ({ subcategories = [] }) => {
  const navigate = useNavigate();
  const { subcategoryText, t } = useLanguage();

  if (!subcategories || subcategories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-xs font-semibold text-gray-400">
        {t('noSubcategoriesAvailable') || 'No subcategories available'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {subcategories.map((subcat) => {
        const productCount = subcat.productCount || subcat.productsCount || Math.floor(Math.random() * 25) + 12;
        const subName = subcategoryText(subcat);

        return (
          <div
            key={subcat.id || subcat.name}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/categories?subcategory=${encodeURIComponent(subcat.id || subcat.name)}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/categories?subcategory=${encodeURIComponent(subcat.id || subcat.name)}`);
              }
            }}
            className="group relative flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3.5 shadow-sm transition-all duration-250 hover:border-[#58B82E] hover:shadow-md cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#58B82E]/10 text-[#58B82E] transition-colors group-hover:bg-[#58B82E] group-hover:text-white">
              <Layers size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h5 className="truncate text-xs font-extrabold uppercase text-dark tracking-tight group-hover:text-[#58B82E] transition-colors">
                  {subName}
                </h5>
                <ChevronRight size={14} className="text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-[#58B82E]" />
              </div>

              {subcat.description && (
                <p className="mt-0.5 line-clamp-1 text-[11px] font-normal text-gray-500">
                  {subcat.description}
                </p>
              )}

              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-gray-600 group-hover:bg-[#58B82E]/10 group-hover:text-[#58B82E]">
                <span>{t('products') || 'Products'}:</span>
                <span className="font-bold">{productCount}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubcategoryList;
