import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
import {
  getProfileImageFromSource,
  getUserProfile,
  normalizeProfileImageUrl,
  updateUserProfile,
  withImageCacheBust,
} from '../../services/userProfileService';
import { getWallet } from '../../services/walletService';
import { getProductImage, handleProductImageError } from '../../utils/productImage';
import { getAuthSession, setAuthSession } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ShoppingBag, Heart, User, Search, Phone, Mail, LogOut, Package, Wallet, Menu, X, FileText, MapPin } from 'lucide-react';
import { buildSearchResults } from '../utils/searchIndex';
import LanguageDropdown from './LanguageDropdown';
import headerLogo from '../../asset/headerlogo-new.png';
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

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const SUPPORTED_PROFILE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const isLocalProfileImage = (url = '') => String(url).startsWith('blob:') || String(url).startsWith('data:');
const PROFILE_IMAGE_STORAGE_PREFIX = 'Agro_profile_image_';

const getProfileOwnerKey = (source = {}) => {
  const account = source || {};
  const phone = account.phone || account.mobileNumber || account.MobileNumber || account.Mobile || account.mobile || '';
  const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
  return normalizedPhone || account.id || account.userId || account.customerId || '';
};

const getStoredProfileImage = (source = {}) => {
  const ownerKey = getProfileOwnerKey(source || {});
  if (!ownerKey) return '';
  try {
    const val = localStorage.getItem(`${PROFILE_IMAGE_STORAGE_PREFIX}${ownerKey}`) || '';
    if (val.startsWith('blob:')) {
      localStorage.removeItem(`${PROFILE_IMAGE_STORAGE_PREFIX}${ownerKey}`);
      return '';
    }
    return val;
  } catch {
    return '';
  }
};

const setStoredProfileImage = (source = {}, imageUrl = '') => {
  const ownerKey = getProfileOwnerKey(source || {});
  if (!ownerKey || !imageUrl) return;
  try {
    localStorage.setItem(`${PROFILE_IMAGE_STORAGE_PREFIX}${ownerKey}`, imageUrl);
  } catch (error) {
    console.warn('Unable to persist profile image preview:', error);
  }
};

const getResolvedProfileImage = (source = {}, fallback = {}) => {
  const primary = source || {};
  const secondary = fallback || {};
  return (
    getStoredProfileImage(primary) ||
    getStoredProfileImage(secondary) ||
    getProfileImageFromSource(primary) ||
    getProfileImageFromSource(secondary) ||
    secondary.profileImage ||
    secondary.profileImageUrl ||
    ''
  );
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read profile image.'));
    reader.readAsDataURL(file);
  });

const compressImageToDataUrl = (file, maxWidth = 300, maxHeight = 300, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target.result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

const getAccountFieldsFromUser = (source = {}, fallback = {}) => ({
  name: source.name || source.fullName || source.FullName || fallback.name || '',
  phone: source.phone || source.mobileNumber || source.MobileNumber || fallback.phone || '',
  email: source.email || source.Email || fallback.email || '',
  profileImage: getResolvedProfileImage(source, fallback) || '',
  doorNo: source.doorNo || source.DoorNo || source.address?.doorNo || fallback.doorNo || '',
  street: source.street || source.streetArea || source.StreetArea || source.address?.street || fallback.street || '',
  city: source.city || source.City || source.address?.city || fallback.city || '',
  state: source.state || source.State || source.address?.state || fallback.state || '',
  pincode: source.pincode || source.Pincode || source.address?.pincode || fallback.pincode || '',
});

const UserAvatar = ({ user }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getResolvedProfileImage(user);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (imageUrl && !hasError) {
    return (
      <img
        src={normalizeProfileImageUrl(imageUrl)}
        alt={user?.name || 'User'}
        className="w-full h-full object-cover rounded-full"
        onError={() => setHasError(true)}
      />
    );
  }

  return <User size={18} />;
};

const ModalAvatar = ({ accountForm, user }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getResolvedProfileImage(accountForm, user);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (imageUrl && !hasError) {
    return (
      <img
        src={normalizeProfileImageUrl(imageUrl)}
        alt="Profile"
        className="w-full h-full object-cover rounded-full"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <span className="text-2xl font-black text-[#58B82E]">
      {String(accountForm?.name || user?.name || 'U').charAt(0).toUpperCase()}
    </span>
  );
};

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
  const profileFetchIdRef = useRef(0);

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
    type: t('pages'),
    resultKind: 'page',
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
    if (accountInfoOpen) return;
    setAccountForm(getAccountFieldsFromUser(user));
    setProfileImageFile(null);
  }, [accountInfoOpen, user]);

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
    setAccountForm(getAccountFieldsFromUser(user));
    setProfileImageFile(null);
    setProfileOpen(false);
    setIsMobileMenuOpen(false);
    setAccountInfoOpen(true);
  };

  const persistAccountUser = useCallback((nextFields) => {
    if (!user) return;
    const session = getAuthSession() || { user, token: user.token || '', refreshToken: user.refreshToken || '' };
    const owner = {
      ...session.user,
      ...user,
      ...nextFields,
    };
    const resolvedProfileImage = getResolvedProfileImage(nextFields, owner);
    const sessionProfileImage = isLocalProfileImage(resolvedProfileImage)
      ? getProfileImageFromSource(session.user) || getProfileImageFromSource(user) || ''
      : normalizeProfileImageUrl(resolvedProfileImage);
    if (resolvedProfileImage) {
      setStoredProfileImage(owner, resolvedProfileImage);
    }
    const nextUser = {
      ...session.user,
      ...user,
      ...nextFields,
      mobileNumber: nextFields.phone,
      MobileNumber: nextFields.phone,
      fullName: nextFields.name,
      FullName: nextFields.name,
      Email: nextFields.email,
      profileImage: sessionProfileImage,
      ProfileImage: sessionProfileImage,
      profileImageUrl: sessionProfileImage,
      ProfileImageUrl: sessionProfileImage,
      profilePicture: sessionProfileImage,
      profilePhoto: sessionProfileImage,
      avatar: sessionProfileImage,
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
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const currentPhone = user?.phone || user?.mobileNumber || user?.MobileNumber || '';

    if (!accountInfoOpen || !currentPhone) return undefined;
    if (savingAccountField) return undefined;
    if (profileImageFile) return undefined;

    const fetchId = profileFetchIdRef.current + 1;
    profileFetchIdRef.current = fetchId;
    setLoadingAccountProfile(true);
    getUserProfile(currentPhone)
      .then((profile) => {
        if (!isMounted || profileFetchIdRef.current !== fetchId || !profile) return;
        setAccountForm((current) => {
          return getAccountFieldsFromUser(profile, { ...current, phone: currentPhone });
        });
      })
      .catch(() => {
        if (isMounted && profileFetchIdRef.current === fetchId) showToast(t('showingSavedProfileDetails'));
      })
      .finally(() => {
        if (isMounted && profileFetchIdRef.current === fetchId) setLoadingAccountProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accountInfoOpen, profileImageFile, savingAccountField, showToast, t, user?.phone, user?.mobileNumber, user?.MobileNumber]);

  const handleAccountInputChange = (field, value) => {
    if (field === 'phone') return;
    const nextValue = ['phone', 'pincode'].includes(field)
      ? value.replace(/\D/g, '').slice(0, field === 'pincode' ? 6 : 10)
      : value;
    setAccountForm((current) => ({ ...current, [field]: nextValue }));
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_PROFILE_IMAGE_TYPES.has(file.type)) {
      showToast(t('unsupportedProfileImageType') || 'Please select a JPG, PNG, WEBP, or GIF image.', 'error');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      showToast(t('profileImageTooLarge') || 'Profile image must be smaller than 2MB.', 'error');
      event.target.value = '';
      return;
    }

    setProfileImageFile(file);

    try {
      const previewUrl = await readFileAsDataUrl(file);
      setAccountForm((current) => {
        if (current.profileImage?.startsWith('blob:')) URL.revokeObjectURL(current.profileImage);
        const next = { ...current, profileImage: previewUrl, profileImageUrl: previewUrl };
        setStoredProfileImage(next, previewUrl);
        return next;
      });
    } catch {
      setAccountForm((current) => {
        if (current.profileImage?.startsWith('blob:')) URL.revokeObjectURL(current.profileImage);
        const previewUrl = URL.createObjectURL(file);
        const next = { ...current, profileImage: previewUrl, profileImageUrl: previewUrl };
        setStoredProfileImage(next, previewUrl);
        return next;
      });
    }
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
      showToast(t('nameRequired'), 'error');
      return;
    }
    if (nextForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextForm.email)) {
      showToast(t('validEmailAddress'), 'error');
      return;
    }
    if (!/^\d{10}$/.test(nextForm.phone)) {
      showToast(t('mobileNumberTenDigits'), 'error');
      return;
    }

    setSavingAccountField('profile');
    setLoadingAccountProfile(false);
    profileFetchIdRef.current += 1;

    try {
      let profileImageUrl = nextForm.profileImage;
      let uploadedImageUrl = '';
      const localPreviewImage = isLocalProfileImage(nextForm.profileImage) ? nextForm.profileImage : '';
      if (localPreviewImage) {
        setStoredProfileImage(nextForm, localPreviewImage);
      }
      if (profileImageFile) {
        try {
          uploadedImageUrl = await compressImageToDataUrl(profileImageFile);
          if (uploadedImageUrl) profileImageUrl = uploadedImageUrl;
        } catch (uploadError) {
          console.warn('Profile image conversion failed. Keeping local preview.', uploadError);
          profileImageUrl = localPreviewImage || profileImageUrl;
        }
      }
      if (uploadedImageUrl) {
        setStoredProfileImage(nextForm, withImageCacheBust(uploadedImageUrl));
      }
      const finalImageUrl = withImageCacheBust(profileImageUrl);

      nextForm.profileImage = finalImageUrl;
      nextForm.profileImageUrl = finalImageUrl;

      const serverProfileImage = uploadedImageUrl || (isLocalProfileImage(profileImageUrl) ? '' : profileImageUrl);
      const updatedUser = await updateUserProfile(currentPhone, {
        ...nextForm,
        profileImage: serverProfileImage,
        profileImageUrl: serverProfileImage,
      });
      const latestProfile = await getUserProfile(currentPhone).catch(() => updatedUser);
      const persistedImage =
        uploadedImageUrl ||
        getProfileImageFromSource(updatedUser) ||
        getProfileImageFromSource(latestProfile) ||
        localPreviewImage ||
        finalImageUrl;
      const savedFields = {
        ...nextForm,
        ...getAccountFieldsFromUser(latestProfile, getAccountFieldsFromUser(updatedUser, nextForm)),
        profileImage: isLocalProfileImage(persistedImage) ? persistedImage : withImageCacheBust(persistedImage || nextForm.profileImage),
        profileImageUrl: isLocalProfileImage(persistedImage) ? persistedImage : withImageCacheBust(persistedImage || nextForm.profileImage),
      };

      setAccountForm(savedFields);
      setProfileImageFile(null);
      if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
      persistAccountUser(savedFields);
      showToast(t('profileUpdated'));
    } catch (error) {
      showToast(error.message || t('unableUpdateProfile'), 'error');
    } finally {
      setSavingAccountField('');
      setLoadingAccountProfile(false);
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
          placeholder={t('searchCategoriesProducts')}
          aria-label={t('searchCategoriesProductsPages')}
          className={`header-search-input ${
            isDesktop ? 'header-search-input-desktop' : 'header-search-input-mobile'
          }`}
        />
        <button
          type="submit"
          className="header-search-button"
          aria-label={t('search')}
        >
          <Search className="header-search-icon" size={15} aria-hidden="true" />
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
                            {item.resultKind === 'page' ? <FileText size={15} /> : <Search size={15} />}
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
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">{t('loading')}</p>
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
      <div className="top-header-bar bg-dark text-white text-[10px] py-1.5 border-b border-white/10 tracking-wider">
        <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-6 flex flex-wrap justify-between items-center">
          <div className="top-header-contact flex gap-4 md:gap-6 items-center flex-wrap">
            <div className="top-header-contact-item flex items-center gap-2">
              <span className="icon-shade icon-teal icon-shade-sm"><Phone size={12} /></span>
              <Link to="/contact-support" className="top-header-contact-link">+91 9912649265</Link>
            </div>
            <div className="top-header-contact-item flex items-center gap-2 hidden sm:flex">
              <span className="icon-shade icon-grey icon-shade-sm"><Mail size={12} /></span>
              <Link to="/contact-support" className="top-header-contact-link">Support@shyamagrotools.com</Link>
            </div>
            <Link to="/become-seller" className="top-header-seller-link hidden sm:inline">
              {t('becomeSeller')}
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
              {t('orderTracking')}
            </Link>
            <LanguageDropdown />
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <div className="header-main-navbar w-full bg-white py-3 transition-shadow duration-300 z-[9998]">
        <div className="header-main-inner max-w-[1600px] mx-auto w-full px-4 lg:px-6 flex justify-between items-center">
          
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
            <img src={headerLogo} alt="Shyam Agro" className="site-header-logo transition-transform" />
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
                <div className="header-icon-button icon-shade icon-grey border border-gray-100 overflow-hidden relative">
                  <UserAvatar user={user} />
                </div>
                {user && <span className="text-xs font-bold whitespace-nowrap hidden lg:block">{String(user.name || 'User').split(' ')[0]}</span>}
              </button>
              {user && profileOpen && (
                <div className="account-dropdown absolute right-0 top-full mt-4 w-52 shadow-2xl z-[9999]">
                  <div className="account-dropdown-header">
                    <p className="account-dropdown-kicker">{t('profile')}</p>
                    <p className="account-dropdown-name">{user.name || 'User'}</p>
                  </div>
                  <div className="account-dropdown-menu">
                    <button type="button" className="account-dropdown-item" onClick={openAccountInfo}>
                      <User size={16} /> {t('profile')}
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
                      {t('profile')}
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
                  <span>{t('profile')}</span>
                  <h2 id="account-info-title">{t('editProfile')}</h2>
                  {loadingAccountProfile && <small>{t('loadingLatestProfile')}</small>}
                </div>
                <button type="button" onClick={() => setAccountInfoOpen(false)} aria-label={t('closeProfile')}>
                  <X size={18} />
                </button>
              </div>

              <div className="account-profile-form">
                <div className="account-photo-section">
                  <div className="account-avatar flex items-center justify-center overflow-hidden rounded-full w-20 h-20 bg-[#58B82E]/10 border-2 border-[#58B82E]">
                    <ModalAvatar accountForm={accountForm} user={user} />
                  </div>
                  <button
                    type="button"
                    className="account-change-photo"
                    onClick={() => profilePhotoInputRef.current?.click()}
                  >
                    <Camera size={16} /> {t('changePhoto')}
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
                  <h3>{t('personalDetails')}</h3>
                  {[
                    { key: 'name', label: t('fullName'), icon: User, type: 'text', placeholder: t('enterFullName'), required: true },
                    { key: 'email', label: t('emailAddress'), icon: Mail, type: 'email', placeholder: t('enterEmailAddress') },
                    { key: 'phone', label: t('mobileNumber'), icon: Phone, type: 'tel', placeholder: t('mobileNumber'), required: true, readOnly: true },
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
                        {field.readOnly && <small>{t('mobileNumberCannotBeEdited')}</small>}
                      </label>
                    );
                  })}
                </section>

                <section className="account-form-section">
                  <h3>{t('addressInformation')}</h3>
                  {[
                    { key: 'doorNo', label: t('doorNoHouseNo'), placeholder: t('enterDoorHouseNumber') },
                    { key: 'street', label: t('streetArea'), placeholder: t('enterStreetArea') },
                    { key: 'city', label: t('city'), placeholder: t('enterCity') },
                    { key: 'state', label: t('state'), placeholder: t('enterState') },
                    { key: 'pincode', label: t('pincode'), placeholder: t('enterPincode') },
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
                  {savingAccountField ? t('saving') : t('saveProfile')}
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


