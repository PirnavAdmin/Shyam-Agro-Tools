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
  Clock,
  Headphones,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';
import Header from '../components/Header';
import LoginPopup from '../components/LoginPopup';
import { useLanguage } from '../context/LanguageContext';
import './StaticInfoPages.css';

const contactRows = [
  {
    icon: Phone,
    label: 'Customer Support Helpline',
    value: '+91 9912649265 / +91 9398649798',
    href: 'tel:+919912649265',
  },
  {
    icon: Mail,
    label: 'Support & Order Inquiries',
    value: 'support@shyamagrotools.com',
    href: 'mailto:support@shyamagrotools.com',
  },
  {
    icon: Headphones,
    label: 'Bulk Sales & Dealership Enquiries',
    value: 'sales@shyamagrotools.com',
    href: 'mailto:sales@shyamagrotools.com',
  },
  {
    icon: Clock,
    label: 'Business Hours',
    value: 'Monday to Saturday: 9:00 AM – 7:00 PM IST',
  },
  {
    icon: MapPin,
    label: 'Corporate & Logistics Office',
    value: 'Shyam Agro Tools Pvt. Ltd., Plot No. 42, HITECH City Main Road, Madhapur, Hyderabad - 500081, Telangana, India',
  },
];

const contactRowsTranslations = {
  en: contactRows,
  te: [
    { icon: Phone, label: 'కస్టమర్ సపోర్ట్ హెలైన్', value: '+91 9912649265 / +91 9398649798', href: 'tel:+919912649265' },
    { icon: Mail, label: 'సపోర్ట్ & ఆర్డర్ సహాయం', value: 'support@shyamagrotools.com', href: 'mailto:support@shyamagrotools.com' },
    { icon: Headphones, label: 'బల్క్ సేల్స్ & డీలర్‌షిప్', value: 'sales@shyamagrotools.com', href: 'mailto:sales@shyamagrotools.com' },
    { icon: Clock, label: 'పనివేళలు', value: 'సోమవారం నుండి శనివారం వరకు: ఉదయం 9:00 - సాయంత్రం 7:00 IST' },
    { icon: MapPin, label: 'కార్పొరేట్ ఆఫీస్ చిరునామా', value: 'శ్యామ్ ఆగ్రో టూల్స్ ప్రైవేట్ లిమిటెడ్, ప్లాట్ నెం. 42, మాదాపూర్, హైదరాబాద్ - 500081, తెలంగాణ' },
  ],
  hi: [
    { icon: Phone, label: 'ग्राहक सहायता हेल्पलाइन', value: '+91 9912649265 / +91 9398649798', href: 'tel:+919912649265' },
    { icon: Mail, label: 'सहायता और ऑर्डर पूछताछ', value: 'support@shyamagrotools.com', href: 'mailto:support@shyamagrotools.com' },
    { icon: Headphones, label: 'थोक बिक्री और डीलरशिप', value: 'sales@shyamagrotools.com', href: 'mailto:sales@shyamagrotools.com' },
    { icon: Clock, label: 'कार्य समय', value: 'सोमवार से शनिवार: सुबह 9:00 - शाम 7:00 IST' },
    { icon: MapPin, label: 'कॉर्पोरेट कार्यालय पता', value: 'श्याम एग्रो टूल्स प्राइवेट लिमिटेड, प्लॉट नंबर 42, माधापुर, हैदराबाद - 500081, तेलंगाना' },
  ]
};

const faqSections = [
  {
    title: 'General & Platform Overview',
    items: [
      [
        'What is Shyam Agro Tools?',
        'Shyam Agro Tools is India\'s premier specialized agricultural marketplace dedicated to providing farmers, agri-entrepreneurs, and nurseries with high-quality farm machinery, power sprayers, brush cutters, water pumps, bio-inputs, fertilizers, and farm equipment directly from certified manufacturers.',
      ],
      [
        'Are all products on Shyam Agro Tools 100% genuine?',
        'Yes. All machines, tools, spare parts, and agricultural formulations sold on Shyam Agro Tools are 100% authentic, sourced directly from verified manufacturers or factory-authorized distributors with full original warranties.',
      ],
      [
        'Do you provide official GST Tax Invoices for farm input credit?',
        'Absolutely. Every purchase includes a downloadable GST Tax Invoice detailing Product HSN codes, SGST/CGST/IGST breakdown, and business GSTIN if provided during checkout, allowing business and farm tax input credit claims.',
      ],
      [
        'Can I buy spare parts for machinery purchased on Shyam Agro Tools?',
        'Yes! We maintain an extensive stock of genuine replacement parts, carburetors, blades, seals, engines, nozzles, and hoses for all machinery brands hosted on our platform.',
      ],
    ],
  },
  {
    title: 'Ordering, Commercial Quotes & Bulk Orders',
    items: [
      [
        'How do I place an order online?',
        'Browse our catalog, select your desired machinery or product, add it to your cart, specify your delivery address and GST details (if applicable), and choose your preferred payment option to complete your purchase.',
      ],
      [
        'Do you offer special bulk pricing for commercial farms, FPOs, or government schemes?',
        'Yes! For large orders, farmer producer organizations (FPOs), or commercial tenders, please contact our Sales Department at sales@shyamagrotools.com or call +91 9912649265 for custom bulk discounts and proforma invoices.',
      ],
      [
        'Can I modify my shipping address or items after placing an order?',
        'Address modifications or item edits can be processed before order dispatch. Please contact Customer Support within 4 hours of order placement with your order ID.',
      ],
      [
        'How can I download my order invoice?',
        'Log in to your account, navigate to "My Orders", click on your specific Order ID, and tap the "Download Invoice" button to generate a PDF copy.',
      ],
    ],
  },
  {
    title: 'Payments, COD & Wallet Rewards',
    items: [
      [
        'Which payment options are accepted on Shyam Agro Tools?',
        'We support all major payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking (SBI, HDFC, ICICI, Axis, etc.), Shyam Agro Wallet Balance, and Cash on Delivery (COD).',
      ],
      [
        'Is Cash on Delivery (COD) available for all pin codes and heavy machinery?',
        'Cash on Delivery is available for over 18,000 pin codes across India for eligible products. For heavy agricultural machinery exceeding 30kg, a nominal partial advance deposit may be requested to confirm transport booking.',
      ],
      [
        'Are my payment transactions secure?',
        'Yes. All online transactions are processed using bank-grade 256-bit SSL encryption via PCI-DSS compliant payment gateways. We never store your full card number or CVV.',
      ],
      [
        'How does the Shyam Agro Wallet reward system work?',
        'Every purchase earns you Shyam Agro Coins credited directly to your Wallet. These coins convert into INR discounts that can be redeemed on future purchases at checkout.',
      ],
      [
        'What should I do if money was debited but my order was not confirmed?',
        'If a transaction fails due to network issues, your bank automatically refunds debited amounts within 3 to 5 business days. You can also share your payment transaction UTR with support@shyamagrotools.com for instant verification.',
      ],
    ],
  },
  {
    title: 'Shipping, Logistics & Delivery',
    items: [
      [
        'Where do you deliver across India?',
        'We ship to rural and urban locations across all states and union territories in India through leading express logistics partners including Delhivery, GATI, Safexpress, BlueDart, and India Post.',
      ],
      [
        'How long does standard delivery take?',
        'Standard products typically deliver within 3 to 7 business days. Heavy equipment (such as power tillers, diesel engines, and tractors) sent via surface logistics takes 5 to 10 business days depending on distance.',
      ],
      [
        'How can I track my shipment in real time?',
        'Once your order is dispatched, you will receive an AWB tracking number via SMS, WhatsApp, and email. You can also track your shipment live on our website under "Track Order".',
      ],
      [
        'What should I do if the parcel box appears damaged at delivery?',
        'If the outer package is visibly open or severely crushed, please inspect the contents before accepting delivery or record an unboxing video. Notify our support team within 24 hours.',
      ],
    ],
  },
  {
    title: 'Returns, Replacements & Refunds',
    items: [
      [
        'What is the Shyam Agro 7-Day Replacement Policy?',
        'We offer a hassle-free 7-day replacement guarantee if your product arrives damaged, defective, incomplete, or significantly different from the catalog description.',
      ],
      [
        'Which products are non-returnable?',
        'Opened biological formulations, seeds once planted, and motorized equipment that has already been filled with petrol/diesel/oil cannot be returned due to safety and contamination regulations unless inspected for a manufacturing defect.',
      ],
      [
        'How long does it take to receive my refund?',
        'Once a returned product is inspected and approved at our warehouse, online payment refunds are credited back to your original source within 3 to 5 business days. COD refunds are paid via direct bank transfer or wallet credit within 24 to 48 hours.',
      ],
    ],
  },
  {
    title: 'Warranties, Technical Support & Servicing',
    items: [
      [
        'Do machines come with a manufacturer warranty?',
        'Yes! All powered machinery (sprayers, tillers, engines, pumps, brush cutters) includes standard manufacturer warranties ranging from 6 to 24 months as specified on the product detail page.',
      ],
      [
        'How do I claim a warranty for a machine?',
        'Keep your GST tax invoice as proof of purchase. If a warranty issue arises, contact customer support or visit an authorized brand service center with your invoice copy.',
      ],
      [
        'Can I get pre-purchase technical advice for my farm size?',
        'Yes! Our agricultural machinery experts can recommend optimal pump horsepowers, nozzle types, and sprayer capacities tailored to your farm acreage and crop type. Call us at +91 9912649265.',
      ],
    ],
  },
];

const faqSectionsTranslations = {
  en: faqSections,
  te: [
    {
      title: 'సాధారణం & శ్యామ్ ఆగ్రో పరిచయం',
      items: [
        ['శ్యామ్ ఆగ్రో టూల్స్ అంటే ఏమిటి?', 'శ్యామ్ ఆగ్రో టూల్స్ అనేది రైతులకు నాణ్యమైన వ్యవసాయ యంత్రాలు, స్ప్రేయర్లు, పంపులు, విత్తనాలు మరియు ఎరువులను నేరుగా అందించే ప్రముఖ ఆన్‌లైన్ ప్లాట్‌ఫారమ్.'],
        ['ఉత్పత్తులు 100% నిజమైనవేనా?', 'అవును. మా ప్లాట్‌ఫారమ్‌లోని ప్రతి పరికరం మరియు యంత్రం అసలైన తయారీదారుల నుండి పొందిన 100% జెన్యూన్ ఉత్పత్తులే.'],
        ['జిఎస్‌టి ఇన్వాయిస్ లభిస్తుందా?', 'అవును. ప్రతి ఆర్డర్‌కు పన్ను మినహాయింపు మరియు ఇన్‌పుట్ ట్యాక్స్ క్రెడిట్ కోసం చెల్లుబాటు అయ్యే జిఎస్‌టి ఇన్వాయిస్ అందించబడుతుంది.'],
      ]
    },
  ],
  hi: [
    {
      title: 'सामान्य एवं मंच परिचय',
      items: [
        ['श्याम एग्रो टूल्स क्या है?', 'श्याम एग्रो टूल्स किसानों और कृषि उद्यमियों के लिए उच्च गुणवत्ता वाली कृषि मशीनरी, स्प्रेयर, पंप और कृषि सामग्री प्रदान करने वाला अग्रणी प्लेटफॉर्म है।'],
        ['क्या सभी उत्पाद 100% असली हैं?', 'हाँ, हमारे सभी उत्पाद सीधे अधिकृत निर्माताओं से प्राप्त 100% असली और वारंटी युक्त हैं।'],
      ]
    }
  ]
};

const helpSections = [
  {
    title: 'Account & Profile Management',
    items: [
      ['How do I create and verify a Shyam Agro Account?', 'Click "Sign In / Register" in the top header, enter your 10-digit mobile number, and submit the 4-digit OTP sent via SMS. You can then add your name, farm address, and GSTIN.'],
      ['How do I update my shipping address or phone number?', 'Go to Profile -> Account Info to update your default delivery address, alternate contact numbers, or firm name at any time.'],
    ],
  },
  {
    title: 'Browsing, Machinery Selection & Specifications',
    items: [
      ['How do I find the right machine for my farm acreage?', 'Use our smart search bar or filter by Category (e.g. Pumps, Sprayers, Tillers), Brand, Price, Power Source (Petrol, Diesel, Battery, Solar), and Capacity.'],
      ['Where can I inspect technical specifications and user manuals?', 'Every product detail page displays technical spec tables (HP, RPM, Tank Capacity, Fuel Consumption), downloadable user manuals, and warranty terms.'],
    ],
  },
  {
    title: 'Ordering, Payments & Invoices',
    items: [
      ['How do I complete my purchase?', 'Add your selected tools to the cart, verify items and quantities, select delivery address, apply coupon codes if available, and complete checkout using UPI, Card, Netbanking, or COD.'],
      ['How do I download a B2B Tax Invoice with my GSTIN?', 'Enter your 15-digit GSTIN number on the checkout page before completing payment. Your tax invoice will auto-populate your GSTIN and business name.'],
    ],
  },
  {
    title: 'Logistics, Tracking & Delivery',
    items: [
      ['How do I track my order shipment?', 'Visit "Track Order" from the header or footer menu and enter your Order ID or tracking AWB number to view live transit milestones.'],
      ['What happens during heavy equipment delivery?', 'For heavy machinery, courier transport teams contact you 24 hours prior to delivery. Make sure suitable unloading arrangements are available at your farm or doorstep.'],
    ],
  },
  {
    title: 'Returns, Replacements & Warranty Support',
    items: [
      ['How do I raise a return or replacement request?', 'Navigate to My Orders -> Select Order -> Click "Request Return/Replacement". Upload images or a video showing the damaged or missing part.'],
      ['What should I do if my machine needs warranty servicing?', 'Contact our support team at support@shyamagrotools.com with your GST invoice. We will connect you to the nearest authorized brand service station or send replacement parts.'],
    ],
  },
];

const helpSectionsTranslations = {
  en: helpSections,
};

const returnPolicySections = [
  [
    '1. 7-Day Hassle-Free Replacement Policy',
    [
      'Shyam Agro Tools offers a 7-day replacement and return policy starting from the date of physical delivery.',
      'If your machine, tool, or product arrives damaged, defective, with missing components, or differs significantly from the catalog description, you are fully entitled to a free replacement or complete refund.',
    ],
  ],
  [
    '2. Conditions for Return Acceptance',
    [
      'Products must be unused, unwashed, and returned in their original packaging including boxes, tags, warranty cards, accessories, and user manuals.',
      'For powered equipment (petrol, diesel, or battery-operated), fuel and oil tanks must be completely drained prior to reverse pickup for transport safety regulations.',
    ],
  ],
  [
    '3. Non-Returnable & Non-Refundable Items',
    [
      'Biological formulations, opened liquid fertilizers, bio-pesticides, and seeds once opened or planted are non-returnable due to biological contamination safety rules.',
      'Products damaged due to customer misuse, improper fuel mix, voltage surges, or unauthorized disassembly are not eligible for return.',
    ],
  ],
  [
    '4. Step-by-Step Return Process',
    [
      'Step 1: Log in to your Shyam Agro account and navigate to "My Orders".',
      'Step 2: Select the product you wish to return and click "Request Return / Replacement".',
      'Step 3: Provide a clear reason and upload 2-3 photographs (or a short unboxing video) showing the product issue.',
      'Step 4: Once approved by our quality team, our courier partner will pick up the parcel from your address within 2 to 4 business days.',
    ],
  ],
  [
    '5. Refund Modes & Timelines',
    [
      'Online Payments (UPI, Debit/Credit Card, Net Banking): Refunds are processed back to the original payment source within 3 to 5 business days after warehouse inspection.',
      'Cash on Delivery (COD): COD refunds are paid via direct NEFT bank transfer to your provided account details or credited instantly to your Shyam Agro Wallet within 24 to 48 hours.',
    ],
  ],
  [
    '6. Cancellation Policy',
    [
      'Orders can be cancelled free of charge at any time prior to shipment dispatch from our warehouse.',
      'Once dispatched, cancellations are subject to courier round-trip transit charges.',
    ],
  ],
];

const returnPolicySectionsTranslations = {
  en: returnPolicySections,
};

const termsSections = [
  [
    '1. Agreement & Platform Overview',
    [
      'Welcome to Shyam Agro Tools Pvt. Ltd. By accessing, browsing, or placing an order on our website or mobile platform, you agree to be bound by these Terms of Service and all incorporated policies.',
      'Shyam Agro Tools operates as an e-commerce marketplace and distributor for agricultural equipment, machinery, tools, irrigation supplies, and farm inputs located at Madhapur, Hyderabad, Telangana, India.',
    ],
  ],
  [
    '2. Eligibility & Account Security',
    [
      'You must be at least 18 years of age or accessing under the supervision of a parent/guardian to use this platform.',
      'You are responsible for safeguarding your account credentials, password, and OTPs. All orders placed using your registered mobile number shall be deemed authorized by you.',
    ],
  ],
  [
    '3. Product Specifications & Pricing Accuracy',
    [
      'We strive to display accurate product descriptions, technical specifications, and prices. All prices are listed in Indian Rupees (INR) and include GST unless stated otherwise.',
      'In the rare event of a pricing or typographical error, Shyam Agro Tools reserves the right to correct the error or cancel orders placed at incorrect price points with a full refund.',
    ],
  ],
  [
    '4. Order Acceptance & GST Invoicing',
    [
      'Receipt of an order confirmation does not signify final order acceptance. We reserve the right to limit order quantities or decline orders due to stock unavailability or logistical restrictions.',
      'B2B customers must provide a valid GSTIN at checkout. GST details cannot be altered once the tax invoice is generated.',
    ],
  ],
  [
    '5. Shipping, Title & Risk of Loss',
    [
      'Title and risk of loss for all purchased goods pass to the customer upon physical delivery of the items by our logistics carrier.',
      'Estimated delivery timelines are guidelines and may be subject to regional transport delays, weather conditions, or local regulations.',
    ],
  ],
  [
    '6. Warranty Disclaimer & Manufacturer Terms',
    [
      'Machinery warranties are provided directly by respective manufacturers. Shyam Agro Tools facilitates warranty service connections but is not liable for secondary crop loss or indirect operational downtime.',
    ],
  ],
  [
    '7. Intellectual Property Rights',
    [
      'All graphics, logos, product descriptions, photography, software code, and brand marks belong exclusively to Shyam Agro Tools Pvt. Ltd. or its licensors and are protected under Indian Intellectual Property laws.',
    ],
  ],
  [
    '8. Governing Law & Jurisdiction',
    [
      'These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of courts located in Hyderabad, Telangana.',
    ],
  ],
];

const termsSectionsTranslations = {
  en: termsSections,
};

const privacySections = [
  [
    '1. Information We Collect',
    [
      'Personal Identifiers: Full name, mobile number, email address, delivery address, state, and pincode.',
      'Commercial Information: Order history, cart items, GSTIN numbers, and payment transaction reference numbers.',
      'Device & Usage Data: IP address, browser type, operating system, and app usage logs collected via secure cookies to optimize performance.',
    ],
  ],
  [
    '2. How We Use Your Information',
    [
      'To process and fulfill orders, issue GST invoices, arrange logistics delivery, and send order tracking updates via SMS and WhatsApp.',
      'To provide customer support, verify returns, handle warranty claims, and administer wallet rewards.',
      'To improve product offerings, website speed, and farm equipment recommendations.',
    ],
  ],
  [
    '3. Sharing of Information with Third Parties',
    [
      'We do NOT sell, rent, or trade your personal data to third-party advertisers.',
      'Data is shared strictly with essential operational partners under confidentiality agreements: courier logistics services (Delhivery, GATI, India Post), PCI-DSS certified payment gateways, and SMS/WhatsApp alert channels.',
    ],
  ],
  [
    '4. Cookies & Web Tracking',
    [
      'We use cookies to maintain your login session, save items in your cart, remember preferences, and analyze website analytics.',
      'You can disable cookies in your browser settings, though certain interactive shopping features may be limited.',
    ],
  ],
  [
    '5. Data Security & Encryption Safeguards',
    [
      'We implement 256-bit SSL encryption for data in transit and store records in secure cloud data centers with restricted access controls.',
    ],
  ],
  [
    '6. Your Data Rights & Grievance Redressal',
    [
      'You have the right to access, update, or request deletion of your personal account data at any time by contacting our Privacy Officer at privacy@shyamagrotools.com.',
    ],
  ],
];

const privacySectionsTranslations = {
  en: privacySections,
};

function InfoShell({ eyebrow, title, description, children }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="static-info-shell min-h-screen bg-light font-poppins">
      <Header onLoginClick={() => setIsLoginOpen(true)} />
      <main className="static-info-container max-w-[1440px] mx-auto px-4 py-8">
        <section className="static-info-hero bg-dark text-white rounded-xl p-8 mb-8 text-center relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-[3px] text-primary block mb-2">{eyebrow}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white mb-3">{title}</h1>
          {description ? <p className="text-sm text-gray-300 max-w-3xl mx-auto leading-relaxed">{description}</p> : null}
        </section>
        {children}
      </main>
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

function AccordionList({ sections }) {
  return (
    <div className="static-info-list flex flex-col gap-6">
      {sections.map((section, idx) => (
        <section key={idx} className="static-info-section bg-white border border-gray-100 rounded-xl p-6 shadow-2xs">
          <h2 className="text-lg font-black text-dark uppercase tracking-tight mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="w-2 h-5 bg-primary rounded-full"></span>
            <span>{section.title}</span>
          </h2>
          <div className="static-info-accordion flex flex-col gap-3">
            {section.items.map(([question, answer], qIdx) => (
              <details key={qIdx} className="group border border-gray-100 rounded-lg p-4 transition-all hover:border-primary/40 bg-gray-50/40">
                <summary className="flex items-center justify-between cursor-pointer font-bold text-sm text-dark select-none">
                  <span className="flex items-center gap-2">
                    <HelpCircle size={16} className="text-primary shrink-0" />
                    <span>{question}</span>
                  </span>
                  <ChevronDown size={18} className="text-gray-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 leading-relaxed pl-6">{answer}</p>
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
    <div className="static-info-list flex flex-col gap-6">
      {sections.map(([title, paragraphs], idx) => (
        <section key={idx} className="static-info-section static-info-policy bg-white border border-gray-100 rounded-xl p-6 shadow-2xs">
          <h2 className="text-lg font-black text-dark uppercase tracking-tight mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="w-2 h-5 bg-primary rounded-full"></span>
            <span>{title}</span>
          </h2>
          <div className="flex flex-col gap-3">
            {paragraphs.map((paragraph, pIdx) => (
              <p key={pIdx} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                <span>{paragraph}</span>
              </p>
            ))}
          </div>
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
      title={t('faq') || "Frequently Asked Questions"}
      description="Detailed answers regarding farm machinery ordering, payment security, bulk commercial quotes, express delivery logistics, returns, and manufacturer warranties."
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
      eyebrow={t('supportChat.title') || "24/7 Assistance"}
      title={t('helpCenter') || "Help Center & User Guide"}
      description="Comprehensive user guides for account management, ordering farm tools, applying promo codes, tracking shipments, downloading GST invoices, and handling returns."
    >
      <div className="static-info-actions flex flex-wrap gap-4 mb-8 bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
        <Link to="/contact-us" className="bg-primary text-white font-bold text-xs uppercase px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Mail size={18} /> {t('contactUs') || 'Email Customer Support'}
        </Link>
        <a href="tel:+919912649265" className="bg-dark text-white font-bold text-xs uppercase px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-dark/90 transition-colors">
          <Phone size={18} /> {t('supportChat.mobile') || 'Call Helpline (+91 9912649265)'}
        </a>
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
      eyebrow={t('contactUs') || "Contact & Location"}
      title={t('contactUs') || "Contact Us"}
      description="Reach our customer support team, sales department, or corporate logistics office for order assistance, bulk quotes, and product technical guidance."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {rows.map((row, idx) => {
          const Icon = row.icon;
          const content = (
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-2xs flex items-start gap-4 hover:border-primary/40 transition-all h-full">
              <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon size={22} />
              </span>
              <div>
                <small className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{row.label}</small>
                <strong className="block text-xs font-extrabold text-dark leading-snug">{row.value}</strong>
              </div>
            </div>
          );
          return row.href ? (
            <a key={idx} href={row.href} className="block group">{content}</a>
          ) : (
            <div key={idx}>{content}</div>
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
      eyebrow={t('termsConditions') || "Legal Terms"}
      title={t('termsConditions') || "Terms of Service"}
      description="Official legal terms governing platform access, commercial orders, GST tax invoicing, risk of loss, intellectual property, and warranty disclaimers for Shyam Agro Tools."
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
      eyebrow={t('privacyPolicy') || "Data Protection"}
      title={t('privacyPolicy') || "Privacy Policy"}
      description="Our commitment to safeguarding customer personal data, SSL payment security, logistics data sharing, cookie tracking, and user data privacy rights."
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
      eyebrow={t('refundPolicy') || "Returns & Guarantee"}
      title={t('refundPolicy') || "Return & Refund Policy"}
      description="Comprehensive policy detailing our 7-day replacement guarantee, return eligibility, non-returnable categories, reverse pickup procedures, and refund timelines."
    >
      <PolicyList sections={data} />
    </InfoShell>
  );
}

export const customerServicePages = [
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/help-center', label: 'Help Center', icon: LifeBuoy },
  { path: '/contact-us', label: 'Contact Support', icon: Mail },
  { path: '/terms-of-service', label: 'Terms of Service', icon: FileText },
  { path: '/privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
  { path: '/return-refund-policy', label: 'Return & Refund Policy', icon: RefreshCcw },
];
