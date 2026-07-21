import React, { useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import SectionHeading from './SectionHeading';
import { Quote, Star } from 'lucide-react';
import { getActiveTestimonials, getTestimonials } from '../../services/testimonialService';
import 'swiper/css';
import 'swiper/css/pagination';

const fallbackReviews = [
  {
    id: 'fallback-1',
    name: 'Rajesh Kumar',
    role: 'Professional Farmer',
    text: 'The industrial tools from Shyam Agro have completely transformed my farming efficiency. The quality is top-notch and the service is excellent.',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 5,
  },
  {
    id: 'fallback-2',
    name: 'Anita Sharma',
    role: 'Agro-Enterprise Owner',
    text: 'I have been using their agricultural machinery for over a year now. Extremely durable and high-performing. Best value for money in the industrial market.',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
  },
  {
    id: 'fallback-3',
    name: 'Suresh Singh',
    role: 'Workshop Owner',
    text: 'Outstanding power tools. The performance is consistent even under heavy load. Highly recommend to any professional looking for reliable machinery.',
    image: 'https://randomuser.me/api/portraits/men/67.jpg',
    rating: 5,
  },
];

const getInitials = (name = 'Customer') => (
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'C'
);

const Testimonials = () => {
  const [apiReviews, setApiReviews] = useState([]);
  const [failedImageIds, setFailedImageIds] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadTestimonials = async () => {
      try {
        let testimonials = await getActiveTestimonials();

        if (testimonials.length === 0) {
          testimonials = (await getTestimonials()).filter((testimonial) => testimonial.isActive !== false);
        }

        if (isMounted) {
          setApiReviews(testimonials);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Unable to load testimonials.', error);
        }
        if (isMounted) {
          setApiReviews([]);
        }
      }
    };

    loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  const reviews = useMemo(
    () => (apiReviews.length > 0 ? apiReviews : fallbackReviews),
    [apiReviews]
  );

  return (
    <section className="relative overflow-hidden bg-light px-3 py-5 md:px-5 lg:px-6">
      {/* Decorative Quote Icon Background */}
      <div className="absolute top-10 left-10 text-primary opacity-5">
        <Quote size={90} />
      </div>

      <div className="max-w-[1440px] mx-auto relative z-10">
        <SectionHeading title="WHAT OUR CLIENTS SAY" subtitle="TESTIMONIALS" />

        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          autoplay={{ delay: 4000 }}
          pagination={{ clickable: true }}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-5"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id}>
              <div className="flex min-h-[220px] flex-col items-center bg-white p-6 text-center rounded-xl border border-gray-100/80 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/20 relative group">
                <Quote size={22} className="mb-2 text-primary/20" />
                {review.rating > 0 && (
                  <div className="mb-2 flex items-center justify-center gap-0.5 text-primary">
                    {Array.from({ length: Math.min(5, Math.round(review.rating)) }).map((_, index) => (
                      <Star key={`${review.id}-star-${index}`} size={13} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                )}
                <p className="mb-3 line-clamp-3 text-xs italic leading-5 text-gray-600">"{review.text}"</p>
                <div className="flex flex-col items-center">
                  {review.image && !failedImageIds[review.id] ? (
                    <img
                      src={review.image}
                      alt={review.name}
                      className="mb-2 h-10 w-10 rounded-full border-4 border-light object-cover"
                      onError={() => {
                        setFailedImageIds((current) => ({ ...current, [review.id]: true }));
                      }}
                    />
                  ) : (
                    <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-light bg-primary/10 text-xs font-bold text-primary">
                      {getInitials(review.name)}
                    </span>
                  )}
                  <h4 className="text-sm font-bold uppercase tracking-wide text-dark">{review.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{review.role}</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Testimonials;
