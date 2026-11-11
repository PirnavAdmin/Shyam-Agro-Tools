import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
  maxVisible = 4,
}) => {
  const { t } = useLanguage();

  const page = Math.max(1, Number(currentPage) || 1);
  const total = Math.max(1, Number(totalPages) || 1);

  if (total <= 1) return null;

  // Sliding window of page numbers (e.g. 4 pages max)
  let startPage = Math.max(1, page - 1);
  let endPage = startPage + maxVisible - 1;

  if (endPage > total) {
    endPage = total;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const isFirst = page <= 1;
  const isLast = page >= total;

  const handlePage = (p) => {
    if (p < 1 || p > total || p === page) return;
    if (onPageChange) {
      onPageChange(p);
    }
  };

  const prevText =
    t('prev') && t('prev') !== 'prev'
      ? t('prev')
      : t('previous') && t('previous') !== 'Previous'
      ? t('previous')
      : 'Prev';
  const firstText = t('first') || 'First';
  const nextText = t('next') || 'Next';
  const lastText = t('last') || 'Last';

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`mt-8 mb-6 flex items-center justify-center gap-2 flex-nowrap overflow-x-auto py-2 px-1 select-none ${className}`}
    >
      {/* First Button */}
      <button
        type="button"
        onClick={() => handlePage(1)}
        disabled={isFirst}
        className={`inline-flex items-center justify-center h-10 px-3.5 sm:px-4 rounded-lg border text-sm font-normal sm:font-medium transition-all duration-150 whitespace-nowrap shadow-xs ${
          isFirst
            ? 'border-[#e2e8f0] bg-white text-[#94a3b8] opacity-50 cursor-not-allowed'
            : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 active:scale-95 cursor-pointer'
        }`}
      >
        <span className="mr-1.5 font-sans text-base leading-none">&laquo;</span>
        <span>{firstText}</span>
      </button>

      {/* Prev Button */}
      <button
        type="button"
        onClick={() => handlePage(page - 1)}
        disabled={isFirst}
        className={`inline-flex items-center justify-center h-10 px-3.5 sm:px-4 rounded-lg border text-sm font-normal sm:font-medium transition-all duration-150 whitespace-nowrap shadow-xs ${
          isFirst
            ? 'border-[#e2e8f0] bg-white text-[#94a3b8] opacity-50 cursor-not-allowed'
            : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 active:scale-95 cursor-pointer'
        }`}
      >
        <span className="mr-1.5 font-sans text-sm leading-none">&lt;</span>
        <span>{prevText}</span>
      </button>

      {/* Page Numbers */}
      {pages.map((p) => {
        const isActive = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => handlePage(p)}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center justify-center h-10 min-w-10 px-3 rounded-lg border text-sm font-medium transition-all duration-150 shadow-xs ${
              isActive
                ? 'border-[#115e59] bg-[#115e59] text-white font-semibold cursor-default'
                : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 active:scale-95 cursor-pointer'
            }`}
          >
            {p}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        type="button"
        onClick={() => handlePage(page + 1)}
        disabled={isLast}
        className={`inline-flex items-center justify-center h-10 px-3.5 sm:px-4 rounded-lg border text-sm font-normal sm:font-medium transition-all duration-150 whitespace-nowrap shadow-xs ${
          isLast
            ? 'border-[#e2e8f0] bg-white text-[#94a3b8] opacity-50 cursor-not-allowed'
            : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 active:scale-95 cursor-pointer'
        }`}
      >
        <span>{nextText}</span>
        <span className="ml-1.5 font-sans text-sm leading-none">&gt;</span>
      </button>

      {/* Last Button */}
      <button
        type="button"
        onClick={() => handlePage(total)}
        disabled={isLast}
        className={`inline-flex items-center justify-center h-10 px-3.5 sm:px-4 rounded-lg border text-sm font-normal sm:font-medium transition-all duration-150 whitespace-nowrap shadow-xs ${
          isLast
            ? 'border-[#e2e8f0] bg-white text-[#94a3b8] opacity-50 cursor-not-allowed'
            : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 active:scale-95 cursor-pointer'
        }`}
      >
        <span>{lastText}</span>
        <span className="ml-1.5 font-sans text-base leading-none">&raquo;</span>
      </button>
    </nav>
  );
};

export default Pagination;
