import { getProductImage } from '../../utils/productImage';

const getAbsoluteUrl = (path) => {
  if (!path) {
    return window.location.href;
  }

  return new URL(path, window.location.origin).href;
};

const getProductUrl = (product) => getAbsoluteUrl(`/product/${product.id}`);

const getProductImageUrl = (product) => getAbsoluteUrl(getProductImage(product));

const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
};

export const shareProduct = async ({ product, productName }) => {
  if (!product?.id) {
    throw new Error('Product is missing');
  }

  const name = productName || product.displayName || product.name || 'Product';
  const productUrl = getProductUrl(product);
  const imageUrl = getProductImageUrl(product);
  const shareText = `${name}\n${imageUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: name,
        text: shareText,
        url: productUrl,
      });
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') {
        return 'cancelled';
      }

      console.error('Native product share failed, falling back to clipboard', error);
    }
  }

  await copyTextToClipboard(`${name}\n${productUrl}\n${imageUrl}`);
  return 'copied';
};
