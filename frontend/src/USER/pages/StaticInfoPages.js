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

const returnPolicySections = [
  ['Return Eligibility Period', ['Customers may request a return, replacement, or refund within 7 days of delivery unless otherwise specified on the product page.', 'Requests submitted after the return period may not be eligible.']],
  ['Eligible Reasons for Return or Replacement', ['Wrong product delivered, damaged product, manufacturing defect, missing parts or accessories, or non-functional product on delivery may qualify for return or replacement.', 'Shyam Agro Tools may request photographs, videos, invoices, or additional information to verify the issue.']],
  ['How to Raise a Return Request', ['Provide order number, product name, description of the issue, photos or videos of the product, and packaging images if applicable.', 'Failure to provide supporting information may delay processing.']],
  ['Return Approval Process', ['Our support team will review the complaint, request additional information if required, and approve, reject, or escalate the request for inspection.', 'If approved, pickup arrangements or return instructions will be provided.']],
  ['Conditions for Accepted Returns', ['Product must be returned in original condition with all accessories, manuals, and packaging.', 'The product should not show signs of misuse, intentional damage, unauthorized repair, or modification.']],
  ['Non-Returnable Products', ['Returns may not be accepted for requests after the return window, products damaged by misuse, customized products, consumables, perishable items, or products marked non-returnable.']],
  ['Replacement Policy', ['Where applicable, Shyam Agro Tools may provide full product replacement, replacement of defective parts, or exchange for an equivalent product based on availability and verification.']],
  ['Refund Policy', ['Refunds may be approved when replacement is unavailable, product cannot be repaired, order is cancelled before shipment, or a returned product passes inspection.', 'Prepaid order refunds go to the original payment method. Cash on Delivery refunds may require bank details.']],
  ['Refund Processing Time', ['Approved refunds are generally processed within 5 to 10 business days after verification and approval. Actual credit timelines vary by bank and payment provider.']],
  ['Order Cancellation Policy', ['Orders may be cancelled before shipment. If the order has shipped, cancellation may not be possible and return procedures may apply.', 'Shyam Agro Tools may cancel orders because of stock issues, pricing errors, incomplete delivery information, non-serviceable locations, suspected fraud, or legal restrictions.']],
  ['Warranty Claims', ['Warranty coverage, if available, is provided by the manufacturer, brand, or seller.', 'To claim warranty service, contact support, provide proof of purchase, share photographs or videos, and follow the inspection or service instructions provided.']],
];

const termsSections = [
  ['About Shyam Agro Tools', ['Shyam Agro Tools is an agriculture-focused e-commerce platform for agricultural equipment, machinery, tools, irrigation products, farm supplies, and related products.', 'Business Address: Madhapur, Hyderabad - 520011, Telangana, India.']],
  ['Eligibility', ['You must be at least 18 years old and capable of entering into a legally binding agreement to use our platform.', 'By using the platform, you confirm that the information you provide is accurate and complete.']],
  ['User Accounts', ['You are responsible for maintaining confidentiality of your account credentials and all activity under your account.', 'Shyam Agro Tools may suspend or terminate accounts that violate these terms.']],
  ['Products and Services', ['We try to provide accurate descriptions, images, specifications, and pricing. Product images are for illustration and actual products may vary slightly.', 'Availability is subject to stock levels and product updates from manufacturers or sellers.']],
  ['Third-Party Sellers', ['Certain products may be offered by third-party sellers. Product quality, warranty, and performance may vary by seller.', 'Shyam Agro Tools may assist in dispute resolution, but sellers remain responsible for the products they supply.']],
  ['Orders and Payments', ['When placing an order, you agree that the information provided is accurate and you are authorized to use the selected payment method.', 'We may refuse, cancel, or limit orders because of pricing errors, suspected fraud, product unavailability, or service limitations.']],
  ['Shipping and Delivery', ['Delivery timelines are estimates. Delays may occur due to logistics, weather, holidays, strikes, government restrictions, or other circumstances beyond our control.']],
  ['Returns, Replacements and Refunds', ['Eligible products may be returned or replaced according to our Return & Refund Policy. Certain products may be non-returnable.']],
  ['Prohibited Activities', ['Users must not provide false information, engage in fraud, upload harmful code, violate intellectual property rights, harass others, interfere with platform security, or use the platform for unlawful activities.']],
  ['Intellectual Property', ['All trademarks, logos, graphics, content, software, and materials displayed on the platform belong to Shyam Agro Tools or their respective owners.']],
  ['Privacy', ['Your use of the platform is governed by our Privacy Policy. By using the platform, you consent to information handling as described there.']],
  ['Limitation of Liability', ['To the maximum extent permitted by law, Shyam Agro Tools is not liable for indirect, incidental, special, consequential, or punitive damages beyond the value of the specific order giving rise to the claim.']],
  ['Governing Law and Jurisdiction', ['These terms are governed by Indian law. Disputes are subject to the competent courts located in Hyderabad, Telangana, India.']],
];

const privacySections = [
  ['Information We Collect', ['We may collect name, phone number, email, delivery address, order information, payment reference details, device data, support messages, and account activity needed to operate the platform.']],
  ['How We Use Information', ['We use customer information to create accounts, process orders, arrange delivery, provide support, prevent fraud, improve products, send service updates, and comply with legal obligations.']],
  ['Payments', ['Payments are handled through secure payment partners. We do not ask customers to share full card numbers, OTPs, UPI PINs, or passwords with support staff.']],
  ['Sharing of Information', ['We may share necessary details with logistics partners, payment providers, service vendors, sellers, or legal authorities when needed to complete orders or meet legal requirements.']],
  ['Data Security', ['We use reasonable administrative, technical, and operational safeguards to protect customer information from unauthorized access, misuse, loss, or disclosure.']],
  ['Customer Choices', ['Customers can update account information, contact support for assistance, and opt out of promotional communication where available.']],
  ['Retention', ['We keep information as long as needed for orders, support, accounting, fraud prevention, legal compliance, and platform operations.']],
  ['Contact for Privacy', ['For privacy questions, contact support@shyamagrotools.com or call +91 9398649798.']],
];

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
      {sections.map((section) => (
        <section key={section.title} className="static-info-section">
          <h2>{section.title}</h2>
          <div className="static-info-accordion">
            {section.items.map(([question, answer]) => (
              <details key={question}>
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
      {sections.map(([title, paragraphs]) => (
        <section key={title} className="static-info-section static-info-policy">
          <h2>{title}</h2>
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
    </div>
  );
}

export function FAQPage() {
  return (
    <InfoShell
      eyebrow="Customer Service"
      title="FAQ"
      description="Answers to common questions about orders, payments, shipping, products, returns, and account support."
    >
      <AccordionList sections={faqSections} />
    </InfoShell>
  );
}

export function HelpCenterPage() {
  return (
    <InfoShell
      eyebrow="Support"
      title="Help Center"
      description="Find guidance for shopping, checkout, delivery, returns, technical issues, and account help."
    >
      <div className="static-info-actions">
        <Link to="/contact-us"><Mail size={18} /> Email support</Link>
        <a href="tel:+919398649798"><Phone size={18} /> Call support</a>
      </div>
      <AccordionList sections={helpSections} />
    </InfoShell>
  );
}

export function ContactUsPage() {
  return (
    <InfoShell
      eyebrow="Contact"
      title="Contact Us"
      description="Reach our support team for order help, product guidance, bulk enquiries, or service questions."
    >
      <div className="static-contact-card">
        {contactRows.map((row) => {
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
            <a key={row.label} href={row.href}>{content}</a>
          ) : (
            <p key={row.label}>{content}</p>
          );
        })}
      </div>
    </InfoShell>
  );
}

export function TermsOfServicePage() {
  return (
    <InfoShell
      eyebrow="Legal"
      title="Terms of Service"
      description="Terms governing access to and use of the Shyam Agro Tools website, products, and services."
    >
      <PolicyList sections={termsSections} />
    </InfoShell>
  );
}

export function PrivacyPolicyPage() {
  return (
    <InfoShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="How Shyam Agro Tools collects, uses, protects, and shares customer information."
    >
      <PolicyList sections={privacySections} />
    </InfoShell>
  );
}

export function ReturnRefundPolicyPage() {
  return (
    <InfoShell
      eyebrow="Policy"
      title="Return & Refund Policy"
      description="Conditions under which customers may request returns, replacements, refunds, or cancellations."
    >
      <PolicyList sections={returnPolicySections} />
    </InfoShell>
  );
}

export const customerServicePages = [
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/help-center', label: 'Help Center', icon: LifeBuoy },
  { path: '/contact-us', label: 'Contact Us', icon: Mail },
  { path: '/terms-of-service', label: 'Terms of Service', icon: FileText },
  { path: '/privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
  { path: '/return-refund-policy', label: 'Return & Refund Policy', icon: RefreshCcw },
];
