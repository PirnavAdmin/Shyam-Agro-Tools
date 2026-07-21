import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import heroMachinery from '../../asset/hero-machinery.png';
import heroSprayers from '../../asset/hero-sprayers.png';

const Hero = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const slides = [
    {
      id: 1,
      image: heroMachinery,
      alt: 'Featured Machinery - Explore Powerful Farming Equipment',
      targetPath: '/categories',
    },
    {
      id: 2,
      image: heroSprayers,
      alt: 'Advanced & Reliable Sprayers - Powerful Performance & Better Farming',
      targetPath: '/categories',
    },
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  // Auto play every 5 seconds with hover pause
  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        prevSlide();
      } else if (event.key === 'ArrowRight') {
        nextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const activeSlide = slides[currentSlide];

  return (
    <section
      className="hero-slider relative w-full h-[240px] sm:h-[360px] md:h-[480px] lg:h-[580px] xl:h-[640px] overflow-hidden bg-[#0A261D] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Carousel"
    >
      {/* Full Bleed Edge-to-Edge Hero Banner Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={() => navigate(activeSlide.targetPath)}
          className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-[#0F3D2E]"
        >
          <img
            src={activeSlide.image}
            alt={activeSlide.alt}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* Previous Arrow Button - Left edge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-[12px] md:left-[20px] lg:left-[28px] top-1/2 -translate-y-1/2 z-30 w-[42px] h-[42px] md:w-[54px] md:h-[54px] rounded-full bg-black/30 hover:bg-[#58B82E] backdrop-blur-md border border-white/30 text-white shadow-2xl flex items-center justify-center transition-all duration-250 ease-out hover:scale-110 hover:border-[#58B82E] hover:shadow-[0_0_24px_rgba(88,184,46,0.6)] cursor-pointer active:scale-95"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={26} className="stroke-[2.5]" />
      </button>

      {/* Next Arrow Button - Right edge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-[12px] md:right-[20px] lg:right-[28px] top-1/2 -translate-y-1/2 z-30 w-[42px] h-[42px] md:w-[54px] md:h-[54px] rounded-full bg-black/30 hover:bg-[#58B82E] backdrop-blur-md border border-white/30 text-white shadow-2xl flex items-center justify-center transition-all duration-250 ease-out hover:scale-110 hover:border-[#58B82E] hover:shadow-[0_0_24px_rgba(88,184,46,0.6)] cursor-pointer active:scale-95"
        aria-label="Next Slide"
      >
        <ChevronRight size={26} className="stroke-[2.5]" />
      </button>

      {/* Pagination Indicator Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5 items-center">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              index === currentSlide
                ? 'w-8 h-2.5 bg-[#58B82E] shadow-lg scale-105'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80 backdrop-blur-sm'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
