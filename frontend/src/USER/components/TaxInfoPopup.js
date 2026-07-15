import React, { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { formatCurrency } from '../utils/orders';
import './TaxInfoPopup.css';

const TaxInfoPopup = ({ taxableAmount, cgst, sgst, totalGst }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className="tax-info-wrap" ref={popupRef}>
      <button
        type="button"
        className="tax-info-button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="View tax breakdown"
        aria-expanded={isOpen}
      >
        <Info size={14} />
      </button>

      {isOpen && (
        <span className="tax-info-popup" role="dialog" aria-label="Tax breakdown">
          <span className="tax-info-title">Tax Breakdown</span>
          <span className="tax-info-line">
            <span>Taxable Amount</span>
            <strong>{formatCurrency(taxableAmount)}</strong>
          </span>
          <span className="tax-info-line">
            <span>CGST (9%)</span>
            <strong>{formatCurrency(cgst)}</strong>
          </span>
          <span className="tax-info-line">
            <span>SGST (9%)</span>
            <strong>{formatCurrency(sgst)}</strong>
          </span>
          <span className="tax-info-line tax-info-total">
            <span>Total GST</span>
            <strong>{formatCurrency(totalGst)}</strong>
          </span>
        </span>
      )}
    </span>
  );
};

export default TaxInfoPopup;
