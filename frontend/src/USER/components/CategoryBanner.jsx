import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DEFAULT_CATEGORY_IMAGE,
  getCategoryImage,
} from '../../services/categoryService';
import './CategoryBanner.css';

const CategoryBanner = ({ category, title, description, t }) => {
  const [activeImage, setActiveImage] = useState(getCategoryImage(category?.imageUrl));
  const [activeVideo, setActiveVideo] = useState(category?.bannerVideo || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  const bannerTitle = title || category?.title || category?.name || '';
  const bannerDescription = description || category?.description || '';

  const breadcrumbItems = useMemo(
    () => [
      t?.('home') || 'HOME',
      t?.('ourCollections') || 'Our Collections',
      bannerTitle,
    ],
    [bannerTitle, t]
  );

  useEffect(() => {
    setIsLoaded(false);
    setIsVideoLoaded(false);
    setHasVideoError(false);
    setActiveImage(getCategoryImage(category?.imageUrl));
    setActiveVideo(category?.bannerVideo || '');
  }, [category?.imageUrl, category?.bannerVideo]);

  const handleImageError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        'Category image failed',
        category?.id,
        category?.imageUrl
      );
    }

    if (activeImage !== DEFAULT_CATEGORY_IMAGE) {
      setIsLoaded(false);
      setActiveImage(DEFAULT_CATEGORY_IMAGE);
    }
  };

  const handleVideoReady = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setHasVideoError(true);
    setIsVideoLoaded(false);
  };

  return (
    <section className="category-banner-live" aria-label={`${bannerTitle} category banner`}>
      <img
        key={activeImage}
        src={activeImage}
        alt={`${bannerTitle} banner`}
        className={`category-banner-live__image ${isLoaded ? 'is-loaded' : ''}`}
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
      />
      {activeVideo && !hasVideoError && (
        <video
          key={activeVideo}
          className={`category-banner-live__video ${isVideoLoaded ? 'is-loaded' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={activeImage}
          aria-hidden="true"
          onCanPlay={handleVideoReady}
          onLoadedData={handleVideoReady}
          onError={handleVideoError}
        >
          <source src={activeVideo} type="video/mp4" onError={handleVideoError} />
        </video>
      )}
      <div className="category-banner-live__overlay" aria-hidden="true" />
      <div className="category-banner-live__content">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="category-banner-live__breadcrumb"
        >
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={`${item}-${index}`}>
              <span className={index === breadcrumbItems.length - 1 ? 'is-active' : ''}>
                {index === breadcrumbItems.length - 1 ? item.toUpperCase() : item}
              </span>
              {index < breadcrumbItems.length - 1 && <span className="category-banner-live__slash">/</span>}
            </React.Fragment>
          ))}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {bannerTitle}
        </motion.h1>
        {bannerDescription && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            {bannerDescription}
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default CategoryBanner;
