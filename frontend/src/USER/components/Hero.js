import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      id: 1,
      image: '/hero_banner.png',
      titleKey: 'hero.sprayer.title',
      subtitleKey: 'hero.sprayer.subtitle',
      descriptionKey: 'hero.sprayer.description',
      btn1Path: '/category/sprayers-units',
      btn2Path: '/offers'
    },
    {
      id: 2,
      image: '/hero_banner.png',
      titleKey: 'hero.tractor.title',
      subtitleKey: 'hero.tractor.subtitle',
      descriptionKey: 'hero.tractor.description',
      btn1Path: '/category/heavy-machinery',
      btn2Path: '/offers'
    }
  ];
  const activeSlide = slides[currentSlide];

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setCurrentSlide((slideIndex) => (slideIndex === slides.length - 1 ? 0 : slideIndex + 1));
    }, 4200);

    return () => window.clearInterval(slideTimer);
  }, [slides.length]);

  return (
    <section className="hero-slider relative h-[300px] max-h-[50vh] min-h-[280px] w-full cursor-default overflow-hidden bg-[#0F3D2E] sm:h-[320px] lg:h-[360px]">
      <div className="relative flex h-full w-full items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            key={activeSlide.image}
            src={activeSlide.image}
            alt={t(activeSlide.titleKey)}
            className="hero-slider-image h-full w-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F3D2E]/95 via-[#0F3D2E]/78 to-[#0F3D2E]/38"></div>
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-16">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.58, ease: 'easeOut' }}
            className="max-w-xl text-white"
          >
            <motion.span
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="mb-2 inline-block border-l-4 border-primary bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[3px] text-[#a7ef8a] backdrop-blur-md sm:text-xs"
            >
              {t(activeSlide.subtitleKey)}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="mb-2 cursor-default select-none caret-transparent text-3xl font-bold leading-tight drop-shadow-2xl sm:text-4xl lg:text-5xl"
            >
              {t(activeSlide.titleKey)}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 max-w-lg text-sm font-light leading-6 text-gray-100 sm:text-base"
            >
              {t(activeSlide.descriptionKey)}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="flex flex-wrap gap-2.5"
            >
              <button
                type="button"
                onClick={() => navigate(activeSlide.btn1Path)}
                className="btn-primary min-w-[132px] cursor-pointer py-2.5 text-xs"
              >
                {t('exploreNow')}
              </button>
              <button
                type="button"
                onClick={() => navigate(activeSlide.btn2Path)}
                className="hero-offers-btn min-w-[132px] cursor-pointer py-2.5 text-xs"
              >
                {t('offers')}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style jsx="true">{`
        .hero-slider-image {
          animation: heroFadeSlide 0.72s ease both;
        }
        .hero-offers-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
          border-radius: 50px;
          background: #ffffff;
          color: #0F3D2E;
          padding: 10px 32px;
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
          transition: background-color 0.22s ease, color 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
        }
        [data-theme="dark"] .hero-slider .hero-offers-btn {
          background: #ffffff !important;
          color: #0F3D2E !important;
          border: 2px solid #ffffff !important;
          box-shadow: 0 6px 18px rgba(255, 255, 255, 0.18) !important;
        }
        .hero-offers-btn:hover,
        .hero-offers-btn:focus-visible {
          border-color: #58B82E;
          background: #58B82E;
          color: #ffffff;
          transform: translateY(-1px);
        }
        [data-theme="dark"] .hero-slider .hero-offers-btn:hover,
        [data-theme="dark"] .hero-slider .hero-offers-btn:focus-visible {
          background: #58B82E !important;
          color: #ffffff !important;
          border-color: #58B82E !important;
        }
        @keyframes heroFadeSlide {
          from {
            opacity: 0;
            transform: translateX(18px) scale(1.02);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
