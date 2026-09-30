import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from './ProductCard';
import { getRelatedProducts } from '../../services/productService';

const EMPTY_EXCLUDE_IDS = [];

const RelatedProducts = ({ currentProduct, categoryName, excludeIds = EMPTY_EXCLUDE_IDS, title, limit = 4 }) => {
  const { t } = useLanguage();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [relatedError, setRelatedError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const productId = currentProduct?.rawId || currentProduct?.id;

    const loadRelatedProducts = async () => {
      if (!productId) return;

      setIsLoadingRelated(true);
      setRelatedError('');

      try {
        const productData = await getRelatedProducts(productId);
        const excludeSet = new Set([
          ...excludeIds.map(String),
          String(currentProduct.id),
          String(currentProduct.rawId || ''),
        ]);
        if (isMounted) {
          setRelatedProducts(productData.filter((product) => !excludeSet.has(String(product.id))).slice(0, limit));
        }
      } catch (error) {
        console.error('Unable to load related products.', error);
        if (isMounted) setRelatedError('Unable to load products.');
      } finally {
        if (isMounted) setIsLoadingRelated(false);
      }
    };

    loadRelatedProducts();

    return () => {
      isMounted = false;
    };
  }, [currentProduct, excludeIds, limit]);

  if (!currentProduct?.id) return null;

  return (
    <section className="mx-auto w-full max-w-[1440px] px-3 pb-4 pt-1 md:px-5 lg:px-6">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-base font-semibold uppercase tracking-widest text-dark">
          {title || t('relatedProducts')}
        </h2>
      </div>
      {isLoadingRelated ? (
        <p className="text-sm leading-6 text-gray-600">Loading...</p>
      ) : relatedError ? (
        <p className="text-sm leading-6 text-gray-600">{relatedError}</p>
      ) : relatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default RelatedProducts;
