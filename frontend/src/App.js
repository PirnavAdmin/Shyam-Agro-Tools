import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './USER/pages/Home';
import CategoriesPage from './USER/pages/CategoriesPage';
import SingleCategoryPage from './USER/pages/SingleCategoryPage';
import ProductDetailsPage from './USER/pages/ProductDetailsPage';
import FeaturedPage from './USER/pages/FeaturedPage';
import ProductsPage from './USER/pages/ProductsPage';
import SearchPage from './USER/pages/SearchPage';
import CartPage from './USER/pages/CartPage';
import WishlistPage from './USER/pages/WishlistPage';
import BecomeSeller from './USER/pages/BecomeSeller';
import ContactSupport from './USER/pages/ContactSupport';
import WalletPage from './USER/pages/WalletPage';
import {
  FAQPage,
  HelpCenterPage,
  ContactUsPage,
  TermsOfServicePage,
  PrivacyPolicyPage,
  ReturnRefundPolicyPage,
} from './USER/pages/StaticInfoPages';
import TrackOrder from './USER/pages/TrackOrder';
import MyOrdersPage from './USER/pages/MyOrdersPage';
import CheckoutPage from './USER/pages/CheckoutPage';
import PaymentPage from './USER/pages/PaymentPage';
import InvoicePage from './USER/pages/InvoicePage';
import AdminLoginPage from './ADMIN/AdminLoginPage';
import AdminForgotPassword from './ADMIN/AdminForgotPassword';
import AdminVerifyOTP from './ADMIN/AdminVerifyOTP';
import AdminLayout from './ADMIN/AdminLayout';
import AdminDashboard from './ADMIN/dashboard/AdminDashboard';
import Suppliers from './ADMIN/suppliers/SuppliersList';
import Orders from './ADMIN/admin orders/OrdersLedger';
import CoinsConverter from './ADMIN/coins/CoinsConverterScreen';
import PaymentHistory from './ADMIN/screens/PaymentHistory';
import Categories from './ADMIN/screens/Categories';
import ProductList from './ADMIN/screens/ProductList';
import DescriptionManager from './ADMIN/screens/DescriptionManager';
import ContactCard from './ADMIN/screens/ContactCard';
import FooterConfig from './ADMIN/screens/FooterConfig';
import Users from './ADMIN/screens/Users';
import Returns from './ADMIN/returns/AdminReturns';
import { CartProvider } from './USER/context/CartContext';
import { AuthProvider } from './USER/context/AuthContext';
import { LanguageProvider } from './USER/context/LanguageContext';
import { ToastProvider } from './USER/context/ToastContext';
import { WishlistProvider } from './USER/context/WishlistContext';
import { CategoryProvider } from './USER/context/CategoryContext';
import SupportChat from './components/SupportChat/SupportChat';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './USER/components/ProtectedRoute';
import LoginPopup from './USER/components/LoginPopup';
import { useAuth } from './USER/context/AuthContext';

const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

const AuthenticationChallenge = () => {
  const { authChallenge, clearAuthChallenge } = useAuth();
  if (!authChallenge) return null;
  return (
    <LoginPopup
      isOpen
      redirectTo={authChallenge.returnTo}
      onClose={clearAuthChallenge}
    />
  );
};

function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'dark';
    const theme = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <Router>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CategoryProvider>
                <div className="app">
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/categories" element={protect(<CategoriesPage />)} />
                    <Route path="/products" element={protect(<ProductsPage />)} />
                    <Route path="/search" element={protect(<SearchPage />)} />
                    <Route path="/featured" element={protect(<FeaturedPage />)} />
                    <Route path="/offers" element={protect(<ProductsPage mode="offers" />)} />
                    <Route path="/offers/40-percent" element={protect(<ProductsPage mode="forty-percent" />)} />
                    <Route path="/new-arrivals" element={protect(<ProductsPage mode="new-arrivals" />)} />
                    <Route path="/category/:id" element={protect(<SingleCategoryPage />)} />
                    <Route path="/product/:id" element={protect(<ProductDetailsPage />)} />
                    <Route path="/cart" element={protect(<CartPage />)} />
                    <Route path="/wishlist" element={protect(<WishlistPage />)} />
                    <Route path="/become-seller" element={protect(<BecomeSeller />)} />
                    <Route path="/contact-support" element={protect(<ContactSupport />)} />
                    <Route path="/wallet" element={protect(<WalletPage />)} />
                    <Route path="/track-order" element={protect(<TrackOrder />)} />
                    <Route path="/my-orders" element={protect(<MyOrdersPage />)} />
                    <Route path="/checkout" element={protect(<CheckoutPage />)} />
                    <Route path="/payment" element={protect(<PaymentPage />)} />
                    <Route path="/invoice" element={protect(<InvoicePage />)} />
                    <Route path="/account" element={protect(<MyOrdersPage />)} />
                    <Route path="/faq" element={protect(<FAQPage />)} />
                    <Route path="/help-center" element={protect(<HelpCenterPage />)} />
                    <Route path="/contact-us" element={protect(<ContactUsPage />)} />
                    <Route path="/terms-of-service" element={protect(<TermsOfServicePage />)} />
                    <Route path="/privacy-policy" element={protect(<PrivacyPolicyPage />)} />
                    <Route path="/return-refund-policy" element={protect(<ReturnRefundPolicyPage />)} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
                    <Route path="/admin/verify-otp" element={<AdminVerifyOTP />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="suppliers" element={<Suppliers />} />
                      <Route path="orders" element={<Orders />} />
                      <Route path="coins" element={<CoinsConverter />} />
                      <Route path="payments" element={<PaymentHistory />} />
                      <Route path="categories" element={<Categories />} />
                      <Route path="products" element={<ProductList />} />
                      <Route path="image-categorizer" element={<ProductList />} />
                      <Route path="descriptions" element={<DescriptionManager />} />
                      <Route path="contact-card" element={<ContactCard />} />
                      <Route path="footer" element={<FooterConfig />} />
                      <Route path="users" element={<Users />} />
                      <Route path="returns" element={<Returns />} />
                    </Route>
                  </Routes>
                  <SupportChat />
                  <AuthenticationChallenge />
                </div>
                </CategoryProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
