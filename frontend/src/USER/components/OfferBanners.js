import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { getApiDomain } from '../../utils/apiConfig';

const API_URL = `${getApiDomain()}/api`;

const resolveBannerImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads')) {
    const apiDomain = getApiDomain();
    return `${apiDomain}${url}`;
  }
  return url;
};

const OfferBanners = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [promoBanners, setPromoBanners] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchPromoBanners = async () => {
      try {
        const response = await axios.get(`${API_URL}/Banners?type=Promo`);
        if (isMounted && response.data && Array.isArray(response.data) && response.data.length > 0) {
          setPromoBanners(response.data);
        }
      } catch (err) {
        // Fallback to static
      }
    };
    fetchPromoBanners();
    return () => { isMounted = false; };
  }, []);

  const openFortyPercentCollection = () => navigate('/offers/40-percent');
  const openPowerTillersCollection = () => navigate('/power-tillers');

  if (promoBanners.length > 0) {
    return (
      <section className="section-padding pb-0 bg-white">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 gap-3 md:grid-cols-2">
          {promoBanners.slice(0, 2).map((banner, index) => {
            const subtitleParts = (banner.subtitle || '').split('•');
            const kicker = subtitleParts.length > 1 ? subtitleParts[0].trim() : (index === 0 ? t('specialOffer') : t('powerTillers'));
            const description = subtitleParts.length > 1 ? subtitleParts.slice(1).join('•').trim() : banner.subtitle;
            const bgBadgeClass = index === 0 ? 'bg-primary text-white' : 'bg-white text-dark';
            const btnClass = index === 0 ? 'btn-primary' : 'btn-outline hero-outline-btn border-white hover:bg-white hover:text-dark';

            return (
              <motion.div
                key={banner.id || index}
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                onClick={() => navigate(banner.targetUrl || '/categories')}
                className="relative group overflow-hidden h-[220px] bg-dark md:h-[260px] cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(banner.targetUrl || '/categories');
                }}
              >
                <img
                  src={resolveBannerImage(banner.imageUrl)}
                  alt={banner.title || `Offer ${index + 1}`}
                  className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 z-10 flex flex-col items-start justify-center p-5 text-white md:p-7">
                  <span className={`mb-2 px-3 py-1 text-[9px] font-black uppercase tracking-[2px] ${bgBadgeClass}`}>
                    {kicker}
                  </span>
                  <h3 className="mb-2 text-2xl font-bold leading-tight md:text-3xl whitespace-pre-line">
                    {banner.title}
                  </h3>
                  {description && (
                    <p className="mb-4 max-w-sm text-sm font-light text-gray-300">
                      {description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(banner.targetUrl || '/categories');
                    }}
                    className={`${btnClass} cursor-pointer`}
                  >
                    {index === 0 ? t('shopCollection') : t('exploreNow')}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding pb-0 bg-white">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Banner 1 */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          onClick={openFortyPercentCollection}
          className="relative group overflow-hidden h-[220px] bg-dark md:h-[260px]"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') openFortyPercentCollection();
          }}
        >
          <img 
            src="/hero_banner.png" 
            alt="Offer 1" 
            className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-start justify-center p-5 text-white md:p-7">
            <span className="mb-2 bg-primary px-3 py-1 text-[9px] font-black uppercase tracking-[2px] text-white">
              {t('specialOffer')}
            </span>
            <h3 className="mb-2 text-2xl font-bold leading-tight md:text-3xl whitespace-pre-line">
              {t('premiumFarmingTools')}
            </h3>
            <p className="mb-4 max-w-sm text-sm font-light text-gray-300">
              {t('premiumFarmingToolsDesc')}
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFortyPercentCollection();
              }}
              className="btn-primary cursor-pointer"
            >
              {t('shopCollection')}
            </button>
          </div>
        </motion.div>

        {/* Banner 2 */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          onClick={openPowerTillersCollection}
          className="relative group overflow-hidden h-[220px] bg-dark md:h-[260px]"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') openPowerTillersCollection();
          }}
        >
          <img 
            src="/power-tiller-banner.jpg" 
            alt="Offer 2" 
            className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-start justify-center p-5 text-white md:p-7">
            <span className="mb-2 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[2px] text-dark">
              {t('powerTillers')}
            </span>
            <h3 className="mb-2 text-2xl font-bold leading-tight md:text-3xl whitespace-pre-line">
              {t('powerfulPowerTillers')}
            </h3>
            <p className="mb-4 max-w-sm text-sm font-light text-gray-300">
              {t('powerfulPowerTillersDesc')}
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openPowerTillersCollection();
              }}
              className="btn-outline hero-outline-btn border-white hover:bg-white hover:text-dark cursor-pointer"
            >
              {t('exploreNow')}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OfferBanners;
