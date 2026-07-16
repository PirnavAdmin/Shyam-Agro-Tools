import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useLanguage } from '../context/LanguageContext';
import './StaticInfoPages.css';

const contactRows = [
  {
    icon: Phone,
    label: 'Phone',
    value: '+91 9398649798',
    href: 'tel:+919398649798',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@shyamagrotools.com',
    href: 'mailto:support@shyamagrotools.com',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Shyam Agro Tools, Madhapur, Hyderabad - 520011',
  },
];

const contactRowsTranslations = {
  en: contactRows,
  te: [
    { icon: Phone, label: 'ఫోన్', value: '+91 9398649798', href: 'tel:+919398649798' },
    { icon: Mail, label: 'ఈమెయిల్', value: 'support@shyamagrotools.com', href: 'mailto:support@shyamagrotools.com' },
    { icon: MapPin, label: 'చిరునామా', value: 'శ్యామ్ ఆగ్రో టూల్స్, మాదాపూర్, హైదరాబాద్ - 520011' },
  ],
  hi: [
    { icon: Phone, label: 'फ़ोन', value: '+91 9398649798', href: 'tel:+919398649798' },
    { icon: Mail, label: 'ईमेल', value: 'support@shyamagrotools.com', href: 'mailto:support@shyamagrotools.com' },
    { icon: MapPin, label: 'पता', value: 'श्याम एग्रो टूल्स, माधापुर, हैदराबाद - 520011' },
  ]
};

const faqSections = [
  {
    title: 'General',
    items: [
      ['What is Shyam Agro Tools?', 'Shyam Agro Tools is an agriculture-focused e-commerce platform for farm machinery, agricultural tools, irrigation equipment, pumps, motors, sprayers, and farming essentials.'],
      ['Do you have a physical store?', 'Shyam Agro Tools primarily operates through its mobile application and online platform. For product inquiries or support, contact our customer service team.'],
      ['Do you sell your own products or products from other sellers?', 'We offer products supplied directly by Shyam Agro Tools as well as selected products from approved third-party sellers and manufacturers.'],
      ['How can I know when an out-of-stock product becomes available?', 'If a product is unavailable, contact our support team. We will help you with availability updates whenever possible.'],
    ],
  },
  {
    title: 'Orders',
    items: [
      ['How do I place an order?', 'Browse products, add items to the cart, proceed to checkout, provide delivery details, and complete payment to place your order.'],
      ['Can I cancel my order?', 'Orders may be cancelled before shipment. Once dispatched, cancellation may not be possible. Contact customer support immediately for help.'],
      ['How can I view my order details?', 'Open My Orders from your account to view order history, order details, invoices, and tracking information.'],
    ],
  },
  {
    title: 'Payments',
    items: [
      ['What payment methods do you accept?', 'We support UPI, debit cards, credit cards, net banking, wallets where available, and Cash on Delivery for eligible products and locations.'],
      ['Are my payment details secure?', 'Yes. Payments are processed through secure payment gateways using industry-standard encryption and security measures.'],
      ['What should I do if my payment fails?', 'If payment is deducted but the order is not confirmed, wait briefly and then contact support with your payment reference details.'],
    ],
  },
  {
    title: 'Shipping and Delivery',
    items: [
      ['Where do you deliver?', 'We deliver across most locations in India, subject to logistics partner service availability.'],
      ['How long does delivery take?', 'Delivery timelines vary by product and location. Most orders are delivered within 3 to 10 business days.'],
      ['How can I track my order?', 'Once shipped, tracking details are shared by SMS, email, or inside the app. You can also use the Track Order page.'],
      ['Can I change my delivery address after placing an order?', 'Address changes may be possible before shipment. Contact customer support as soon as possible.'],
    ],
  },
  {
    title: 'Returns, Replacements and Refunds',
    items: [
      ['Can I return a product?', 'Eligible products may be returned according to our Return & Refund Policy.'],
      ['When can I request a return?', 'You may request a return for damaged products, incorrect products, manufacturing defects, or items that qualify under our return policy.'],
      ['How do I request a replacement?', 'Raise a replacement request from order details or contact customer support with supporting images and information.'],
      ['How long does it take to receive a refund?', 'Approved refunds are generally processed within 5 to 10 business days depending on your payment provider and bank.'],
    ],
  },
  {
    title: 'Product Information',
    items: [
      ['Why does the product look different from the image?', 'Product images are for reference. Actual products may vary slightly in color, packaging, design, or appearance due to manufacturer updates.'],
      ['Do products come with a warranty?', 'Warranty depends on the manufacturer and product category. Warranty details, if applicable, will be mentioned on the product page.'],
      ['Can I get technical assistance before purchasing?', 'Yes. Our support team can assist with product selection and basic product information before purchase.'],
    ],
  },
  {
    title: 'Customer Support',
    items: [
      ['How can I contact Shyam Agro Tools?', 'Email support@shyamagrotools.com or call +91 9398649798.'],
      ['What are your customer support hours?', 'Customer support is available during standard business hours. Response times may vary during weekends and public holidays.'],
      ['How can I report a problem with my order?', 'Contact customer support and provide your order number with issue details. Our team will assist you as quickly as possible.'],
    ],
  },
];

const faqSectionsTranslations = {
  en: faqSections,
  te: [
    {
      title: 'సాధారణ ప్రశ్నలు',
      items: [
        ['శ్యామ్ ఆగ్రో టూల్స్ అంటే ఏమిటి?', 'శ్యామ్ ఆగ్రో టూల్స్ అనేది వ్యవసాయ యంత్రాలు, పారిశ్రామిక పరికరాలు మరియు వ్యవసాయ నిత్యావసరాల కోసం భారతదేశపు ప్రముఖ మార్కెట్‌ప్లేస్.'],
        ['మీకు భౌతిక దుకాణం ఉందా?', 'శ్యామ్ ఆగ్రో టూల్స్ ప్రాథమికంగా ఆన్‌లైన్ ప్లాట్‌ఫారమ్ మరియు మొబైల్ అప్లికేషన్ ద్వారా సేవలను అందిస్తుంది.'],
        ['ఉత్పత్తులు నిజమైనవేనా?', 'అవును, మేము నేరుగా ధృవీకరించబడిన సరఫరాదారుల నుండి అసలైన మరియు 100% నిజమైన వ్యవసాయ ఉత్పత్తులను మాత్రమే విక్రయిస్తాము.'],
        ['మరింత సహాయం ఎలా పొందాలి?', 'దయచేసి మా కస్టమర్ కేర్ నంబర్ లేదా ఈమెయిల్ ద్వారా మమ్మల్ని సంప్రదించండి.'],
      ]
    },
    {
      title: 'ఆర్డర్లు',
      items: [
        ['ఆర్డర్ ఎలా ఇవ్వాలి?', 'ఉత్పత్తిని ఎంచుకుని, కార్ట్‌కు జోడించి, డెలివరీ వివరాలను నమోదు చేసి చెల్లింపు చేయండి.'],
        ['ఆర్డర్ రద్దు చేయవచ్చా?', 'షిప్పింగ్‌కు ముందు ఆర్డర్‌ను రద్దు చేయవచ్చు. పంపిన తర్వాత రద్దు సాధ్యం కాదు.'],
        ['ఆర్డర్ వివరాలు ఎక్కడ చూడాలి?', '"నా ఆర్డర్లు" విభాగంలో మీ ఆర్డర్ వివరాలు మరియు ట్రాకింగ్ సమాచారాన్ని చూడవచ్చు.'],
      ]
    },
    {
      title: 'చెల్లింపులు',
      items: [
        ['ఏ చెల్లింపు పద్ధతులు అందుబాటులో ఉన్నాయి?', 'మేము UPI, క్రెడిట్/డెబిట్ కార్డులు, నెట్ బ్యాంకింగ్ మరియు క్యాష్ ఆన్ డెలివరీ (COD) అంగీకరిస్తాము.'],
        ['చెల్లింపులు సురక్షితమేనా?', 'అవును, మా చెల్లింపులు 256-bit SSL ఎన్‌క్రిప్షన్‌తో పూర్తిగా సురక్షితంగా రక్షించబడ్డాయి.'],
        ['చెల్లింపు విఫలమైతే ఏమి చేయాలి?', 'డబ్బులు కట్ అయి ఆర్డర్ కాకపోతే, మీ లావాదేవీ వివరాలతో వెంటనే మమ్మల్ని సంప్రదించండి.'],
      ]
    },
    {
      title: 'డెలివరీ మరియు షిప్పింగ్',
      items: [
        ['డెలివరీ ఎక్కడికి చేస్తారు?', 'మేము దేశవ్యాప్తంగా అన్ని ప్రధాన నగరాలు మరియు గ్రామీణ ప్రాంతాలకు హోమ్ డెలివరీ అందిస్తాము.'],
        ['డెలివరీకి ఎంత సమయం పడుతుంది?', 'సాధారణంగా ఆర్డర్ చేసిన 3 నుండి 7 పని దినాలలో డెలివరీ పూర్తవుతుంది.'],
        ['ఆర్డర్ ఎలా ట్రాక్ చేయాలి?', 'మీరు "ఆర్డర్ ట్రాకింగ్" విభాగం ద్వారా మీ ఆర్డర్ లైవ్ స్థితిని చూడవచ్చు.'],
      ]
    },
    {
      title: 'రిటర్న్స్ మరియు రీఫండ్స్',
      items: [
        ['ఉత్పత్తిని రిటర్న్ చేయవచ్చా?', 'అవును, డెలివరీ అయిన 7 రోజులలోపు మీరు సులభంగా రిటర్న్ అభ్యర్థన సమర్పించవచ్చు.'],
        ['రీఫండ్ ఎప్పుడు వస్తుంది?', 'ఉత్పత్తిని తిరిగి పొంది తనిఖీ చేసిన తర్వాత 5-10 పని దినాలలో రీఫండ్ మీ ఖాతాకు జమ అవుతుంది.'],
      ]
    }
  ],
  hi: [
    {
      title: 'सामान्य प्रश्न',
      items: [
        ['श्याम एग्रो टूल्स क्या है?', 'श्याम एग्रो टूल्स कृषि मशीनरी, औद्योगिक उपकरणों और कृषि आवश्यकताओं के लिए भारत का अग्रणी मार्केटप्लेस है।'],
        ['क्या आपका कोई फिजिकल स्टोर है?', 'श्याम एग्रो टूल्स मुख्य रूप से ऑनलाइन प्लेटफॉर्म और मोबाइल ऐप के माध्यम से सेवाएं प्रदान करता है।'],
        ['क्या उत्पाद असली हैं?', 'हाँ, हम केवल प्रमाणित आपूर्तिकर्ताओं से मूल और 100% वास्तविक कृषि उत्पाद ही प्रदान करते हैं।'],
        ['अधिक सहायता कैसे प्राप्त करें?', 'कृपया हमारे ग्राहक सहायता नंबर या ईमेल के माध्यम से हमसे संपर्क करें।'],
      ]
    },
    {
      title: 'ऑर्डर',
      items: [
        ['ऑर्डर कैसे दें?', 'उत्पाद चुनें, कार्ट में जोड़ें, डिलीवरी विवरण दर्ज करें और भुगतान पूरा करें।'],
        ['ऑर्डर रद्द कैसे करें?', 'शिपमेंट से पहले ऑर्डर रद्द किया जा सकता है। भेजे जाने के बाद रद्दीकरण संभव नहीं है।'],
        ['ऑर्डर विवरण कहाँ देखें?', 'आप "मेरे ऑर्डर" अनुभाग में अपने ऑर्डर का विवरण और ट्रैकिंग जानकारी देख सकते हैं।'],
      ]
    },
    {
      title: 'भुगतान',
      items: [
        ['कौन से भुगतान तरीके उपलब्ध हैं?', 'हम UPI, क्रेडिट/डेबिट कार्ड, नेट बैंकिंग और कैश ऑन डिलीवरी (COD) स्वीकार करते हैं।'],
        ['क्या भुगतान सुरक्षित है?', 'हाँ, हमारे सभी भुगतान 256-bit SSL एन्क्रिप्शन के साथ पूरी तरह से सुरक्षित हैं।'],
        ['भुगतान विफल होने पर क्या करें?', 'यदि पैसे कट गए हैं लेकिन ऑर्डर नहीं हुआ है, तो तुरंत अपने लेनदेन विवरण के साथ हमसे संपर्क करें।'],
      ]
    },
    {
      title: 'डिलीवरी और शिपिंग',
      items: [
        ['डिलीवरी कहाँ की जाती है?', 'हम देश भर के सभी प्रमुख शहरों और ग्रामीण क्षेत्रों में होम डिलीवरी प्रदान करते हैं।'],
        ['डिलीवरी में कितना समय लगता है?', 'आमतौर पर ऑर्डर देने के 3 से 7 कार्य दिवसों के भीतर डिलीवरी हो जाती है।'],
        ['ऑर्डर ट्रैक कैसे करें?', 'आप "ऑर्डर ट्रैकिंग" अनुभाग के माध्यम से अपने ऑर्डर की स्थिति देख सकते हैं।'],
      ]
    },
    {
      title: 'रिटर्न और रिफंड',
      items: [
        ['क्या उत्पाद वापस किया जा सकता है?', 'हाँ, आप डिलीवरी के 7 दिनों के भीतर आसानी से रिटर्न का अनुरोध कर सकते हैं।'],
        ['रिफंड कब मिलेगा?', 'उत्पाद प्राप्त होने और निरीक्षण के बाद 5-10 कार्य दिवसों में रिफंड आपके खाते में जमा हो जाएगा।'],
      ]
    }
  ]
};

const helpSections = [
  {
    title: 'Getting Started',
    items: [
      ['How do I create an account?', 'Open Shyam Agro Tools, tap profile, enter your phone and email details, verify with OTP, and your account is ready.'],
      ['How do I update my profile information?', 'Go to Profile, tap Edit Profile, modify your details such as name, phone, or address, and save the changes.'],
    ],
  },
  {
    title: 'Browsing and Products',
    items: [
      ['How do I search for products?', 'Use the search bar, browse categories, or apply filters by price, brand, rating, and availability.'],
      ['How do I view product details and specifications?', 'Tap any product card to see price, rating, specifications, images, delivery information, return policy, reviews, and ratings.'],
      ['How do I save my favorite products?', 'Tap the heart icon on product cards or product details. Saved products are available in Wishlist.'],
    ],
  },
  {
    title: 'Shopping and Cart',
    items: [
      ['How do I add items to my cart?', 'Open a product, select quantity or variants if available, and tap Add to Cart.'],
      ['How do I modify my cart?', 'Go to Cart, adjust quantity, remove items, continue shopping, or proceed to checkout.'],
      ['How do I apply coupons or promo codes?', 'Go to Cart or Checkout, enter the promo code, and tap Apply. Some coupons may have minimum purchase or product restrictions.'],
    ],
  },
  {
    title: 'Orders and Checkout',
    items: [
      ['What payment methods do you accept?', 'We accept debit cards, credit cards, net banking, digital wallets, Cash on Delivery where available, and UPI.'],
      ['Is the checkout process secure?', 'Yes. We use secure payment gateways and encrypted transactions. Your payment information is not stored by support staff.'],
      ['Can I see my order history?', 'Go to My Orders to view active and past orders, order details, invoices, and shipment updates.'],
      ['Can I change or cancel an order?', 'Orders not yet shipped may be cancelled. In transit orders may not be cancellable and delivered orders follow return procedures.'],
    ],
  },
  {
    title: 'Delivery and Shipping',
    items: [
      ['How long does delivery take?', 'Delivery time depends on location, product size, and availability. Delivery estimates are shown before checkout.'],
      ['How do I track my order?', 'Go to My Orders or Track Order to view current shipment status, estimated delivery date, and tracking updates.'],
      ['What if my order is delayed?', 'Check tracking first. If delivery is overdue, contact support and we will investigate with the logistics partner.'],
    ],
  },
  {
    title: 'Technical Support',
    items: [
      ['The app keeps crashing. What should I do?', 'Restart the app, clear cache, update to the latest version, restart your phone, or reinstall if the issue persists.'],
      ['Why am I not receiving notifications?', 'Check phone notification permissions for Shyam Agro Tools and ensure order/promotional notifications are enabled.'],
      ['I forgot my login details. How do I recover?', 'Use Forgot Password or OTP login where available. If OTP does not arrive, contact support.'],
    ],
  },
];

const helpSectionsTranslations = {
  en: helpSections,
  te: [
    {
      title: 'ప్రారంభించడం',
      items: [
        ['యాప్‌లో ఖాతా ఎలా తెరవాలి?', 'యాప్‌ను తెరిచి, ప్రొఫైల్‌పై క్లిక్ చేసి, మీ ఫోన్ నంబర్ మరియు ఈమెయిల్ ఇచ్చి OTP ద్వారా వెరిఫై చేసుకోండి.'],
        ['ప్రొఫైల్ వివరాలు మార్చడం ఎలా?', 'ప్రొఫైల్‌లో "ఎడిట్ ప్రొఫైల్" క్లిక్ చేసి మీ పేరు, ఫోన్ మరియు చిరునామా వివరాలు మార్చుకోవచ్చు.'],
      ]
    },
    {
      title: 'ఉత్పత్తుల బ్రౌజింగ్',
      items: [
        ['ఉత్పత్తులను ఎలా వెతకాలి?', 'శోధన పట్టీ (Search Bar) ఉపయోగించండి లేదా వర్గాలు (Categories) బ్రౌజ్ చేయండి.'],
        ['ఇష్టమైన ఉత్పత్తులను ఎలా సేవ్ చేయాలి?', 'ఉత్పత్తి కార్డుపై ఉన్న గుండె (Heart) చిహ్నాన్ని క్లిక్ చేసి విష్‌లిస్ట్‌కు జోడించవచ్చు.'],
      ]
    }
  ],
  hi: [
    {
      title: 'शुरुआत करना',
      items: [
        ['ऐप में खाता कैसे बनाएं?', 'ऐप खोलें, प्रोफाइल पर जाएं, अपना फोन नंबर और ईमेल दर्ज करें और ओटीपी सत्यापित करें।'],
        ['प्रोफ़ाइल विवरण कैसे बदलें?', 'प्रोफ़ाइल में "एडिट प्रोफ़ाइल" पर क्लिक करके अपना नाम, फोन और पता बदल सकते हैं।'],
      ]
    },
    {
      title: 'उत्पाद खोजना',
      items: [
        ['उत्पाद कैसे खोजें?', 'सर्च बार का उपयोग करें या श्रेणियों (Categories) को ब्राउज़ करें।'],
        ['पसंदीदा उत्पादों को कैसे सहेजें?', 'उत्पाद कार्ड पर दिल (Heart) के आइकन पर क्लिक करके विशलिस्ट में जोड़ें।'],
      ]
    },
    {
      title: 'शॉपिंग और कार्ट',
      items: [
        ['कार्ट में आइटम कैसे जोड़ें?', 'उत्पाद खोलें, मात्रा चुनें और "कार्ट में जोड़ें" पर टैप करें।'],
        ['कूपन का उपयोग कैसे करें?', 'चेकआउट पेज पर कूपन कोड दर्ज करें और "लागू करें" पर क्लिक करें।'],
      ]
    }
  ]
};

const returnPolicySections = [
  ['Return Eligibility Period', ['Customers may request a return, replacement, or refund within 7 days of delivery unless otherwise specified on the product page.', 'Requests submitted after the return period may not be eligible.']],
  ['Eligible Reasons for Return or Replacement', ['Wrong product delivered, damaged product, manufacturing defect, missing parts or accessories, or non-functional product on delivery may qualify for return or replacement.']],
  ['Conditions for Accepted Returns', ['Product must be returned in original condition with all accessories, manuals, and packaging.']],
];

const returnPolicySectionsTranslations = {
  en: returnPolicySections,
  te: [
    ['రిటర్న్ వ్యవధి', ['కస్టమర్లు డెలివరీ అయిన 7 రోజులలోపు రిటర్న్, రీప్లేస్‌మెంట్ లేదా రీఫండ్ అభ్యర్థన సమర్పించవచ్చు.', 'రిటర్న్ గడువు ముగిసిన తర్వాత సమర్పించిన అభ్యర్థనలు అంగీకరించబడవు.']],
    ['రిటర్న్ లేదా రీప్లేస్‌మెంట్‌కు గల కారణాలు', ['తప్పుడు ఉత్పత్తి డెలివరీ కావడం, పాడైపోయిన ఉత్పత్తి రావడం, తయారీ లోపాలు లేదా విడిభాగాలు లేకపోవడం వంటి కారణాల వల్ల రిటర్న్ లేదా రీప్లేస్‌మెంట్ చేయవచ్చు.']],
    ['రిటర్న్ అంగీకార నిబంధనలు', ['ఉత్పత్తిని అన్ని యాక్సెసరీలు, మాన్యువల్లు మరియు అసలు ప్యాకేజింగ్‌తో పాటు అసలు స్థితిలోనే తిరిగి పంపాలి.']],
  ],
  hi: [
    ['रिटर्न पात्रता अवधि', ['ग्राहक डिलीवरी के 7 दिनों के भीतर रिटर्न, रिप्लेसमेंट या रिफंड का अनुरोध कर सकते हैं।', 'रिटर्न अवधि समाप्त होने के बाद भेजे गए अनुरोधों पर विचार नहीं किया जाएगा।']],
    ['रिटर्न या रिप्लेसमेंट के कारण', ['गलत उत्पाद की डिलीवरी, क्षतिग्रस्त उत्पाद, विनिर्माण दोष या पुर्जे गायब होने जैसी स्थितियों में रिटर्न या रिप्लेसमेंट संभव है।']],
    ['रिटर्न स्वीकृति की शर्तें', ['उत्पाद को सभी एक्सेसरीज, मैनुअल और मूल पैकेजिंग के साथ मूल स्थिति में ही लौटाया जाना चाहिए।']],
  ]
};

const termsSections = [
  ['About Shyam Agro Tools', ['Shyam Agro Tools is an agriculture-focused e-commerce platform for agricultural equipment, machinery, tools, irrigation products, farm supplies, and related products.', 'Business Address: Madhapur, Hyderabad - 520011, Telangana, India.']],
  ['Eligibility', ['You must be at least 18 years old and capable of entering into a legally binding agreement to use our platform.']],
  ['User Accounts', ['You are responsible for maintaining confidentiality of your account credentials and all activity under your account.']],
];

const termsSectionsTranslations = {
  en: termsSections,
  te: [
    ['శ్యామ్ ఆగ్రో టూల్స్ గురించి', ['శ్యామ్ ఆగ్రో టూల్స్ అనేది వ్యవసాయ పరికరాలు, యంత్రాలు, నీటిపారుదల ఉత్పత్తులు మరియు వ్యవసాయ అవసరాల కోసం ఒక ఇ-కామర్స్ ప్లాట్‌ఫారమ్.', 'వ్యాపార చిరునామా: మాదాపూర్, హైదరాబాద్ - 520011, తెలంగాణ, భారతదేశం.']],
    ['అర్హత', ['మా ప్లాట్‌ఫారమ్‌ను ఉపయోగించడానికి మీకు కనీసం 18 సంవత్సరాల వయస్సు ఉండాలి మరియు చట్టపరమైన ఒప్పందం కుదుర్చుకోగలగాలి.']],
    ['యూజర్ ఖాతాలు', ['మీ ఖాతా వివరాలు మరియు మీ ఖాతా ద్వారా జరిగే అన్ని కార్యకలాపాల భద్రతకు మీదే పూర్తి బాధ్యత.']],
  ],
  hi: [
    ['श्याम एग्रो टूल्स के बारे में', ['श्याम एग्रो टूल्स कृषि उपकरण, मशीनरी, सिंचाई उत्पादों और कृषि आपूर्ति के लिए एक ई-कॉमर्स प्लेटफॉर्म है।', 'व्यावसायिक पता: माधापुर, हैदराबाद - 520011, तेलंगाना, भारत।']],
    ['पात्रता', ['हमारे प्लेटफॉर्म का उपयोग करने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए और आप कानूनी रूप से समझौता करने में सक्षम होने चाहिए।']],
    ['उपयोगकर्ता खाते', ['आप अपने खाते के क्रेडेंशियल्स की गोपनीयता बनाए रखने और अपने खाते के तहत होने वाली सभी गतिविधियों के लिए जिम्मेदार हैं।']],
  ]
};

const privacySections = [
  ['Information We Collect', ['We may collect name, phone number, email, delivery address, order information, payment reference details needed to operate the platform.']],
  ['How We Use Information', ['We use customer information to create accounts, process orders, arrange delivery, provide support, and improve products.']],
  ['Data Security', ['We use reasonable administrative, technical, and operational safeguards to protect customer information from unauthorized access, misuse, loss, or disclosure.']],
];

const privacySectionsTranslations = {
  en: privacySections,
  te: [
    ['మేము సేకరించే సమాచారం', ['మేము ప్లాట్‌ఫారమ్‌ను నిర్వహించడానికి అవసరమైన పేరు, ఫోన్ నంబర్, ఈమెయిల్, డెలివరీ చిరునామా, మరియు ఆర్డర్ సమాచారాన్ని సేకరిస్తాము.']],
    ['సమాచారాన్ని ఎలా ఉపయోగిస్తాము', ['మేము ఖాతాలను సృష్టించడానికి, ఆర్డర్లను ప్రాసెస్ చేయడానికి, డెలివరీ ఏర్పాటు చేయడానికి మరియు సహాయాన్ని అందించడానికి సమాచారాన్ని ఉపయోగిస్తాము.']],
    ['డేటా భద్రత', ['అనధికారిక యాక్సెస్ లేదా దుర్వినియోగం నుండి కస్టమర్ సమాచారాన్ని రక్షించడానికి మేము కఠినమైన భద్రతా చర్యలను ఉపయోగిస్తాము.']],
  ],
  hi: [
    ['जानकारी जो हम एकत्र करते हैं', ['हम प्लेटफॉर्म संचालित करने के लिए आवश्यक नाम, फोन नंबर, ईमेल, डिलीवरी का पता और ऑर्डर की जानकारी एकत्र कर सकते हैं।']],
    ['हम जानकारी का उपयोग कैसे करते हैं', ['हम खाता बनाने, ऑर्डर प्रोसेस करने, डिलीवरी की व्यवस्था करने और सहायता प्रदान करने के लिए ग्राहक जानकारी का उपयोग करते हैं।']],
    ['डेटा सुरक्षा', ['हम अनधिकृत पहुंच या दुरुपयोग से ग्राहक जानकारी की रक्षा करने के लिए उचित सुरक्षा उपायों का उपयोग करते हैं।']],
  ]
};

function InfoShell({ eyebrow, title, description, children }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="static-info-shell min-h-screen bg-light">
      <Header onLoginClick={() => setIsLoginOpen(true)} />
      <main className="static-info-container">
        <section className="static-info-hero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </section>
        {children}
      </main>
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

function AccordionList({ sections }) {
  return (
    <div className="static-info-list">
      {sections.map((section, idx) => (
        <section key={idx} className="static-info-section">
          <h2>{section.title}</h2>
          <div className="static-info-accordion">
            {section.items.map(([question, answer], qIdx) => (
              <details key={qIdx}>
                <summary>
                  <span>{question}</span>
                  <ChevronDown size={18} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PolicyList({ sections }) {
  return (
    <div className="static-info-list">
      {sections.map(([title, paragraphs], idx) => (
        <section key={idx} className="static-info-section static-info-policy">
          <h2>{title}</h2>
          {paragraphs.map((paragraph, pIdx) => (
            <p key={pIdx}>{paragraph}</p>
          ))}
        </section>
      ))}
    </div>
  );
}

export function FAQPage() {
  const { t, activeLanguage } = useLanguage();
  const code = activeLanguage?.code || 'en';
  const data = faqSectionsTranslations[code] || faqSections;

  return (
    <InfoShell
      eyebrow={t('customerService') || "Customer Service"}
      title={t('faq') || "FAQ"}
      description={t('faqDescription') || "Answers to common questions about orders, payments, shipping, products, returns, and account support."}
    >
      <AccordionList sections={data} />
    </InfoShell>
  );
}

export function HelpCenterPage() {
  const { t, activeLanguage } = useLanguage();
  const code = activeLanguage?.code || 'en';
  const data = helpSectionsTranslations[code] || helpSections;

  return (
    <InfoShell
      eyebrow={t('supportChat.title') || "Support"}
      title={t('helpCenter') || "Help Center"}
      description={t('helpCenterDescription') || "Find guidance for shopping, checkout, delivery, returns, technical issues, and account help."}
    >
      <div className="static-info-actions">
        <Link to="/contact-support"><Mail size={18} /> {t('contactUs') || 'Email support'}</Link>
        <a href="tel:+919398649798"><Phone size={18} /> {t('supportChat.mobile') || 'Call support'}</a>
      </div>
      <AccordionList sections={data} />
    </InfoShell>
  );
}

export function ContactUsPage() {
  const { t, activeLanguage } = useLanguage();
  const code = activeLanguage?.code || 'en';
  const rows = contactRowsTranslations[code] || contactRows;

  return (
    <InfoShell
      eyebrow={t('contactUs') || "Contact"}
      title={t('contactUs') || "Contact Us"}
      description={t('supportChat.subtitle') || "Reach our support team for order help, product guidance, bulk enquiries, or service questions."}
    >
      <div className="static-contact-card">
        {rows.map((row, idx) => {
          const Icon = row.icon;
          const content = (
            <>
              <span className="static-contact-icon"><Icon size={20} /></span>
              <span>
                <small>{row.label}</small>
                <strong>{row.value}</strong>
              </span>
            </>
          );
          return row.href ? (
            <a key={idx} href={row.href}>{content}</a>
          ) : (
            <p key={idx}>{content}</p>
          );
        })}
      </div>
    </InfoShell>
  );
}

export function TermsOfServicePage() {
  const { t, activeLanguage } = useLanguage();
  const code = activeLanguage?.code || 'en';
  const data = termsSectionsTranslations[code] || termsSections;

  return (
    <InfoShell
      eyebrow={t('termsConditions') || "Legal"}
      title={t('termsConditions') || "Terms of Service"}
      description={t('termsDescription') || "Terms governing access to and use of the Shyam Agro Tools website, products, and services."}
    >
      <PolicyList sections={data} />
    </InfoShell>
  );
}

export function PrivacyPolicyPage() {
  const { t, activeLanguage } = useLanguage();
  const code = activeLanguage?.code || 'en';
  const data = privacySectionsTranslations[code] || privacySections;

  return (
    <InfoShell
      eyebrow={t('privacyPolicy') || "Legal"}
      title={t('privacyPolicy') || "Privacy Policy"}
      description={t('privacyDescription') || "How Shyam Agro Tools collects, uses, protects, and shares customer information."}
    >
      <PolicyList sections={data} />
    </InfoShell>
  );
}

export function ReturnRefundPolicyPage() {
  const { t, activeLanguage } = useLanguage();
  const code = activeLanguage?.code || 'en';
  const data = returnPolicySectionsTranslations[code] || returnPolicySections;

  return (
    <InfoShell
      eyebrow={t('refundPolicy') || "Policy"}
      title={t('refundPolicy') || "Return & Refund Policy"}
      description={t('refundDescription') || "Conditions under which customers may request returns, replacements, refunds, or cancellations."}
    >
      <PolicyList sections={data} />
    </InfoShell>
  );
}

export const customerServicePages = [
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/help-center', label: 'Help Center', icon: LifeBuoy },
  { path: '/contact-support', label: 'Contact Support', icon: Mail },
  { path: '/terms-of-service', label: 'Terms of Service', icon: FileText },
  { path: '/privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
  { path: '/return-refund-policy', label: 'Return & Refund Policy', icon: RefreshCcw },
];
