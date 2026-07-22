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

// Admin Auth & Layout
import AdminLoginPage from './ADMIN/AdminLoginPage';
import AdminForgotPassword from './ADMIN/AdminForgotPassword';
import AdminVerifyOTP from './ADMIN/AdminVerifyOTP';
import AdminLayout from './ADMIN/AdminLayout';
import AdminDashboard from './ADMIN/dashboard/AdminDashboard';

// Admin Catalog
import CategoriesList from './ADMIN/catalog/CategoriesList';
import CategoryForm from './ADMIN/catalog/CategoryForm';
import SubcategoriesList from './ADMIN/catalog/SubcategoriesList';
import SubcategoryForm from './ADMIN/catalog/SubcategoryForm';
import ProductsList from './ADMIN/catalog/ProductsList';
import ProductsForm from './ADMIN/catalog/ProductsForm';

// Admin Customers
import CustomersList from './ADMIN/admin customers/CustomersList';
import Customer from './ADMIN/admin customers/Customer';

// Admin Analytics & Support
import ReportsScreen from './ADMIN/reports/ReportsScreen';
import TicketsScreen from './ADMIN/tickets/TicketsScreen';

// Admin Orders & Logistics
import OrdersLedger from './ADMIN/admin orders/OrdersLedger';
import TrackingOrder from './ADMIN/admin orders/TrackingOrder';
import ShippingOrder from './ADMIN/admin orders/ShippingOrder';

// Admin Invoices
import InvoicesList from './ADMIN/invoices/InvoicesList';
import AddInvoice from './ADMIN/invoices/AddInvoice';

// Admin Returns & Stock
import AdminReturns from './ADMIN/returns/AdminReturns';
import StockUpdates from './ADMIN/stock/StockUpdates';

// Admin Marketing, Brands, Blogs
import CouponsList from './ADMIN/marketing/CouponsList';
import Coupon from './ADMIN/marketing/Coupon';
import BrandsList from './ADMIN/brands/BrandsList';
import BrandForm from './ADMIN/brands/BrandForm';
import BlogsList from './ADMIN/blogs/BlogsList';
import BlogForm from './ADMIN/blogs/BlogForm';

// Admin Staff & Suppliers
import StaffList from './ADMIN/staff/StaffList';
import AddStaff from './ADMIN/staff/AddStaff';
import SuppliersList from './ADMIN/suppliers/SuppliersList';
import SuppliersForm from './ADMIN/suppliers/SuppliersForm';
import NewSuppliersList from './ADMIN/suppliers/NewSuppliersList';
import CoinsConverterScreen from './ADMIN/coins/CoinsConverterScreen';

// Admin Settings & Screens
import FormSettings from './ADMIN/settings/FormSettings';
import TableOfContent from './ADMIN/settings/TableOfContent';
import DescriptionManager from './ADMIN/screens/DescriptionManager';
import ContactCard from './ADMIN/screens/ContactCard';
import FooterConfig from './ADMIN/screens/FooterConfig';
import PaymentHistory from './ADMIN/screens/PaymentHistory';
import CallHistoryScreen from './ADMIN/screens/CallHistoryScreen';

// Admin Testimonials
import TestimonialsList from './ADMIN/testimonials/TestimonialsList';
import TestimonialForm from './ADMIN/testimonials/TestimonialForm';

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
                    {/* User Routes */}
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
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />

                      {/* Catalog Routes */}
                      <Route path="catalog" element={<CategoriesList />} />
                      <Route path="catalog/categories" element={<CategoriesList />} />
                      <Route path="catalog/category" element={<CategoryForm />} />
                      <Route path="catalog/subcategories" element={<SubcategoriesList />} />
                      <Route path="catalog/subcategory" element={<SubcategoryForm />} />
                      <Route path="catalog/products" element={<ProductsList />} />
                      <Route path="catalog/products-form" element={<ProductsForm />} />
                      <Route path="categories" element={<CategoriesList />} />
                      <Route path="products" element={<ProductsList />} />

                      {/* Customers Routes */}
                      <Route path="customers" element={<CustomersList />} />
                      <Route path="customers/list" element={<CustomersList />} />
                      <Route path="customers/customer" element={<Customer />} />
                      <Route path="users" element={<CustomersList />} />

                      {/* Reports & Support Tickets */}
                      <Route path="reports" element={<ReportsScreen />} />
                      <Route path="tickets" element={<TicketsScreen />} />

                      {/* Orders & Tracking Routes */}
                      <Route path="orders" element={<OrdersLedger />} />
                      <Route path="orders/list" element={<OrdersLedger />} />
                      <Route path="orders/tracking" element={<TrackingOrder />} />
                      <Route path="orders/shipping" element={<ShippingOrder />} />

                      {/* Returns & Refunds Routes */}
                      <Route path="returns" element={<AdminReturns />} />
                      <Route path="returns/list" element={<AdminReturns />} />

                      {/* Stock & Inventory */}
                      <Route path="stock" element={<StockUpdates />} />
                      <Route path="stockupdates" element={<StockUpdates />} />
                      <Route path="stock-updates" element={<StockUpdates />} />

                      {/* Marketing Routes */}
                      <Route path="marketing" element={<CouponsList />} />
                      <Route path="marketing/coupons" element={<CouponsList />} />
                      <Route path="marketing/coupon" element={<Coupon />} />

                      {/* Brands Routes */}
                      <Route path="brands" element={<BrandsList />} />
                      <Route path="brands/list" element={<BrandsList />} />
                      <Route path="brands/add" element={<BrandForm />} />
                      <Route path="brands/form" element={<BrandForm />} />

                      {/* Blogs Routes */}
                      <Route path="blogs" element={<BlogsList />} />
                      <Route path="blogs/list" element={<BlogsList />} />
                      <Route path="blogs/add" element={<BlogForm />} />
                      <Route path="blogs/form" element={<BlogForm />} />

                      {/* Staff Routes */}
                      <Route path="staff" element={<StaffList />} />
                      <Route path="staff/list" element={<StaffList />} />
                      <Route path="staff/add" element={<AddStaff />} />

                      {/* Suppliers Routes */}
                      <Route path="suppliers" element={<SuppliersList />} />
                      <Route path="suppliers/list" element={<SuppliersList />} />
                      <Route path="suppliers/add" element={<SuppliersForm />} />
                      <Route path="suppliers/new" element={<NewSuppliersList />} />

                      {/* Coins Converter Routes */}
                      <Route path="coins" element={<CoinsConverterScreen />} />
                      <Route path="coins/converter" element={<CoinsConverterScreen />} />

                      {/* Invoices Routes */}
                      <Route path="invoice" element={<InvoicesList />} />
                      <Route path="invoice/add" element={<AddInvoice />} />

                      {/* Settings Routes */}
                      <Route path="settings" element={<FormSettings />} />
                      <Route path="settings/general" element={<FormSettings />} />
                      <Route path="settings/toc" element={<TableOfContent />} />
                      <Route path="settings/form" element={<FormSettings />} />
                      <Route path="descriptions" element={<DescriptionManager />} />
                      <Route path="contact-card" element={<ContactCard />} />
                      <Route path="footer" element={<FooterConfig />} />
                      <Route path="payments" element={<PaymentHistory />} />

                      {/* Testimonials Routes */}
                      <Route path="testimonials" element={<TestimonialsList />} />
                      <Route path="testimonials/list" element={<TestimonialsList />} />
                      <Route path="testimonials/add" element={<TestimonialForm />} />

                      {/* Call History Routes */}
                      <Route path="call-history" element={<CallHistoryScreen />} />
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
