import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { getBrands } from '../../services/brandService';
import { useToast } from '../context/ToastContext';
import './BrandSlider.css';

const brandColors = [
  '#c8102e',
  '#367c2b',
  '#f47920',
  '#cc0000',
  '#e8560d',
  '#003087',
  '#003DA5',
  '#e63312',
  '#2563a8',
];

const getBrandColor = (brand, index) => {
  const seed = String(brand.brandIdentifier || brand.slug || brand.name || index);
  const hash = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
  return brandColors[hash % brandColors.length];
};

const BrandSlider = () => {
  const { showToast } = useToast();
  const trackWrapperRef = useRef(null);
  const autoScrollRef = useRef(null);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const loadBrands = useCallback(async () => {
    setIsLoading(true);

    try {
      setBrands(await getBrands());
    } catch (error) {
      console.error('Unable to load brands.', error);
      showToast?.('Unable to load brands.', 'error');
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const allBrands = useMemo(() => {
    const visibleBrands = brands.map((brand, index) => ({
      ...brand,
      color: getBrandColor(brand, index),
    }));

    return [...visibleBrands, ...visibleBrands, ...visibleBrands];
  }, [brands]);

  const resetLoopPosition = useCallback(() => {
    const wrapper = trackWrapperRef.current;
    if (!wrapper || brands.length === 0) return;

    const loopWidth = wrapper.scrollWidth / 3;
    if (loopWidth <= 0) return;

    if (wrapper.scrollLeft >= loopWidth * 2) {
      wrapper.scrollLeft -= loopWidth;
    } else if (wrapper.scrollLeft <= 0) {
      wrapper.scrollLeft += loopWidth;
    }
  }, [brands.length]);

  useEffect(() => {
    const wrapper = trackWrapperRef.current;
    if (!wrapper || brands.length === 0) return;
    wrapper.scrollLeft = wrapper.scrollWidth / 3;
  }, [brands.length]);

  useEffect(() => {
    if (isPaused || isLoading || brands.length <= 1) return undefined;

    autoScrollRef.current = window.setInterval(() => {
      const wrapper = trackWrapperRef.current;
      if (!wrapper) return;
      wrapper.scrollLeft += 1;
      resetLoopPosition();
    }, 20);

    return () => {
      if (autoScrollRef.current) {
        window.clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    };
  }, [brands.length, isLoading, isPaused, resetLoopPosition]);

  const scrollBrands = (direction) => {
    const wrapper = trackWrapperRef.current;
    if (!wrapper) return;

    wrapper.scrollBy({
      left: direction * Math.min(360, wrapper.clientWidth * 0.75),
      behavior: 'smooth',
    });
    window.setTimeout(resetLoopPosition, 450);
  };

  const handleCarouselKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollBrands(-1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollBrands(1);
    }
  };

  return (
    <section className="brand-slider-section">
      <div className="brand-slider-header">
        <span className="brand-label">OUR TRUSTED BRANDS</span>
        <div className="brand-divider" />
      </div>

      <div className="brand-slider-body">
        <button
          type="button"
          className="brand-slider-control brand-slider-control-prev"
          onClick={() => scrollBrands(-1)}
          aria-label="Scroll brands backward"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="brand-slider-control brand-slider-control-toggle"
          onClick={() => setIsPaused((current) => !current)}
          aria-label={isPaused ? 'Play brand carousel' : 'Pause brand carousel'}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <div
          className="brand-track-wrapper"
          ref={trackWrapperRef}
          tabIndex={0}
          aria-label="Trusted brands carousel"
          onKeyDown={handleCarouselKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onScroll={resetLoopPosition}
        >
          <div className="brand-track">
            {isLoading ? (
              <div className="brand-card">
                <div className="brand-logo-wrap">
                  <div className="brand-fallback" style={{ display: 'flex' }}>
                    Loading...
                  </div>
                </div>
                <span className="brand-name">Loading...</span>
              </div>
            ) : allBrands.length === 0 ? (
              <div className="brand-card">
                <div className="brand-logo-wrap">
                  <div className="brand-fallback" style={{ display: 'flex' }}>
                    No Brands Available
                  </div>
                </div>
                <span className="brand-name">No Brands Available</span>
              </div>
            ) : allBrands.map((brand, index) => (
              <div key={`${brand.id}-${index}`} className="brand-card">
                <div className="brand-logo-wrap" style={{ '--brand-color': brand.color }}>
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="brand-logo-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.querySelector('.brand-fallback').style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="brand-fallback" style={{ color: brand.color }}>
                    {brand.name}
                  </div>
                </div>
                <span className="brand-name">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="brand-slider-control brand-slider-control-next"
          onClick={() => scrollBrands(1)}
          aria-label="Scroll brands forward"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
};

export default BrandSlider;
