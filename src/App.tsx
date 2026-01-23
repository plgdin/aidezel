import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';

// --- Static Shell Imports ---
import ClientLayout from './components/layout/ClientLayout';

// --- Lazy-Loaded Components ---
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const StaffLogin = lazy(() => import('./pages/staff/StaffLogin'));
const StaffRegister = lazy(() => import('./pages/staff/StaffRegister'));

const HomePage = lazy(() => import('./pages/client/Home'));
const ShopPage = lazy(() => import('./pages/client/Shop'));
const ProductDetails = lazy(() => import('./pages/client/ProductDetails'));
const Cart = lazy(() => import('./pages/client/Cart'));
const Checkout = lazy(() => import('./pages/client/Checkout'));
const UserAccount = lazy(() => import('./pages/client/UserAccount'));
const Wishlist = lazy(() => import('./pages/client/Wishlist'));
const OrderHistory = lazy(() => import('./pages/client/OrderHistory'));
const About = lazy(() => import('./pages/client/About'));
const Contact = lazy(() => import('./pages/client/Contact'));
const Terms = lazy(() => import('./pages/client/Terms'));
const Privacy = lazy(() => import('./pages/client/Privacy'));
const OrderInvoice = lazy(() => import('./pages/client/OrderInvoice'));
const BuyAgain = lazy(() => import('./pages/client/BuyAgain'));

const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const StaffLayout = lazy(() => import('./components/layout/StaffLayout'));

// --- DASHBOARDS ---
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));

// --- ADMIN & STAFF PAGES ---
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'));
const ManageOrders = lazy(() => import('./pages/admin/ManageOrders'));
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'));
const Inventory = lazy(() => import('./pages/admin/Inventory'));
const ManageLegal = lazy(() => import('./pages/admin/ManageLegal'));
const OrderInvoiceAdmin = lazy(() => import('./pages/admin/OrderInvoiceAdmin'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const ManageStaff = lazy(() => import('./pages/admin/ManageStaff'));

// NEW: Import the Ticket Management Page
const ManageTickets = lazy(() => import('./pages/admin/ManageTickets'));

const AppHelmetProvider = HelmetProvider as any;

const LoadingFallback = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
    <Loader2 className="animate-spin text-black mb-4" size={40} />
    <p className="text-sm font-bold tracking-tighter uppercase font-mono">Aidezel</p>
  </div>
);

function App() {
  return (
    <AppHelmetProvider>
      <Helmet>
        <title>Aidezel</title>
        <link rel="canonical" href="https://www.aidezel.co.uk" />
        <meta property="og:url" content="https://www.aidezel.co.uk" />
      </Helmet>

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* CLIENT ROUTES */}
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="account" element={<UserAccount />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="orders/:id" element={<OrderInvoice />} />
            <Route path="buy-again/:orderId" element={<BuyAgain />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="orders/:id" element={<OrderInvoiceAdmin />} />
            <Route path="content" element={<ManageLegal />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="staff-manage" element={<ManageStaff />} />
            
            {/* NEW: Ticket System Route */}
            <Route path="tickets" element={<ManageTickets />} />
          </Route>

          {/* STAFF ROUTES */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/register" element={<StaffRegister />} />
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="orders/:id" element={<OrderInvoiceAdmin />} />

            {/* NEW: Ticket System Route */}
            <Route path="tickets" element={<ManageTickets />} />
          </Route>

          {/* AUTH ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> 
        </Routes>
      </Suspense>
    </AppHelmetProvider>
  );
}

export default App;