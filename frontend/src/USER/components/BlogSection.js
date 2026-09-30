import React, { useEffect, useMemo, useState } from 'react';
import SectionHeading from './SectionHeading';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getBlogImageUrl, getBlogs } from '../../services/blogService';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import './BlogSection.css';

const BlogImagePlaceholder = ({ label, className = '' }) => (
  <div
    className={`flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold uppercase tracking-widest text-gray-400 ${className}`}
    role="img"
    aria-label={label}
  >
    {label}
  </div>
);

const formatBlogDate = (publishDate, locale = 'en-IN') => {
  if (!publishDate || String(publishDate).startsWith('0001-01-01')) {
    return null;
  }

  const date = new Date(publishDate);
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1) {
    return null;
  }

  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const localizedImageKeys = (field, language) => {
  const fieldPascal = field.charAt(0).toUpperCase() + field.slice(1);
  const languagePascal = language.charAt(0).toUpperCase() + language.slice(1);

  return [
    `${field}_${language}`,
    `${field}_${language.toUpperCase()}`,
    `${field}${language.toUpperCase()}`,
    `${field}${languagePascal}`,
    `${fieldPascal}_${language}`,
    `${fieldPascal}_${language.toUpperCase()}`,
    `${fieldPascal}${language.toUpperCase()}`,
    `${fieldPascal}${languagePascal}`,
  ];
};

const getLocalizedBlogImageValue = (blog, language) => {
  if (!blog || !language || language === 'en') return '';
  const raw = blog.raw || {};
  const fields = ['coverImage', 'coverImageUrl', 'imageUrl', 'image', 'thumbnail'];

  for (const field of fields) {
    for (const key of localizedImageKeys(field, language)) {
      const value = blog[key] ?? raw[key];
      if (value) return value;
    }
  }

  const translationsBlock = blog.translations || raw.translations || blog.i18n || raw.i18n;
  for (const field of fields) {
    const value = translationsBlock?.[language]?.[field] || translationsBlock?.[field]?.[language];
    if (value) return value;
  }

  return '';
};

const getLanguageAwareBlogImageUrl = (blog, language) => {
  const localizedImage = getLocalizedBlogImageValue(blog, language);
  return getBlogImageUrl(localizedImage) || blog.coverImageUrl || getBlogImageUrl(blog.coverImage);
};

const withBlogImageVersion = (url, blogId, language) => {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(blogId)}&lang=${encodeURIComponent(language || 'en')}`;
};

const BlogSection = () => {
  const { t, productText, dynamicText, activeLanguage } = useLanguage();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeBlog, setActiveBlog] = useState(null);
  const [failedImageIds, setFailedImageIds] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async () => {
      setLoading(true);
      setError('');

      try {
        const blogs = await getBlogs();

        if (isMounted) {
          setBlogs(blogs);
        }
      } catch {
        if (isMounted) {
          setBlogs([]);
          setError('unableLoadBlogs');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (blogs.length === 0) return;

    if (process.env.NODE_ENV === 'development') {
      console.table(blogs);
      blogs.forEach((blog) => {
        console.log({
          id: blog.id,
          title: blog.title,
          coverImage: blog.coverImage,
          imageUrl: blog.coverImageUrl || getBlogImageUrl(blog.coverImage),
        });
      });
    }
  }, [blogs]);

  const markImageAsFailed = (blog, failureKey = blog?.id) => {
    const imageUrl = blog.coverImageUrl || getBlogImageUrl(blog.coverImage);

    if (process.env.NODE_ENV === 'development') {
      console.error(`Blog image failed: ${imageUrl}`);
    }

    setFailedImageIds((current) => ({
      ...current,
      [failureKey]: true,
    }));
  };

  const relatedProducts = useMemo(() => {
    return [];
  }, []);

  const dateLocale = activeLanguage?.code === 'hi'
    ? 'hi-IN'
    : activeLanguage?.code === 'te'
      ? 'te-IN'
      : 'en-IN';
  const languageCode = activeLanguage?.code || 'en';

  useEffect(() => {
    if (!activeBlog) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActiveBlog(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeBlog]);

  return (
    <section className="bg-white px-3 py-5 md:px-5 lg:px-6">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeading
          title={t('blog.fromOurBlog')}
          subtitle={t('blog.latestNews')}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full py-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
              {t('loading')}
            </div>
          )}

          {!loading && blogs.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
              {error ? (
                <>
                  {t(error)}
                  <br />
                  {t('pleaseTryAgain')}
                </>
              ) : (
                t('noBlogsAvailable')
              )}
            </div>
          )}

          {!loading && blogs.map((blog, index) => {
            const blogImageUrl = getLanguageAwareBlogImageUrl(blog, languageCode);
            const formattedPublishDate = formatBlogDate(blog.publishDate, dateLocale);
            const imageFailureKey = `${blog.id}-${languageCode}-${blogImageUrl}`;
            const isImageAvailable = blogImageUrl && !failedImageIds[imageFailureKey];
            const title = dynamicText(blog, 'title');
            const summary = dynamicText(blog, 'summary');
            const authorName = dynamicText(blog, 'authorName');
            const category = dynamicText(blog, 'category');

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveBlog(blog)}
                className="group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setActiveBlog(blog);
                }}
              >
                <div className="relative mb-2 aspect-[16/8] overflow-hidden">
                  {isImageAvailable ? (
                    <img
                      key={imageFailureKey}
                      src={withBlogImageVersion(blogImageUrl, blog.id, languageCode)}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={() => markImageAsFailed(blog, imageFailureKey)}
                    />
                  ) : (
                    <BlogImagePlaceholder label={t('imageNotAvailable')} />
                  )}
                  {formattedPublishDate && (
                    <div className="absolute left-3 top-3 bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl">
                      {formattedPublishDate}
                    </div>
                  )}
                </div>
                <div className="mb-2 flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    {t('blog.by')} {authorName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {category}
                  </div>
                </div>
                <h3 className="mb-2 text-base font-bold leading-tight text-dark transition-colors group-hover:text-primary">
                  {String(title || '').toUpperCase()}
                </h3>
                <p className="mb-3 line-clamp-2 text-xs leading-5 text-gray-500">{summary}</p>
                <button type="button" className="flex items-center gap-2 text-dark font-black text-xs uppercase tracking-widest hover:text-primary transition-colors group/btn">
                  {t('blog.readMore')} <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-2" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {activeBlog && (
        <div
          className="blog-modal-overlay"
          onClick={() => setActiveBlog(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="blog-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="blog-modal-header">
              <h3>{dynamicText(activeBlog, 'title')}</h3>
              <button
                type="button"
                onClick={() => setActiveBlog(null)}
                className="blog-modal-close"
                aria-label={t('blog.closeBlogDetails')}
              >
                <X size={22} />
              </button>
            </div>
            <div className="blog-modal-scroll">
              <div className="blog-modal-body">
                <div className="blog-modal-meta">
                  <span><User size={15} /> {t('blog.by')} {dynamicText(activeBlog, 'authorName')}</span>
                  {formatBlogDate(activeBlog.publishDate, dateLocale) && (
                    <span>
                      <Calendar size={15} />
                      {formatBlogDate(activeBlog.publishDate, dateLocale)}
                    </span>
                  )}
                  <span>{dynamicText(activeBlog, 'category')}</span>
                </div>
                {(() => {
                  const activeBlogImageUrl = getLanguageAwareBlogImageUrl(activeBlog, languageCode);
                  const activeImageFailureKey = `${activeBlog.id}-${languageCode}-${activeBlogImageUrl}`;

                  return activeBlogImageUrl && !failedImageIds[activeImageFailureKey] ? (
                  <img
                    key={activeImageFailureKey}
                    src={withBlogImageVersion(activeBlogImageUrl, activeBlog.id, languageCode)}
                    alt={dynamicText(activeBlog, 'title')}
                    className="blog-modal-image"
                    onError={() => markImageAsFailed(activeBlog, activeImageFailureKey)}
                  />
                  ) : (
                  <BlogImagePlaceholder label={t('imageNotAvailable')} className="blog-modal-image" />
                  );
                })()}
                <p className="blog-tip-list" style={{ whiteSpace: 'pre-line' }}>
                  {dynamicText(activeBlog, 'description')}
                </p>
                <div className="blog-related-section">
                  <h4>{t('blog.relatedProducts')}</h4>
                  <div className="blog-related-track">
                    {relatedProducts.map((product) => (
                      <article
                        key={product.id}
                        className="blog-related-card"
                      >
                        <img src={getProductImage(product)} alt={productText(product, 'name')} onError={handleProductImageError} />
                        <div>
                          <h5>{productText(product, 'name')}</h5>
                          <p>{product.price}</p>
                          <button type="button">
                            {t('blog.viewProduct')}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default BlogSection;
