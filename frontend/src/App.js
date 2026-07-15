import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './USER/pages/Home';
import CategoriesPage from './USER/pages/CategoriesPage';
import SingleCategoryPage from './USER/pages/SingleCategoryPage';
import ProductDetailsPage from './USER/pages/ProductDetailsPage';
import CartPage from './USER/pages/CartPage';
import BecomeSeller from './USER/pages/BecomeSeller';
import ContactSupport from './USER/pages/ContactSupport';
import TrackOrder from './USER/pages/TrackOrder';
import CheckoutPage from './USER/pages/CheckoutPage';
import WalletPage from './USER/pages/WalletPage';
import ReturnsPage from './USER/pages/ReturnsPage';

// New User Pages Imports
import BlogPage from './USER/pages/BlogPage';
import FeaturedPage from './USER/pages/FeaturedPage';
import MyOrdersPage from './USER/pages/MyOrdersPage';
import OffersPage from './USER/pages/OffersPage';
import PaymentPage from './USER/pages/PaymentPage';
import ProductsPage from './USER/pages/ProductsPage';
import SearchPage from './USER/pages/SearchPage';
import InvoicePage from './USER/pages/InvoicePage';
import WishlistPage from './USER/pages/WishlistPage';
import {
  FAQPage,
  HelpCenterPage,
  ContactUsPage,
  TermsOfServicePage,
  PrivacyPolicyPage,
  ReturnRefundPolicyPage
} from './USER/pages/StaticInfoPages';

// New Context Providers Imports
import { LanguageProvider } from './USER/context/LanguageContext';
import { ToastProvider } from './USER/context/ToastContext';
import { AuthProvider } from './USER/context/AuthContext';
import { CategoryProvider } from './USER/context/CategoryContext';
import { WishlistProvider } from './USER/context/WishlistContext';

import AdminLoginPage from './ADMIN/AdminLoginPage';
import AdminForgotPassword from './ADMIN/AdminForgotPassword';
import AdminVerifyOTP from './ADMIN/AdminVerifyOTP';
import AdminLayout from './ADMIN/AdminLayout';
import AdminDashboard from './ADMIN/dashboard/AdminDashboard';
import Suppliers from './ADMIN/suppliers/SuppliersList';
import OrdersLedger from './ADMIN/admin orders/OrdersLedger';
import TrackingOrder from './ADMIN/admin orders/TrackingOrder';
import ShippingOrder from './ADMIN/admin orders/ShippingOrder';
import CoinsConverter from './ADMIN/coins/CoinsConverterScreen';
import PaymentHistory from './ADMIN/screens/PaymentHistory';
import Categories from './ADMIN/screens/Categories';
import ProductList from './ADMIN/screens/ProductList';
import DescriptionManager from './ADMIN/screens/DescriptionManager';
import ContactCard from './ADMIN/screens/ContactCard';
import FooterConfig from './ADMIN/screens/FooterConfig';
import Users from './ADMIN/screens/Users';
import { CartProvider } from './USER/context/CartContext';
import TicketsScreen from './ADMIN/tickets/TicketsScreen';
import ReportsScreen from './ADMIN/reports/ReportsScreen';

// New Dropdown Screens Imports
import ProductsList from './ADMIN/catalog/ProductsList';
import ProductsForm from './ADMIN/catalog/ProductsForm';
import ProductFeatures from './ADMIN/catalog/ProductFeatures';
import ProductReviews from './ADMIN/catalog/ProductReviews';
import CategoriesList from './ADMIN/catalog/CategoriesList';
import Category from './ADMIN/catalog/Category';
import CustomersList from './ADMIN/admin customers/CustomersList';
import Customer from './ADMIN/admin customers/Customer';
import CouponsList from './ADMIN/marketing/CouponsList';
import Coupon from './ADMIN/marketing/Coupon';
import BlogsList from './ADMIN/blogs/BlogsList';
import BlogForm from './ADMIN/blogs/BlogForm';
import TableOfContent from './ADMIN/settings/TableOfContent';
import FormSettings from './ADMIN/settings/FormSettings';
import StaffList from './ADMIN/staff/StaffList';
import AddStaff from './ADMIN/staff/AddStaff';
import SubcategoryForm from './ADMIN/catalog/SubcategoryForm';
import SubcategoriesList from './ADMIN/catalog/SubcategoriesList';
import SuppliersForm from './ADMIN/suppliers/SuppliersForm';
import NewSuppliers from './ADMIN/suppliers/NewSuppliersList';
import BrandsList from './ADMIN/brands/BrandsList';
import BrandForm from './ADMIN/brands/BrandForm';
import CRMAppRoutes from './CRM/routes/AppRoutes';
import StockUpdates from './ADMIN/stock/StockUpdates';
import AdminProfile from './ADMIN/screens/AdminProfile';
import AdminAccountSettings from './ADMIN/screens/AdminAccountSettings';
import CallHistory from './CRM/pages/CallHistory/CallHistory';
import Invoice from './CRM/pages/Invoice/Invoice';
import AddInvoice from './CRM/pages/Invoice/AddInvoice';
import InvoiceDetails from './CRM/pages/Invoice/InvoiceDetails';
import { CRMProvider } from './CRM/context/CRMContext';
import TestimonialsList from './ADMIN/testimonials/TestimonialsList';
import TestimonialForm from './ADMIN/testimonials/TestimonialForm';
import AdminReturns from './ADMIN/returns/AdminReturns';


function App() {
  // Clean up stale/invalid user session data on app start
  React.useEffect(() => {
    const user = localStorage.getItem('user');

    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        // If the user object doesn't have a token (new API format), clear it
        if (!parsedUser.token) {
          localStorage.removeItem('user');
          console.log("Old mock user data cleared for API testing.");
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    // NOTE: Do NOT clear 'isAdmin' here — admin session must persist across page refreshes.
    // Admin logout is handled explicitly in AdminTopBar.js handleLogout().
  }, []);

  return (
    <Router>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <CategoryProvider>
              <WishlistProvider>
                <CartProvider>
                  <div className="app">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/category/:id" element={<SingleCategoryPage />} />
                      <Route path="/product/:id" element={<ProductDetailsPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/become-seller" element={<BecomeSeller />} />
                      <Route path="/contact-support" element={<ContactSupport />} />
                      <Route path="/track-order" element={<TrackOrder />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/wallet" element={<WalletPage />} />
                      <Route path="/returns" element={<ReturnsPage />} />
                      <Route path="/account" element={<Home />} /> {/* Temporary redirect/view */}
                      <Route path="/crm/*" element={<CRMAppRoutes />} />
                      
                      {/* Added Missing User Routes */}
                      <Route path="/products" element={<ProductsPage mode="all" />} />
                      <Route path="/offers" element={<OffersPage />} />
                      <Route path="/offers/40-percent" element={<ProductsPage mode="forty-percent" />} />
                      <Route path="/power-tillers" element={<ProductsPage mode="power-tillers" />} />
                      <Route path="/featured" element={<FeaturedPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/my-orders" element={<MyOrdersPage />} />
                      <Route path="/payment" element={<PaymentPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/help-center" element={<HelpCenterPage />} />
                      <Route path="/contact-us" element={<ContactUsPage />} />
                      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                      <Route path="/return-refund-policy" element={<ReturnRefundPolicyPage />} />
                      <Route path="/user/invoice" element={<InvoicePage />} />
                      
                      {/* Admin Routes */}
                      <Route path="/admin/login" element={<AdminLoginPage />} />
                      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
                      <Route path="/admin/verify-otp" element={<AdminVerifyOTP />} />
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="suppliers" element={<Suppliers />} />
                        <Route path="reports" element={<ReportsScreen />} />
                        <Route path="tickets" element={<TicketsScreen />} />
                        <Route path="orders" element={<OrdersLedger />} />
                        <Route path="coins" element={<CoinsConverter />} />
                        <Route path="payments" element={<PaymentHistory />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="products" element={<ProductList />} />
                        <Route path="descriptions" element={<DescriptionManager />} />
                        <Route path="contact-card" element={<ContactCard />} />
                        <Route path="footer" element={<FooterConfig />} />
                        <Route path="users" element={<Users />} />
                        <Route path="staff/list" element={<StaffList />} />
                        <Route path="staff/add" element={<AddStaff />} />
                        <Route path="suppliers/list" element={<Suppliers />} />
                        <Route path="suppliers/add" element={<SuppliersForm />} />
                        <Route path="suppliers/new" element={<NewSuppliers />} />
                        <Route path="suppliers/edit/:id" element={<SuppliersForm />} />
                        
                        {/* Dropdown Nested Routes */}
                        <Route path="catalog/products" element={<ProductsList />} />
                        <Route path="catalog/products-form" element={<ProductsForm />} />
                        <Route path="catalog/product-features" element={<ProductFeatures />} />
                        <Route path="catalog/product-reviews" element={<ProductReviews />} />
                        <Route path="catalog/categories" element={<CategoriesList />} />
                        <Route path="catalog/subcategories" element={<SubcategoriesList />} />
                        <Route path="catalog/category" element={<Category />} />
                        <Route path="catalog/subcategory" element={<SubcategoryForm />} />
                        <Route path="brands/list" element={<BrandsList />} />
                        <Route path="brands/form" element={<BrandForm />} />
                        <Route path="customers/list" element={<CustomersList />} />
                        <Route path="customers/customer" element={<Customer />} />
                        <Route path="orders/list" element={<OrdersLedger />} />
                        <Route path="orders/tracking" element={<TrackingOrder />} />
                        <Route path="orders/shipping" element={<ShippingOrder />} />
                        <Route path="returns" element={<AdminReturns />} />
                        <Route path="marketing/coupons" element={<CouponsList />} />
                        <Route path="marketing/coupon" element={<Coupon />} />
                        <Route path="blogs/list" element={<BlogsList />} />
                        <Route path="blogs/form" element={<BlogForm />} />
                        <Route path="testimonials/list" element={<TestimonialsList />} />
                        <Route path="testimonials/add" element={<TestimonialForm />} />
                        <Route path="settings/toc" element={<TableOfContent />} />
                        <Route path="settings/form" element={<FormSettings />} />
                        <Route path="stock-updates" element={<StockUpdates />} />
                        
                        {/* Profile & Account Settings */}
                        <Route path="profile" element={<AdminProfile />} />
                        <Route path="account-settings" element={<AdminAccountSettings />} />
          
                        {/* Call History & Invoices nested in Admin phase */}
                        <Route path="call-history" element={<CRMProvider><CallHistory /></CRMProvider>} />
                        <Route path="invoice" element={<CRMProvider><Invoice /></CRMProvider>} />
                        <Route path="invoice/add" element={<CRMProvider><AddInvoice /></CRMProvider>} />
                        <Route path="invoice/edit/:id" element={<CRMProvider><AddInvoice /></CRMProvider>} />
                        <Route path="invoice/details/:id" element={<CRMProvider><InvoiceDetails /></CRMProvider>} />
                      </Route>
          
                    </Routes>
                  </div>
                </CartProvider>
              </WishlistProvider>
            </CategoryProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
