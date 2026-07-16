import React from 'react';
import { Star } from 'lucide-react';
import './TrustRatingSection.css';

const TrustRatingSection = () => {
  return (
    <section className="trust-rating-section">
      <div className="trust-rating-inner">
        <div className="trust-rating-art" aria-hidden="true">
          <img src="/hero_banner.png" alt="" />
        </div>

        <div className="trust-rating-card">
          <div className="trust-stars" aria-label="4.7 out of 5 rating">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={18} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
          <p><strong>4.7</strong> out of 5</p>
        </div>

        <p className="trust-rating-note">Trusted by 10,000+ customers for reliable agro machinery and support</p>
      </div>
    </section>
  );
};

export default TrustRatingSection;
