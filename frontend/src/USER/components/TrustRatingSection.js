import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './TrustRatingSection.css';

const trustSlides = [
  {
    id: 1,
    image: '/hero_banner.png',
    rating: '4.7',
    note: 'Trusted by 10,000+ customers for reliable agro machinery and support',
  },
  {
    id: 2,
    image: '/product-images/tractor-field-hero.png',
    rating: '4.9',
    note: 'Heavy duty tractors and power tillers engineered for peak efficiency',
  },
  {
    id: 3,
    image: '/product-images/sprayer-field-hero.png',
    rating: '4.8',
    note: 'High-pressure crop sprayers trusted by farmers nationwide',
  },
];

const TrustRatingSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? trustSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === trustSlides.length - 1 ? 0 : prev + 1));
  };

  const activeSlide = trustSlides[currentIndex];

  return (
    <section className="trust-rating-section relative w-full overflow-hidden select-none bg-[#0F3D2E]">
      {/* Full-width Edge-to-Edge Image */}
      <div className="relative w-full h-[360px] md:h-[480px] lg:h-[580px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={activeSlide.image}
              alt="Agro Machinery"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </motion.div>
        </AnimatePresence>

        {/* Left Navigation Arrow - Extreme Left Edge (24px Desktop, 16px Tablet, 12px Mobile) */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-[12px] md:left-[16px] lg:left-[24px] top-1/2 -translate-y-1/2 z-30 w-[48px] h-[48px] md:w-[56px] md:h-[56px] rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-2xl flex items-center justify-center transition-all duration-250 ease-out hover:scale-110 hover:bg-[#58B82E] hover:border-[#58B82E] hover:text-white hover:shadow-[0_0_20px_rgba(88,184,46,0.5)] cursor-pointer active:scale-95"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={28} className="stroke-[2.5]" />
        </button>

        {/* Right Navigation Arrow - Extreme Right Edge (24px Desktop, 16px Tablet, 12px Mobile) */}
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-[12px] md:right-[16px] lg:right-[24px] top-1/2 -translate-y-1/2 z-30 w-[48px] h-[48px] md:w-[56px] md:h-[56px] rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-2xl flex items-center justify-center transition-all duration-250 ease-out hover:scale-110 hover:bg-[#58B82E] hover:border-[#58B82E] hover:text-white hover:shadow-[0_0_20px_rgba(88,184,46,0.5)] cursor-pointer active:scale-95"
          aria-label="Next Slide"
        >
          <ChevronRight size={28} className="stroke-[2.5]" />
        </button>

        {/* Bottom Floating Rating Badge & Note Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 text-center">
          <div className="mx-auto w-fit rounded-full bg-white/90 backdrop-blur-md px-6 py-2 shadow-2xl border border-white/50 flex items-center gap-2 mb-3">
            <div className="flex gap-1 text-yellow-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span className="text-xs font-black uppercase text-dark tracking-wider">
              <strong className="text-sm font-black text-[#58B82E]">{activeSlide.rating}</strong> out of 5
            </span>
          </div>
          <p className="text-white text-base sm:text-lg md:text-xl font-extrabold drop-shadow-md leading-snug">
            {activeSlide.note}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustRatingSection;
