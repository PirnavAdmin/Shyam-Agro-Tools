import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../context/CategoryContext';
import { getCategoryImage } from '../../services/categoryService';
import { getSubcategoryImage } from '../../services/subcategoryService';
import { getProducts, searchProducts } from '../../services/productService';
import { getUserProfile, updateUserProfile, uploadUserProfileImage } from '../../services/userProfileService';
import { getWallet } from '../../services/walletService';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import { getAuthSession, setAuthSession } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ShoppingBag, Heart, User, Search, Phone, Mail, LogOut, Package, Wallet, Menu, X, FileText, MapPin } from 'lucide-react';
import { buildSearchResults } from '../utils/searchIndex';
import LanguageDropdown from './LanguageDropdown';
import headerLogo from '../../asset/headerlogo-cropped.png';
import './Header.css';

const topBarAnnouncements = [
  '🚚 Free Shipping on Orders Above ₹5000',
  '🎉 Special Discounts on Selected Products',
  '🌱 100% Genuine Agricultural Products',
  '⚡ Fast & Secure Delivery Across India',
  '💳 Easy & Secure Online Payments',
  '⭐ Trusted by Thousands of Farmers',
  '🌾 Premium Quality Farming Equipment',
  '🎁 Exciting Offers Available This Week',
].filter((announcement) => !announcement.toLowerCase().includes('offers'));

const uniqueProducts = (products) =>
  Array.from(
    new Map(products.filter(Boolean).map((product, index) => [product.id || `product-${index}`, product])).values()
  );

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount, cartItems, cartSubtotal, removeFromCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { showToast } = useToast();
  const { t, productText, categoryText, subcategoryText } = useLanguage();
  const { mappedCategories, activeSubcategories } = useCategories();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountInfoOpen, setAccountInfoOpen] = useState(false);
  const [walletDetails, setWalletDetails] = useState(null);

  useEffect(() => {
    if (!user) {
      setWalletDetails(null);
      return;
    }
    let isMounted = true;
    const fetchWallet = async () => {
      try {
        const data = await getWallet();
        if (isMounted) {
          setWalletDetails(data);
        }
      } catch (err) {
        console.warn('Failed to fetch wallet for header:', err);
      }
    };
    fetchWallet();

    const handleWalletUpdate = () => {
      try {
        const userId = user?.id || user?.phone || 'guest';
        const rawLocal = localStorage.getItem(`Agro_wallet_${userId}`);
        if (rawLocal && isMounted) {
          setWalletDetails(JSON.parse(rawLocal));
        }
      } catch (e) {
        console.warn(e);
      }
    };
    window.addEventListener('storage', handleWalletUpdate);
    window.addEventListener('auth:user-updated', fetchWallet);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleWalletUpdate);
      window.removeEventListener('auth:user-updated', fetchWallet);
    };
  }, [user]);
  const [savingAccountField, setSavingAccountField] = useState('');
  const [loadingAccountProfile, setLoadingAccountProfile] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: '',
    email: '',
    profileImage: '',
    doorNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const profileMenuRef = useRef(null);
  const profilePhotoInputRef = useRef(null);

  const headerWalletCoins = walletDetails ? walletDetails.balance : (user?.wallet || 0);
  const headerWalletRate = walletDetails?.raw?.conversionRate || 1;
  const headerWalletRupees = Math.round(headerWalletCoins * headerWalletRate);

  const searchResults = useMemo(
    () => buildSearchResults({
      query: searchQuery,
      productText,
      products: searchedProducts,
      categories: mappedCategories,
      subcategories: activeSubcategories,
    }),
    [activeSubcategories, mappedCategories, productText, searchQuery, searchedProducts]
  );

  const productSuggestions = searchResults.products.map((product) => ({
      id: `product-${product.id}`,
      title: productText(product, 'name'),
      type: t('matchingProducts'),
      image: getProductImage(product),
      path: `/product/${product.id}`,
    }));
  const categorySuggestions = searchResults.categories.map((category) => ({
    id: `category-${category.id}`,
    title: categoryText(category),
    type: t('matchingCategories'),
    image: getCategoryImage(category.imageUrl),
    path: `/category/${category.id}`,
  }));
  const subcategorySuggestions = searchResults.subcategories.map((subcategory) => ({
    id: `subcategory-${subcategory.id}`,
    title: subcategoryText(subcategory),
    type: t('matchingSubcategories'),
    image: getSubcategoryImage(subcategory.imageUrl),
    path: `/category/${subcategory.categoryId}`,
  }));
  const pageSuggestions = searchResults.pages.map((page) => ({
    id: `page-${page.id}`,
    title: page.title,
    type: page.type,
    image: '',
    path: page.path,
  }));
  const searchSuggestions = [
    ...categorySuggestions,
    ...subcategorySuggestions,
    ...productSuggestions,
    ...pageSuggestions,
  ].slice(0, 8);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('appTheme', 'light');
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    let isMounted = true;

    if (!query) {
      setSearchedProducts([]);
      setIsSearchingProducts(false);
      return undefined;
    }

    setIsSearchingProducts(true);
    const timer = window.setTimeout(async () => {
      try {
        const [keywordProducts, allProducts] = await Promise.all([
          searchProducts(query).catch(() => []),
          getProducts().catch(() => []),
        ]);

        if (isMounted) {
          setSearchedProducts(uniqueProducts([...keywordProducts, ...allProducts]));
        }
      } finally {
        if (isMounted) setIsSearchingProducts(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', closeProfileMenu);
    return () => document.removeEventListener('mousedown', closeProfileMenu);
  }, []);

  useEffect(() => {
    if (!user) return;
    setAccountForm({
      name: user.name || '',
      phone: user.phone || user.mobileNumber || user.MobileNumber || '',
      email: user.email || user.Email || '',
      profileImage: user.profileImage || user.profileImageUrl || '',
      doorNo: user.doorNo || user.address?.doorNo || '',
      street: user.street || user.streetArea || user.address?.street || '',
      city: user.city || user.address?.city || '',
      state: user.state || user.address?.state || '',
      pincode: user.pincode || user.address?.pincode || '',
    });
    setProfileImageFile(null);
  }, [user]);

  const handleSignOut = () => {
    logout();
    setProfileOpen(false);
    setAccountInfoOpen(false);
    setIsMobileMenuOpen(false);
    showToast(t('signedOutSuccessfully'));
    navigate('/');
  };

  const openAccountInfo = () => {
    if (!user) {
      onLoginClick?.();
      return;
    }
    setAccountForm({
      name: user.name || '',
      phone: user.phone || user.mobileNumber || user.MobileNumber || '',
      email: user.email || user.Email || '',
      profileImage: user.profileImage || user.profileImageUrl || '',
      doorNo: user.doorNo || user.address?.doorNo || '',
      street: user.street || user.streetArea || user.address?.street || '',
      city: user.city || user.address?.city || '',
      state: user.state || user.address?.state || '',
      pincode: user.pincode || user.address?.pincode || '',
    });
    setProfileImageFile(null);
    setProfileOpen(false);
    setIsMobileMenuOpen(false);
    setAccountInfoOpen(true);
  };

  useEffect(() => {
    let isMounted = true;
    const currentPhone = user?.phone || user?.mobileNumber || user?.MobileNumber || '';

    if (!accountInfoOpen || !currentPhone) return undefined;

    setLoadingAccountProfile(true);
    getUserProfile(currentPhone)
      .then((profile) => {
        if (!isMounted || !profile) return;
        const nextFields = {
          name: profile.name || profile.fullName || profile.FullName || accountForm.name,
          phone: currentPhone,
          email: profile.email || profile.Email || accountForm.email,
          profileImage: profile.profileImage || profile.profileImageUrl || profile.ProfileImageUrl || accountForm.profileImage,
          doorNo: profile.doorNo || profile.DoorNo || accountForm.doorNo,
          street: profile.street || profile.streetArea || profile.StreetArea || accountForm.street,
          city: profile.city || profile.City || accountForm.city,
          state: profile.state || profile.State || accountForm.state,
          pincode: profile.pincode || profile.Pincode || accountForm.pincode,
        };
        setAccountForm(nextFields);
        persistAccountUser(nextFields);
      })
      .catch(() => {
        if (isMounted) showToast('Showing saved profile details.');
      })
      .finally(() => {
        if (isMounted) setLoadingAccountProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accountInfoOpen, user?.phone, user?.mobileNumber, user?.MobileNumber]);

  const persistAccountUser = (nextFields) => {
    if (!user) return;
    const session = getAuthSession() || { user, token: user.token || '', refreshToken: user.refreshToken || '' };
    const nextUser = {
      ...session.user,
      ...user,
      ...nextFields,
      mobileNumber: nextFields.phone,
      MobileNumber: nextFields.phone,
      fullName: nextFields.name,
      FullName: nextFields.name,
      Email: nextFields.email,
      profileImage: nextFields.profileImage,
      profileImageUrl: nextFields.profileImage,
      doorNo: nextFields.doorNo,
      street: nextFields.street,
      streetArea: nextFields.street,
      city: nextFields.city,
      state: nextFields.state,
      pincode: nextFields.pincode,
      address: {
        ...(session.user?.address || user.address || {}),
        doorNo: nextFields.doorNo,
        street: nextFields.street,
        city: nextFields.city,
        state: nextFields.state,
        pincode: nextFields.pincode,
      },
    };
    const saved = setAuthSession({ ...session, user: nextUser });
    window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: saved.user }));
  };

  const handleAccountInputChange = (field, value) => {
    if (field === 'phone') return;
    const nextValue = ['phone', 'pincode'].includes(field)
      ? value.replace(/\D/g, '').slice(0, field === 'pincode' ? 6 : 10)
      : value;
    setAccountForm((current) => ({ ...current, [field]: nextValue }));
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAccountForm((current) => {
      if (current.profileImage?.startsWith('blob:')) URL.revokeObjectURL(current.profileImage);
      return { ...current, profileImage: URL.createObjectURL(file) };
    });
    setProfileImageFile(file);
  };

  const saveProfileForm = async () => {
    if (savingAccountField) return;

    const nextForm = {
      ...accountForm,
      name: String(accountForm.name || '').trim(),
      email: String(accountForm.email || '').trim(),
      doorNo: String(accountForm.doorNo || '').trim(),
      street: String(accountForm.street || '').trim(),
      city: String(accountForm.city || '').trim(),
      state: String(accountForm.state || '').trim(),
      pincode: String(accountForm.pincode || '').trim(),
    };
    const currentPhone = String(user?.phone || user?.mobileNumber || user?.MobileNumber || accountForm.phone || '')
      .replace(/\D/g, '')
      .slice(-10);
    nextForm.phone = currentPhone;

    if (!nextForm.name) {
      showToast('Name is required.', 'error');
      return;
    }
    if (nextForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextForm.email)) {
      showToast('Enter a valid email address.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(nextForm.phone)) {
      showToast('Mobile number must be 10 digits.', 'error');
      return;
    }

    setSavingAccountField('profile');

    try {
      let profileImageUrl = nextForm.profileImage;
      if (profileImageFile) {
        const uploadedImageUrl = await uploadUserProfileImage(currentPhone, profileImageFile);
        if (uploadedImageUrl) profileImageUrl = uploadedImageUrl;
      }
      nextForm.profileImage = profileImageUrl;
      nextForm.profileImageUrl = profileImageUrl;

      const updatedUser = await updateUserProfile(currentPhone, nextForm);
      const savedFields = {
        ...nextForm,
        name: updatedUser.name || updatedUser.fullName || updatedUser.FullName || nextForm.name,
        phone: updatedUser.phone || updatedUser.mobileNumber || updatedUser.MobileNumber || nextForm.phone,
        email: updatedUser.email || updatedUser.Email || nextForm.email,
        profileImage: updatedUser.profileImage || updatedUser.profileImageUrl || updatedUser.ProfileImageUrl || nextForm.profileImage,
        doorNo: updatedUser.doorNo || updatedUser.DoorNo || nextForm.doorNo,
        street: updatedUser.street || updatedUser.streetArea || updatedUser.StreetArea || nextForm.street,
        city: updatedUser.city || updatedUser.City || nextForm.city,
        state: updatedUser.state || updatedUser.State || nextForm.state,
        pincode: updatedUser.pincode || updatedUser.Pincode || nextForm.pincode,
      };

      setAccountForm(savedFields);
      setProfileImageFile(null);
      persistAccountUser(savedFields);
      showToast('Profile updated.');
    } catch (error) {
      showToast(error.message || 'Unable to update profile.', 'error');
    } finally {
      setSavingAccountField('');
    }
  };

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('categories'), path: '/categories' },
    { name: t('featured'), path: '/featured' },
  ];

  const mobileMenuLinks = [
    ...navLinks,
    { name: t('yourWishlist'), path: '/wishlist' },
    { name: t('shoppingCart'), path: '/cart' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navigateFromMobileMenu = (path) => {
    closeMobileMenu();
    navigate(path);
  };

  const closeSearch = () => setIsSearchOpen(false);

  const submitSearch = (event) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    closeSearch();
    closeMobileMenu();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const goToSearchResult = (path) => {
    closeSearch();
    closeMobileMenu();
    setSearchQuery('');
    navigate(path);
  };

  const renderSearchBox = (variant = 'desktop') => {
    const isDesktop = variant === 'desktop';

    return (
      <form
        onSubmit={submitSearch}
        className={`header-search-form relative group/search ${isDesktop ? 'hidden md:block' : 'block'}`}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          placeholder="Search categories, products..."
          aria-label="Search categories, products and pages"
          className={`header-search-input ${
            isDesktop ? 'header-search-input-desktop' : 'header-search-input-mobile'
          }`}
        />
        <button
          type="submit"
          className="header-search-button"
          aria-label={t('search')}
        >
          <img src="/search-magnifier.svg" alt="" className="header-search-icon" aria-hidden="true" />
        </button>

        <AnimatePresence>
          {isSearchOpen && searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onMouseDown={(event) => event.preventDefault()}
              className={`absolute top-full z-[130] mt-3 overflow-hidden rounded-md border border-gray-100 bg-white shadow-2xl ${
                isDesktop ? 'right-0 w-[320px]' : 'left-0 w-full'
              }`}
            >
              {searchSuggestions.length > 0 ? (
                <>
                  <div className="max-h-[360px] overflow-y-auto p-2">
                    {searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goToSearchResult(item.path)}
                        className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors hover:bg-[#F3FAEF]"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            onError={handleProductImageError}
                            className="h-10 w-10 shrink-0 rounded-sm border border-gray-100 object-contain"
                          />
                        ) : (
                          <span className="icon-shade icon-teal h-10 w-10 shrink-0">
                            {item.type === 'Page' ? <FileText size={15} /> : <Search size={15} />}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-dark">{item.title}</span>
                          <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            {item.type}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={submitSearch}
                    className="flex w-full items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-dark hover:text-primary"
                  >
                    <span>{t('viewAllResults')}</span>
                    <span>{searchResults.total}</span>
                  </button>
                </>
              ) : isSearchingProducts ? (
                <div className="p-6 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading...</p>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t('noSearchResults')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    );
  };

  return (
    <header className="site-header w-full font-poppins">
      {/* 1. TOP HEADER BAR */}
      <div className="top-header-bar bg-dark text-white text-[10px] py-1.5 px-4 md:px-10 flex flex-wrap justify-between items-center border-b border-white/10 tracking-wider">
        <div className="top-header-contact flex gap-6 items-center flex-wrap">
          <div className="top-header-contact-item flex items-center gap-2">
            <span className="icon-shade icon-teal icon-shade-sm"><Phone size={12} /></span>
            <Link to="/contact-support" className="top-header-contact-link">+91 98765 43210</Link>
          </div>
          <div className="top-header-contact-item flex items-center gap-2 hidden sm:flex">
            <span className="icon-shade icon-grey icon-shade-sm"><Mail size={12} /></span>
            <Link to="/contact-support" className="top-header-contact-link">support@shyamagro.com</Link>
          </div>
          <Link to="/become-seller" className="top-header-seller-link hidden sm:inline">
            Become a Supplier
          </Link>
        </div>
        <div className="top-header-promo hidden md:block text-center flex-1">
          {topBarAnnouncements.map((announcement, index) => (
            <span
              key={announcement}
              className="top-header-announcement"
              style={{ '--announcement-index': index }}
            >
              {announcement}
            </span>
          ))}
        </div>
        <div className="top-header-tools flex gap-4 items-center font-semibold">
          <Link to="/track-order" className="top-header-track-link border-l border-white/20 pl-4">
            Track Order
          </Link>
          <LanguageDropdown />
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <div className="header-main-navbar w-full bg-white py-3 transition-shadow duration-300 z-[9998]">
        <div className="header-main-inner w-full px-4 md:px-10 flex justify-between items-center">
          
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="icon-shade icon-grey lg:hidden text-dark"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t('menu')}
            aria-expanded={isMobileMenuOpen}
          >
            <Menu size={28} />
          </button>

          {/* Logo */}
          <Link to="/" className="header-brand-link flex items-center gap-3 group">
            <img src={headerLogo} alt="Shyam Agro" className="site-header-logo transition-transform group-hover:scale-105" />
            <h1 className="header-brand-title hidden sm:block text-lg md:text-xl font-black tracking-tight text-dark whitespace-nowrap">
              SHYAM AGRO<span className="header-brand-accent text-primary"> TOOLS</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className="header-nav-link relative text-sm font-bold tracking-widest text-dark hover:text-primary transition-colors duration-300 group py-2"
              >
                {link.name}
                <span className="header-nav-underline absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          <div className="header-center-search">
            {renderSearchBox('desktop')}
          </div>

          {/* Right Side Icons */}
          <div className="header-actions flex items-center gap-4 md:gap-6">
            <div className="profile-menu-wrap relative hidden sm:block" ref={profileMenuRef}>
              <button
                type="button"
                className="profile-menu-button header-profile-button flex items-center gap-2 text-dark hover:text-primary transition-all"
                onClick={() => {
                  if (!user) {
                    onLoginClick?.();
                    return;
                  }
                  setProfileOpen((prev) => !prev);
                }}
                aria-haspopup={user ? 'menu' : undefined}
                aria-expanded={user ? profileOpen : undefined}
              >
                <div className="header-icon-button icon-shade icon-grey border border-gray-100">
                  <User size={18} />
                </div>
                {user && <span className="text-xs font-bold whitespace-nowrap hidden lg:block">{String(user.name || 'User').split(' ')[0]}</span>}
              </button>
              {user && profileOpen && (
                <div className="account-dropdown absolute right-0 top-full mt-4 w-52 shadow-2xl z-[9999]">
                  <div className="account-dropdown-header">
                    <p className="account-dropdown-kicker">Profile</p>
                    <p className="account-dropdown-name">{user.name || 'User'}</p>
                  </div>
                  <div className="account-dropdown-menu">
                    <button type="button" className="account-dropdown-item" onClick={openAccountInfo}>
                      <User size={16} /> Profile
                    </button>
                    <Link to="/my-orders" onClick={() => setProfileOpen(false)} className="account-dropdown-item">
                      <Package size={16} /> {t('myOrders')}
                    </Link>
                    <button type="button" className="account-dropdown-item" onClick={() => {
                      setProfileOpen(false);
                      navigate('/wallet');
                    }}>
                       <Wallet size={16} /> {t('wallet')} (₹{headerWalletRupees})
                    </button>
                    <div className="account-dropdown-divider"></div>
                    <button type="button" onClick={handleSignOut} className="account-dropdown-item account-dropdown-signout">
                      <LogOut size={16} /> {t('signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/wishlist')}
              className="header-action-link text-dark hover:text-primary transition-all relative group"
              aria-label={`Wishlist (${wishlistCount})`}
            >
              <div className="header-icon-button icon-shade icon-yellow border border-gray-100">
                <Heart size={18} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
              </div>
              <span className="header-badge absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">{wishlistCount}</span>
            </button>

            {/* Redesigned Cart Section */}
            <div className="header-cart-wrap relative group">
              <div 
                onClick={() => navigate('/cart')}
                className="header-cart-trigger flex items-center gap-3 cursor-pointer group/cart"
              >
                <div className="header-icon-button icon-shade icon-teal h-12 w-12 shadow-lg">
                  <ShoppingBag size={20} strokeWidth={2.5} />
                </div>
                <span className="header-badge header-cart-badge bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">{cartCount}</span>
                <div className="header-cart-copy hidden xl:block">
                  <p className="text-[13px] font-bold text-dark leading-none mb-1">{t('shoppingCart')}</p>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">₹{cartSubtotal.toFixed(2)} - {cartCount} {cartCount === 1 ? t('cartItem') : t('cartItems')}</p>
                </div>
              </div>

              {/* Cart Dropdown */}
              <div className="absolute right-0 top-full mt-4 w-80 bg-white shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 z-[100] transform translate-y-2 group-hover:translate-y-0 rounded-sm">
                <div className="p-6 max-h-[400px] overflow-y-auto">
                  {cartItems.length > 0 ? (
                    <div className="flex flex-col gap-5">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                          <span className="app-line-thumb-sm rounded-sm border border-gray-100 p-1">
                            <img src={getProductImage(item)} alt={item.name} loading="lazy" onError={handleProductImageError} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-black text-dark uppercase truncate">{productText(item, 'name')}</h4>
                            <p className="text-[10px] text-primary font-black mt-1.5 bg-primary/5 px-2 py-0.5 rounded-full inline-block">{item.quantity} x ₹{item.price.toLocaleString()}</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                            className="icon-shade icon-grey icon-shade-sm"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-[2px]">{t('emptyCart')}</p>
                      <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {cartItems.length > 0 && (
                  <div className="p-5 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-gray-400 uppercase">{t('subtotal')}</span>
                      <span className="text-lg font-black text-dark">₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => navigate('/cart')} className="btn-outline py-3 text-[10px] font-black uppercase">{t('viewCart')}</button>
                      <button onClick={() => navigate('/checkout')} className="btn-primary py-3 text-[10px] font-black uppercase">{t('checkout')}</button>
                    </div>
                  </div>
                )}
                <div className="h-1 w-full bg-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/60 z-[10020] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 w-[80%] max-w-[300px] h-full bg-white z-[10030] shadow-2xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-bold">{t('menu')}</h2>
                <button type="button" onClick={closeMobileMenu} aria-label={t('closeMenu')} className="icon-shade icon-grey">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col gap-6">
                {mobileMenuLinks.map((link) => (
                  <button
                    type="button"
                    key={link.name} 
                    className="border-b border-gray-100 pb-2 text-left text-lg font-bold tracking-widest text-dark hover:text-primary"
                    onClick={() => navigateFromMobileMenu(link.path)}
                  >
                    {link.name}
                  </button>
                ))}
              </nav>
              <div className="mt-10 flex flex-col gap-4">
                {renderSearchBox('mobile')}
                <LanguageDropdown variant="mobile" />
                {user ? (
                  <>
                    <button type="button" onClick={openAccountInfo} className="btn-outline w-full py-4">
                      Profile
                    </button>
                    <button type="button" onClick={() => navigateFromMobileMenu('/wallet')} className="btn-outline w-full py-4">
                      {t('wallet')}
                    </button>
                    <button onClick={() => navigateFromMobileMenu('/my-orders')} className="btn-primary w-full py-4">
                      {t('myOrders')}
                    </button>
                    <button type="button" onClick={handleSignOut} className="w-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold uppercase tracking-widest text-red-500">
                      {t('signOut')}
                    </button>
                  </>
                ) : (
                  <button onClick={() => { closeMobileMenu(); onLoginClick?.(); }} className="btn-primary w-full py-4">
                    {t('signIn')}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {accountInfoOpen && user && (
          <motion.div
            className="account-info-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setAccountInfoOpen(false)}
          >
            <motion.div
              className="account-info-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="account-info-title"
            >
              <div className="account-info-modal-header">
                <div>
                  <span>Profile</span>
                  <h2 id="account-info-title">Edit Profile</h2>
                  {loadingAccountProfile && <small>Loading latest profile...</small>}
                </div>
                <button type="button" onClick={() => setAccountInfoOpen(false)} aria-label="Close profile">
                  <X size={18} />
                </button>
              </div>

              <div className="account-profile-form">
                <div className="account-photo-section">
                  <div className="account-avatar">
                    {accountForm.profileImage ? (
                      <img src={accountForm.profileImage} alt="Profile" />
                    ) : (
                      <span>{String(accountForm.name || user.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="account-change-photo"
                    onClick={() => profilePhotoInputRef.current?.click()}
                  >
                    <Camera size={16} /> Change Photo
                  </button>
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="account-photo-input"
                    onChange={handleProfilePhotoChange}
                  />
                </div>

                <section className="account-form-section">
                  <h3>Personal Details</h3>
                  {[
                    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Enter your full name', required: true },
                    { key: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'Enter your email address' },
                    { key: 'phone', label: 'Mobile Number', icon: Phone, type: 'tel', placeholder: 'Mobile number', required: true, readOnly: true },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <label className={`account-form-field ${field.readOnly ? 'account-form-field-readonly' : ''}`} key={field.key}>
                        <span><Icon size={16} /> {field.label}{field.required ? ' *' : ''}</span>
                        <input
                          type={field.type}
                          value={accountForm[field.key] || ''}
                          placeholder={field.placeholder}
                          readOnly={field.readOnly}
                          aria-readonly={field.readOnly || undefined}
                          onChange={(event) => handleAccountInputChange(field.key, event.target.value)}
                        />
                        {field.readOnly && <small>Mobile number cannot be edited.</small>}
                      </label>
                    );
                  })}
                </section>

                <section className="account-form-section">
                  <h3>Address Information</h3>
                  {[
                    { key: 'doorNo', label: 'Door No / House No', placeholder: 'Enter door or house number' },
                    { key: 'street', label: 'Street / Area', placeholder: 'Enter street or area' },
                    { key: 'city', label: 'City', placeholder: 'Enter city' },
                    { key: 'state', label: 'State', placeholder: 'Enter state' },
                    { key: 'pincode', label: 'Pincode', placeholder: 'Enter pincode' },
                  ].map((field) => (
                    <label className="account-form-field" key={field.key}>
                      <span><MapPin size={16} /> {field.label}</span>
                      <input
                        type={field.key === 'pincode' ? 'tel' : 'text'}
                        value={accountForm[field.key] || ''}
                        placeholder={field.placeholder}
                        onChange={(event) => handleAccountInputChange(field.key, event.target.value)}
                      />
                    </label>
                  ))}
                </section>
              </div>

              <div className="account-profile-footer">
                <button
                  type="button"
                  className="account-save-profile"
                  onClick={saveProfileForm}
                  disabled={Boolean(savingAccountField)}
                >
                  {savingAccountField ? <span className="account-info-saving-dot" /> : <Check size={17} />}
                  {savingAccountField ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
