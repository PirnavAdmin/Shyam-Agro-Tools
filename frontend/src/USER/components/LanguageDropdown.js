import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { languages as supportedLanguages, useLanguage } from '../context/LanguageContext';

const LanguageDropdown = ({ variant = 'top' }) => {
  const { activeLanguage, languages, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const isMobile = variant === 'mobile';
  const languageOptions = supportedLanguages.length > languages.length ? supportedLanguages : languages;

  useEffect(() => {
    const closeDropdown = (event) => {
      if (
        !dropdownRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeDropdown);
    return () => document.removeEventListener('mousedown', closeDropdown);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      const buttonRect = dropdownRef.current?.getBoundingClientRect();
      if (!buttonRect) return;

      const menuWidth = isMobile ? buttonRect.width : 264;
      const left = isMobile
        ? buttonRect.left
        : Math.max(8, buttonRect.right - menuWidth);

      setMenuPosition({
        top: buttonRect.bottom + 8,
        left,
        width: menuWidth,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isMobile, isOpen]);

  const handleLanguageSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const dropdownMenu = isOpen && menuPosition && (
    <div
      ref={menuRef}
      className={`language-dropdown-menu language-dropdown-menu-portal ${
        isMobile ? 'language-dropdown-menu-mobile' : ''
      }`}
      role="listbox"
      aria-label={t('language')}
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        width: menuPosition.width,
      }}
    >
      {languageOptions.map((item) => (
        <button
          key={item.code}
          type="button"
          role="option"
          aria-selected={activeLanguage.code === item.code}
          onClick={() => handleLanguageSelect(item.code)}
          className={`language-dropdown-item ${
            activeLanguage.code === item.code ? 'language-dropdown-item-active' : ''
          }`}
        >
          <span className="language-dropdown-label">{item.nativeLabel || item.label}</span>
          <span className="language-dropdown-short">{item.shortLabel}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div
        ref={dropdownRef}
        className={`language-dropdown-wrap ${isMobile ? 'language-dropdown-wrap-mobile' : ''}`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={isMobile ? 'language-dropdown-trigger-mobile' : 'language-dropdown-trigger'}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>
            {isMobile
              ? `${t('language')}: ${activeLanguage.nativeLabel || activeLanguage.label}`
              : activeLanguage.shortLabel}
          </span>
          <ChevronDown size={isMobile ? 15 : 10} />
        </button>
      </div>

      {typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </>
  );
};

export default LanguageDropdown;
