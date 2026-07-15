import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const OfferBanners = () => {
  const navigate = useNavigate();
  const openFortyPercentCollection = () => navigate('/offers/40-percent');
  const openPowerTillersCollection = () => navigate('/power-tillers');

  return (
    <section className="section-padding bg-white">
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
            src="/product-images/sprayer-field-hero.png" 
            alt="Offer 1" 
            className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-start justify-center p-5 text-white md:p-7">
            <span className="mb-2 bg-primary px-3 py-1 text-[9px] font-black uppercase tracking-[2px] text-white">Special Offer</span>
            <h3 className="mb-2 text-2xl font-bold leading-tight md:text-3xl">PREMIUM FARMING<br/>TOOLS 40% OFF & ABOVE</h3>
            <p className="mb-4 max-w-sm text-sm font-light text-gray-300">Equip your farm with the best industrial tools at unbeatable prices this season.</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFortyPercentCollection();
              }}
              className="btn-primary cursor-pointer"
            >
              SHOP COLLECTION
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
            src="/product-images/tractor-field-hero.png" 
            alt="Offer 2" 
            className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-start justify-center p-5 text-white md:p-7">
            <span className="mb-2 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[2px] text-dark">Power Tillers</span>
            <h3 className="mb-2 text-2xl font-bold leading-tight md:text-3xl">POWERFUL<br/>POWER TILLERS</h3>
            <p className="mb-4 max-w-sm text-sm font-light text-gray-300">Discover our newly launched range of high-performance industrial power tillers.</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openPowerTillersCollection();
              }}
              className="btn-outline hero-outline-btn border-white hover:bg-white hover:text-dark cursor-pointer"
            >
              EXPLORE NOW
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OfferBanners;
