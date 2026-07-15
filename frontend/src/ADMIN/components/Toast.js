import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#b91c1c',
          icon: <AlertTriangle size={18} color="#dc2626" />
        };
      case 'warning':
        return {
          bg: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#b45309',
          icon: <AlertTriangle size={18} color="#d97706" />
        };
      default: // success
        return {
          bg: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          icon: <CheckCircle2 size={18} color="#16a34a" />
        };
    }
  };

  const style = getStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        backgroundColor: style.bg,
        border: style.border,
        color: style.color,
        padding: '12px 18px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '280px',
        maxWidth: '420px',
        animation: 'slideIn 0.3s ease-out',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      {style.icon}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'inherit',
          opacity: 0.7
        }}
      >
        <X size={16} />
      </button>

      {/* Slide-in style tag */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
