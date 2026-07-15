import axios from '../api/axios';

export const TESTIMONIAL_API_BASE_URL = (
  process.env.REACT_APP_TESTIMONIAL_API_BASE_URL ||
  process.env.REACT_APP_CART_CHECKOUT_API_BASE_URL ||
  'https://wildlife-unwieldy-devotee.ngrok-free.dev'
).replace(/\/$/, '');

const TESTIMONIAL_ENDPOINT = `${TESTIMONIAL_API_BASE_URL}/api/Testimonials`;

const requestConfig = {
  skipAuth: true,
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  },
};

let testimonialsRequest;
let activeTestimonialsRequest;

const getFirstValue = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

export const getTestimonialImageUrl = (image) => {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return '';
  }

  if (image.startsWith('http') || image.startsWith('data:image') || image.startsWith('blob:')) {
    return image;
  }

  return `${TESTIMONIAL_API_BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
};

export const normalizeTestimonial = (testimonial = {}, index = 0) => {
  const image = getFirstValue(testimonial, [
    'imageUrl',
    'ImageUrl',
    'imageURL',
    'ImageURL',
    'photoUrl',
    'PhotoUrl',
    'profileImage',
    'ProfileImage',
    'customerImage',
    'CustomerImage',
    'image',
    'Image',
    'photo',
    'Photo',
  ]);

  return {
    id: String(getFirstValue(testimonial, ['id', 'Id', 'testimonialId', 'TestimonialId']) || `testimonial-${index}`),
    name: getFirstValue(testimonial, ['name', 'Name', 'customerName', 'CustomerName', 'clientName', 'ClientName']) || 'Customer',
    role: getFirstValue(testimonial, ['role', 'Role', 'designation', 'Designation', 'profession', 'Profession', 'title', 'Title']) || 'Customer',
    text: getFirstValue(testimonial, ['text', 'Text', 'message', 'Message', 'review', 'Review', 'content', 'Content', 'description', 'Description']),
    rating: Number(getFirstValue(testimonial, ['rating', 'Rating', 'stars', 'Stars'])) || 0,
    image: getTestimonialImageUrl(image),
    isActive: testimonial.isActive ?? testimonial.IsActive ?? testimonial.active ?? testimonial.Active,
    raw: testimonial,
  };
};

const extractTestimonials = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.testimonials)) return data.testimonials;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.testimonials)) return data.data.testimonials;
  return [];
};

const normalizeTestimonialsResponse = (data, { activeOnly = false } = {}) => {
  const items = extractTestimonials(data)
    .map(normalizeTestimonial)
    .filter((testimonial) => testimonial.text);

  return activeOnly
    ? items.filter((testimonial) => testimonial.isActive !== false)
    : items;
};

export const getTestimonials = async () => {
  if (!testimonialsRequest) {
    testimonialsRequest = axios.get(TESTIMONIAL_ENDPOINT, requestConfig).finally(() => {
      testimonialsRequest = null;
    });
  }

  const response = await testimonialsRequest;
  return normalizeTestimonialsResponse(response.data);
};

export const getActiveTestimonials = async () => {
  if (!activeTestimonialsRequest) {
    activeTestimonialsRequest = axios.get(`${TESTIMONIAL_ENDPOINT}/active`, requestConfig).finally(() => {
      activeTestimonialsRequest = null;
    });
  }

  const response = await activeTestimonialsRequest;
  return normalizeTestimonialsResponse(response.data, { activeOnly: true });
};
