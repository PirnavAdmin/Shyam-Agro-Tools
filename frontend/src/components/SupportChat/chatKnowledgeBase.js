const option = (id, label, question, extra = {}) => ({
  id,
  label,
  question: question || label,
  ...extra,
});

export const mainOptions = [
  option('main-track-order', 'Track Order', 'Track Order'),
  option('main-payment-issue', 'Payment Issue', 'Payment Issue'),
  option('main-product-help', 'Product Help', 'Product Help'),
  option('main-delivery-issue', 'Delivery Issue', 'Delivery Issue'),
  option('main-return-refund', 'Return/Refund', 'Return/Refund'),
  option('main-technical-issue', 'Technical Issue', 'Technical Issue'),
  option('main-raise-ticket', 'Raise Ticket', null, { action: 'ticket', issueType: 'Other' }),
];

export const finalOptions = [
  option('final-solved', 'Issue Solved', null, { action: 'solved' }),
  option('final-ticket', 'Raise Ticket', null, { action: 'ticket', issueType: 'Other' }),
  option('final-main-menu', 'Main Menu', null, { action: 'menu' }),
];

const ticketOption = (id, label, issueType) =>
  option(id, label, null, { action: 'ticket', issueType });

export const chatKnowledgeBase = [
  {
    id: 'greeting',
    question: 'Hello',
    keywords: ['hi', 'hello', 'hey', 'hai', 'namaste'],
    answer: 'Hello! Welcome to Shyam Agro Support. How can I help you today?',
    options: mainOptions,
  },
  {
    id: 'track-order',
    question: 'Track Order',
    keywords: ['track', 'tracking', 'order status', 'track order'],
    answer: 'Please enter your Order ID here, and I will show the tracking details inside this chat.',
    options: [
      option('track-order-id', 'Where is my Order?', 'Where is my Order?'),
      option('track-status-delay', 'Order status not updating', 'Order status not updating'),
      option('track-change-address', 'Change delivery address', 'Change delivery address'),
      ticketOption('track-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'order-id',
    question: 'Where is my Order?',
    keywords: ['order id', 'order number', 'where is my order', 'where is my order id'],
    answer: 'Find your Order ID on:\n- Order success page\n- My Orders page\n- Invoice or confirmation message',
    options: [
      option('order-id-track-page', 'Open Track Order page', 'Track shipment'),
      option('order-id-status-help', 'Status still not clear', 'Order status not updating'),
      ticketOption('order-id-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'order-status-not-updating',
    question: 'Order status not updating',
    keywords: ['status not updating', 'tracking not updating', 'not updating'],
    answer: 'Tracking may update after courier scan.\n- Wait a few hours\n- Check Track Order again\n- Raise a ticket if delivery date passed',
    options: [
      option('status-delivery-time', 'Check delivery time', 'Delivery time'),
      option('status-address-check', 'Verify delivery address', 'Change delivery address'),
      ticketOption('status-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'track-shipment',
    question: 'Track shipment',
    keywords: ['shipment', 'track shipment'],
    answer: 'Open Track Order and enter your Order ID to see the latest shipment status.',
    options: [
      option('shipment-order-id', 'Find my order', 'Where is my Order?'),
      option('shipment-delivery-time', 'Delivery time', 'Delivery time'),
      ticketOption('shipment-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'payment-issue',
    question: 'Payment Issue',
    keywords: ['payment', 'payment failed', 'payment issue', 'failed', 'deducted'],
    answer: 'If payment failed:\n- Check internet connection\n- Confirm bank/UPI status\n- Retry once\n- Try another payment method',
    options: [
      option('payment-deducted-option', 'Payment deducted but order not placed', 'Payment deducted but order not placed'),
      option('payment-refund-option', 'Refund status', 'Refund status'),
      option('payment-cod-option', 'COD availability', 'COD availability'),
      ticketOption('payment-ticket', 'Raise payment ticket', 'Payment Issue'),
    ],
  },
  {
    id: 'payment-deducted',
    question: 'Payment deducted but order not placed',
    keywords: ['deducted', 'money deducted', 'order not placed'],
    answer: 'Please check My Orders after a few minutes. If the order is missing, keep your transaction ID ready.',
    options: [
      option('deducted-refund-status', 'Check refund status', 'Refund status'),
      option('deducted-track-order', 'Check My Orders', 'Track Order'),
      ticketOption('deducted-ticket', 'Raise payment ticket', 'Payment Issue'),
    ],
  },
  {
    id: 'refund-status',
    question: 'Refund status',
    keywords: ['refund status', 'refund not received', 'refund'],
    answer: 'Refunds are processed after payment verification or return approval. Keep your Order ID or payment reference ready.',
    options: [
      option('refund-return-eligibility', 'Check return eligibility', 'Return eligibility'),
      option('refund-payment-deducted', 'Payment was deducted', 'Payment deducted but order not placed'),
      ticketOption('refund-ticket', 'Raise refund ticket', 'Return/Refund Issue'),
    ],
  },
  {
    id: 'cod',
    question: 'COD availability',
    keywords: ['cod', 'cash on delivery'],
    answer: 'Cash on Delivery is available for eligible products and locations. Check the COD Available badge on the product page.',
    options: [
      option('cod-place-order', 'How to place order', 'How do I place an order?'),
      option('cod-stock-check', 'Check stock status', 'Product out of stock'),
      ticketOption('cod-ticket', 'Ask payment support', 'Payment Issue'),
    ],
  },
  {
    id: 'product-help',
    question: 'Product Help',
    keywords: ['product', 'specification', 'specifications', 'product help'],
    answer: 'On the product details page, you can check images, videos, specifications, stock status, price, and reviews.',
    options: [
      option('product-compare', 'How to compare products', 'How to compare products'),
      option('product-specs', 'Check specifications', 'Check product specifications'),
      option('product-media', 'Image or video issue', 'Images/videos not loading'),
      option('product-stock', 'Stock availability', 'Product out of stock'),
    ],
  },
  {
    id: 'compare-products',
    question: 'How to compare products',
    keywords: ['compare'],
    answer: 'You can compare products by price, specifications, rating, stock, delivery estimate, images, and reviews.',
    options: [
      option('compare-specs', 'Compare by specifications', 'Compare by specifications'),
      option('compare-price', 'Compare by price', 'Compare by price'),
      option('compare-reviews', 'Compare by reviews', 'Compare by reviews'),
      ticketOption('compare-expert', 'Need expert help', 'Product Issue'),
    ],
  },
  {
    id: 'compare-specifications',
    question: 'Compare by specifications',
    keywords: ['compare by specifications', 'check product specifications'],
    answer: 'Open product detail pages and compare:\n- Size and material\n- Power and weight\n- Warranty\n- Suitable usage',
    options: [
      option('compare-spec-stock', 'Check stock status', 'Product out of stock'),
      option('compare-spec-reviews', 'View product reviews', 'Compare by reviews'),
      ticketOption('compare-spec-expert', 'Ask product expert', 'Product Issue'),
      option('compare-spec-back', 'Back to Product Help', 'Product Help'),
    ],
  },
  {
    id: 'compare-price',
    question: 'Compare by price',
    keywords: ['compare by price', 'price compare'],
    answer: 'Compare selling price, MRP, discount, delivery charge, and available COD/payment options before buying.',
    options: [
      option('price-stock', 'Check stock status', 'Product out of stock'),
      option('price-payment', 'Payment options', 'Payment Issue'),
      ticketOption('price-expert', 'Ask product expert', 'Product Issue'),
    ],
  },
  {
    id: 'compare-reviews',
    question: 'Compare by reviews',
    keywords: ['compare by reviews', 'product reviews', 'reviews'],
    answer: 'Use reviews to check real buyer feedback on quality, usage, delivery, and performance.',
    options: [
      option('review-specs', 'Compare specifications too', 'Compare by specifications'),
      option('review-stock', 'Check stock status', 'Product out of stock'),
      ticketOption('review-expert', 'Ask product expert', 'Product Issue'),
    ],
  },
  {
    id: 'product-image',
    question: 'Product image not showing',
    keywords: ['image', 'photo', 'not showing', 'not loading'],
    answer: 'Try these steps:\n- Refresh the page\n- Check internet connection\n- Reopen the product page',
    options: [
      option('image-video-help', 'Video also not loading', 'Product video unavailable'),
      option('image-cache-help', 'Clear browser cache', 'Images/videos not loading'),
      ticketOption('image-ticket', 'Raise technical ticket', 'Technical Issue'),
    ],
  },
  {
    id: 'product-video',
    question: 'Product video unavailable',
    keywords: ['video', 'video unavailable', 'not playing'],
    answer: 'Some products may not have videos. If a video is available but not playing, refresh the page or try a stable connection.',
    options: [
      option('video-image-help', 'Images also not loading', 'Product image not showing'),
      option('video-product-info', 'Check product details instead', 'Product Help'),
      ticketOption('video-ticket', 'Raise technical ticket', 'Technical Issue'),
    ],
  },
  {
    id: 'images-videos',
    question: 'Images/videos not loading',
    keywords: ['images/videos', 'images videos', 'media not loading'],
    answer: 'For media issues:\n- Refresh once\n- Check network speed\n- Clear browser cache\n- Reopen the product page',
    options: [
      option('media-image-specific', 'Only image issue', 'Product image not showing'),
      option('media-video-specific', 'Only video issue', 'Product video unavailable'),
      ticketOption('media-ticket', 'Raise technical ticket', 'Technical Issue'),
    ],
  },
  {
    id: 'out-of-stock',
    question: 'Product out of stock',
    keywords: ['out of stock', 'stock', 'stock availability', 'in stock'],
    answer: 'In Stock means you can order now. Out of Stock means the product is temporarily unavailable.',
    options: [
      option('stock-wishlist', 'Save to wishlist', 'How do I add products to wishlist?'),
      option('stock-compare', 'Compare available products', 'How to compare products'),
      ticketOption('stock-expert', 'Ask product expert', 'Product Issue'),
    ],
  },
  {
    id: 'delivery-issue',
    question: 'Delivery Issue',
    keywords: ['delivery', 'delayed', 'shipment', 'address'],
    answer: 'Delivery usually takes 3-7 business days depending on location and product availability.',
    options: [
      option('delivery-delayed', 'Delayed delivery', 'Delayed delivery'),
      option('delivery-track', 'Track shipment', 'Track shipment'),
      option('delivery-address', 'Change address', 'Change delivery address'),
      ticketOption('delivery-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'delivery-time',
    question: 'Delivery time',
    keywords: ['delivery time', 'how long delivery', 'how long does delivery take'],
    answer: 'Most orders arrive in 3-7 business days. Remote locations or heavy tools may take slightly longer.',
    options: [
      option('delivery-time-track', 'Track shipment', 'Track shipment'),
      option('delivery-time-address', 'Verify address', 'Change delivery address'),
      ticketOption('delivery-time-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'delayed-delivery',
    question: 'Delayed delivery',
    keywords: ['delayed delivery', 'late delivery'],
    answer: 'If delivery is delayed:\n- Check Track Order\n- Confirm address and phone number\n- Raise a ticket if estimate has passed',
    options: [
      option('delay-track-shipment', 'Track shipment', 'Track shipment'),
      option('delay-change-address', 'Change address', 'Change delivery address'),
      ticketOption('delay-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'change-address',
    question: 'Change delivery address',
    keywords: ['change address', 'delivery address', 'change delivery address'],
    answer: 'Address changes are possible only before dispatch. Raise a delivery ticket quickly with the correct address.',
    options: [
      option('address-track', 'Check dispatch status', 'Track shipment'),
      ticketOption('address-ticket', 'Raise delivery ticket', 'Delivery Issue'),
    ],
  },
  {
    id: 'return-refund',
    question: 'Return/Refund',
    keywords: ['return', 'refund', 'return refund'],
    answer: 'Returns are available for eligible products. Refunds are processed after product verification.',
    options: [
      option('return-start', 'Start return request', 'Start return request'),
      option('return-refund-status', 'Refund not received', 'Refund not received'),
      option('return-eligibility-option', 'Return eligibility', 'Return eligibility'),
      ticketOption('return-ticket', 'Raise return ticket', 'Return/Refund Issue'),
    ],
  },
  {
    id: 'start-return',
    question: 'Start return request',
    keywords: ['start return'],
    answer: 'To start a return, share Order ID, issue details, and product photos if the item is damaged or incorrect.',
    options: [
      option('start-return-eligibility', 'Check return eligibility', 'Return eligibility'),
      ticketOption('start-return-ticket', 'Raise return ticket', 'Return/Refund Issue'),
    ],
  },
  {
    id: 'return-eligibility',
    question: 'Return eligibility',
    keywords: ['return eligibility', 'eligible'],
    answer: 'Eligibility depends on product condition, return window, and support verification.',
    options: [
      option('eligibility-start-return', 'Start return request', 'Start return request'),
      option('eligibility-refund', 'Refund status', 'Refund status'),
      ticketOption('eligibility-ticket', 'Raise return ticket', 'Return/Refund Issue'),
    ],
  },
  {
    id: 'technical-issue',
    question: 'Technical Issue',
    keywords: ['technical', 'bug', 'not working', 'cache'],
    answer: 'For technical issues:\n- Refresh the page\n- Clear browser cache\n- Log in again\n- Try another browser if needed',
    options: [
      option('tech-language', 'Language not changing', 'Language not changing'),
      option('tech-cart', 'Cart not updating', 'Cart not updating'),
      option('tech-wishlist', 'Wishlist not working', 'Wishlist not working'),
      option('tech-media', 'Images/videos not loading', 'Images/videos not loading'),
    ],
  },
  {
    id: 'language',
    question: 'Language not changing',
    keywords: ['language', 'translate', 'translation'],
    answer: 'Try this:\n- Select language again\n- Wait for page text to update\n- Refresh once if old text remains',
    options: [
      option('language-cache', 'Clear browser cache', 'Technical Issue'),
      option('language-cart', 'Other page not updating', 'Technical Issue'),
      ticketOption('language-ticket', 'Raise technical ticket', 'Technical Issue'),
    ],
  },
  {
    id: 'cart',
    question: 'Cart not updating',
    keywords: ['cart'],
    answer: 'For cart issues:\n- Refresh the page\n- Check product stock\n- Log in again\n- Try adding the item once more',
    options: [
      option('cart-remove', 'Remove item from cart', 'How do I remove a product from cart?'),
      option('cart-wishlist', 'Wishlist also not working', 'Wishlist not working'),
      ticketOption('cart-ticket', 'Raise cart ticket', 'Cart/Wishlist Issue'),
    ],
  },
  {
    id: 'remove-cart',
    question: 'How do I remove a product from cart?',
    keywords: ['remove product from cart', 'remove from cart'],
    answer: 'Open Cart and click Remove for the product. Then refresh if the total does not update.',
    options: [
      option('remove-cart-refresh', 'Cart still not updating', 'Cart not updating'),
      ticketOption('remove-cart-ticket', 'Raise cart ticket', 'Cart/Wishlist Issue'),
    ],
  },
  {
    id: 'wishlist',
    question: 'Wishlist not working',
    keywords: ['wishlist', 'share'],
    answer: 'For wishlist/share issues:\n- Refresh the page\n- Allow browser storage\n- Allow clipboard/share permission\n- Try again after login',
    options: [
      option('wishlist-add', 'Add product to wishlist', 'How do I add products to wishlist?'),
      option('wishlist-cart', 'Cart also not updating', 'Cart not updating'),
      ticketOption('wishlist-ticket', 'Raise wishlist ticket', 'Cart/Wishlist Issue'),
    ],
  },
  {
    id: 'wishlist-add',
    question: 'How do I add products to wishlist?',
    keywords: ['add products to wishlist', 'add to wishlist'],
    answer: 'Click the heart icon on a product card or product details page to save the item.',
    options: [
      option('wishlist-add-not-working', 'Heart icon not working', 'Wishlist not working'),
      option('wishlist-product-help', 'View product details', 'Product Help'),
      ticketOption('wishlist-add-ticket', 'Raise wishlist ticket', 'Cart/Wishlist Issue'),
    ],
  },
  {
    id: 'place-order',
    question: 'How do I place an order?',
    keywords: ['place order', 'checkout', 'buy now'],
    answer: 'Add a product to cart or click Buy It Now, fill checkout details, choose payment, and confirm the order.',
    options: [
      option('place-payment', 'Payment issue', 'Payment Issue'),
      option('place-track', 'Track after order', 'Track Order'),
      ticketOption('place-ticket', 'Raise support ticket', 'Other'),
    ],
  },
  {
    id: 'ticket',
    question: 'Raise Ticket',
    keywords: ['ticket', 'raise ticket', 'support ticket'],
    answer: 'Please fill the ticket form with your contact details, issue type, subject, and message.',
    options: [ticketOption('ticket-open-form', 'Raise Ticket', 'Other')],
  },
];

const isGreeting = (question) => /^(hi|hello|hey|hai|namaste)\b/i.test(question.trim());

export const findAnswer = (question) => {
  if (isGreeting(question)) return chatKnowledgeBase[0];
  const normalized = question.toLowerCase();

  return (
    chatKnowledgeBase.find((entry) => entry.question.toLowerCase() === normalized) ||
    chatKnowledgeBase.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)))
  );
};
