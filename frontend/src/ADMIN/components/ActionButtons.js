import React from 'react';
import { Link } from 'react-router-dom';

export const OutlookDeleteButton = ({ onClick, title = "Delete", disabled = false, className = "" }) => {
  return (
    <button
      type="button"
      className={`outlook-delete-btn ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      disabled={disabled}
      title={title}
    >
      <svg className="outlook-trash-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          className="trash-lid" 
          d="M7 6H17V5C17 4.44772 16.5523 4 16 4H8C7.44772 4 7 4.44772 7 5V6ZM6 6V7H18V6H6Z" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          className="trash-can" 
          d="M8 8V18C8 18.5523 8.44772 19 9 19H15C15.5523 19 16 18.5523 16 18V8H8ZM10 11H11V16H10V11ZM13 11H14V16H13V11Z" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </button>
  );
};

export const AnimatedEditButton = ({ onClick, to, title = "Edit", className = "" }) => {
  const content = (
    <svg className="animated-edit-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        className="pencil-body"
        d="M14 4L18 8L7 19H3V15L14 4Z" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        className="pencil-tip"
        d="M14 4L16 2L20 6L18 8L14 4Z" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );

  if (to) {
    return (
      <Link to={to} className={`animated-edit-btn ${className}`} title={title} onClick={(e) => e.stopPropagation()}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(e); }} className={`animated-edit-btn ${className}`} title={title}>
      {content}
    </button>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="admin-pagination">
      <div className="admin-pagination__info">
        Showing {startItem}–{endItem} of {totalItems} entries
      </div>
      <div className="admin-pagination__buttons">
        <button 
          className="admin-pagination__btn" 
          type="button"
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          ‹ Prev
        </button>
        <div className="admin-pagination__pages">
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="admin-pagination__ellipsis">…</span>
            ) : (
              <button
                key={page}
                type="button"
                className={`admin-pagination__page ${currentPage === page ? 'admin-pagination__page--active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button 
          className="admin-pagination__btn" 
          type="button"
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          Next ›
        </button>
      </div>
    </div>
  );
};
