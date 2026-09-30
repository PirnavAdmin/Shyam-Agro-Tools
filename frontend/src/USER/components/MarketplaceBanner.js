import React, { useEffect, useRef, useState } from 'react';
import { Award, Headphones, PackageCheck, RefreshCw, ShieldCheck, Store, Truck, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './MarketplaceBanner.css';

const MarketplaceBanner = ({ enableFeatureDetails = false }) => {
  const { t } = useLanguage();
  const [activeBenefitId, setActiveBenefitId] = useState(null);
  const benefitsRef = useRef(null);

  const stats = [
    { icon: Users, value: '200,000+', label: t('customers') },
    { icon: Store, value: '500+', label: t('brandStore') },
    { icon: PackageCheck, value: '20,000+', label: t('products') },
  ];

  const benefits = [
    {
      id: 'easy-returns',
      icon: RefreshCw,
      label: t('easyReturns'),
      points: [
        '7-day easy return support',
        'Return accepted for damaged or wrong products',
        'Quick replacement process',
      ],
    },
    {
      id: 'quality-assurance',
      icon: Award,
      label: t('qualityAssurance'),
      points: [
        'Products tested before delivery',
        'Durable agriculture equipment',
        'Manufacturer warranty available',
      ],
    },
    {
      id: 'trusted-delivery',
      icon: ShieldCheck,
      label: t('trustedDelivery'),
      points: [
        'Safe packaging',
        'Fast and reliable delivery',
        'Order tracking available',
      ],
    },
    {
      id: 'after-sales-assistance',
      icon: Headphones,
      label: t('afterSalesAssistance'),
      points: [
        'Service support after purchase',
        'Spare parts guidance',
        'Help with product usage',
      ],
    },
  ];

  useEffect(() => {
    if (!enableFeatureDetails || !activeBenefitId) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!benefitsRef.current?.contains(event.target)) {
        setActiveBenefitId(null);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, [activeBenefitId, enableFeatureDetails]);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-3 py-6 md:px-5 lg:px-8">
      <div className="marketplace-banner-panel rounded-sm border border-[#cfece6] bg-[#e1f6f3]">
        <div className="px-4 py-4 text-center">
          <h2 className="flex items-center justify-center gap-2 text-base font-semibold text-[#134d49] md:text-lg">
            <span className="icon-shade icon-yellow h-7 w-7">
              <Truck size={16} />
            </span>
            {t('marketplaceTitle')}
          </h2>
          <div className="mx-auto mt-4 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center justify-center gap-2 text-[#134d49]">
                <span className="icon-shade icon-teal"><Icon size={20} strokeWidth={1.6} /></span>
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold">{value}</div>
                  <div className="text-xs font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={benefitsRef} className="marketplace-benefits grid grid-cols-2 bg-[#0f4540] text-white sm:grid-cols-4">
          {benefits.map(({ id, icon: Icon, label, points }) => {
            const isActive = activeBenefitId === id;
            const content = (
              <>
                <span className={`marketplace-benefit-icon-shell ${isActive ? 'is-active' : ''}`}>
                  <span className={`marketplace-benefit-icon icon-shade icon-grey ${isActive ? 'is-active' : ''}`}>
                    <Icon size={22} />
                  </span>
                </span>
                <span className="text-xs font-medium">{label}</span>
              </>
            );

            if (!enableFeatureDetails) {
              return (
                <div key={id} className="marketplace-benefit-item flex min-h-20 flex-col items-center justify-center gap-2 px-3 py-3 text-center">
                  {content}
                </div>
              );
            }

            return (
              <div key={id} className="marketplace-benefit-wrap">
                <button
                  type="button"
                  className={`marketplace-benefit-button flex min-h-20 flex-col items-center justify-center gap-2 px-3 py-3 text-center ${
                    isActive ? 'is-active' : ''
                  }`}
                  onClick={() => setActiveBenefitId((currentId) => (currentId === id ? null : id))}
                  aria-expanded={isActive}
                  aria-controls={`marketplace-benefit-details-${id}`}
                >
                  {content}
                </button>

                {isActive && (
                  <div
                    id={`marketplace-benefit-details-${id}`}
                    className="marketplace-benefit-popover"
                    role="dialog"
                    aria-label={label}
                  >
                    <h3>{label}</h3>
                    <ul>
                      {points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MarketplaceBanner;
