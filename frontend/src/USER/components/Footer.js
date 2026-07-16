import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import headerLogo from '../../asset/headerlogo-cropped.png';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('');

  const customerServiceLinks = [
    { to: '/faq', label: t('faq') || 'FAQ' },
    { to: '/help-center', label: t('helpCenter') || 'Help Center' },
    { to: '/contact-us', label: t('contactUs') || 'Contact Us' },
    { to: '/terms-of-service', label: t('termsConditions') || 'Terms of Service' },
    { to: '/privacy-policy', label: t('privacyPolicy') || 'Privacy Policy' },
    { to: '/return-refund-policy', label: t('refundPolicy') || 'Return & Refund Policy' },
  ];

  const handleSubscribe = (event) => {
    event.preventDefault();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!isValidEmail) {
      setSubscribeStatus('Please enter a valid email address.');
      return;
    }

    setSubscribeStatus('Subscribed successfully.');
    setEmail('');
  };

  return (
    <footer className="site-footer bg-dark text-white font-poppins">
      <div className="site-footer-grid max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        
        {/* About Section */}
        <div className="site-footer-col flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={headerLogo} alt="Shyam Agro" className="site-footer-logo" />
            <h1 className="site-footer-brand text-2xl font-bold tracking-tight">SHYAM AGRO</h1>
          </Link>
          <p className="site-footer-text text-gray-400 text-sm leading-relaxed">
            {t('footerAbout')}
          </p>
          <div className="site-footer-social flex gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 bg-white/10 flex items-center justify-center rounded-full hover:bg-primary transition-colors"
            >
              <FaFacebookF size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 bg-white/10 flex items-center justify-center rounded-full hover:bg-primary transition-colors"
            >
              <FaTwitter size={18} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 bg-white/10 flex items-center justify-center rounded-full hover:bg-primary transition-colors"
            >
              <FaInstagram size={18} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 bg-white/10 flex items-center justify-center rounded-full hover:bg-primary transition-colors"
            >
              <FaYoutube size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="site-footer-col">
          <h4 className="text-lg font-bold mb-5 border-l-4 border-primary pl-4">{t('quickLinks')}</h4>
          <ul className="flex flex-col gap-3 text-gray-400 text-sm">
            <li><Link to="/" className="hover:text-primary transition-colors">{t('home')}</Link></li>
            <li><Link to="/categories" className="hover:text-primary transition-colors">{t('agricultureStore')}</Link></li>
            <li><Link to="/become-seller" className="hover:text-primary transition-colors">{t('becomeSeller')}</Link></li>
            <li><Link to="/track-order" className="hover:text-primary transition-colors">{t('orderTracking')}</Link></li>
            <li><Link to="/blog" className="hover:text-primary transition-colors">{t('agricultureBlog')}</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div className="site-footer-col">
          <h4 className="text-lg font-bold mb-5 border-l-4 border-primary pl-4">{t('customerService')}</h4>
          <ul className="flex flex-col gap-3 text-gray-400 text-sm">
            {customerServiceLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-primary transition-colors">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="site-footer-col">
          <h4 className="text-lg font-bold mb-5 border-l-4 border-primary pl-4">{t('getInTouch')}</h4>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <MapPin className="text-primary flex-shrink-0" size={20} />
              <p className="text-gray-400 text-sm">Shyam Agro Tools, Madhapur, Hyderabad - 520011</p>
            </div>
            <div className="flex gap-4">
              <Phone className="text-primary flex-shrink-0" size={20} />
              <p className="text-gray-400 text-sm">+91 9398649798</p>
            </div>
            <div className="flex gap-4">
              <Mail className="text-primary flex-shrink-0" size={20} />
              <p className="text-gray-400 text-sm">support@shyamagrotools.com</p>
            </div>
            <div className="site-footer-newsletter mt-1">
              <p className="text-sm font-bold mb-3">{t('newsletter')}</p>
              <form className="site-footer-subscribe flex" onSubmit={handleSubscribe} noValidate>
                <input 
                  type="email" 
                  placeholder={t('yourEmail')} 
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (subscribeStatus) setSubscribeStatus('');
                  }}
                  className="bg-white/10 border-none px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none flex-1"
                  aria-label={t('yourEmail')}
                />
                <button type="submit" className="bg-primary px-4 py-2 hover:bg-[#5eaa28] transition-colors" aria-label={t('newsletter')}>
                  <Send size={18} />
                </button>
              </form>
              {subscribeStatus && (
                <p className={`mt-2 text-xs font-semibold ${subscribeStatus.includes('successfully') ? 'text-primary' : 'text-red-300'}`}>
                  {subscribeStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="site-footer-bottom border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 text-xs">
          © 2026 <span className="text-white font-bold">SHYAM AGRO TOOLS</span>. {t('allRightsReserved')}.
        </p>
        <div className="site-footer-payments flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 w-auto" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4 w-auto" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png" alt="Paypal" className="h-4 w-auto" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
