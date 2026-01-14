// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';

// --- Layouts ---
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout'; 

// --- Pages: AUTH ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
// Pointing this to your unified 2-step component
import ForgotPassword from './pages/auth/ForgotPassword'; 

// --- Pages: ADMIN AUTH ---
import AdminLogin from './pages/admin/AdminLogin';

// --- Pages: STAFF AUTH ---
import StaffLogin from './pages/staff/StaffLogin';      
import StaffRegister from './pages/staff/StaffRegister';

// --- Pages: CLIENT ---
import HomePage from './pages/client/Home';
import ShopPage from './pages/client/Shop';
import ProductDetails from './pages/client/ProductDetails';
import Cart from './pages/client/Cart';
import Checkout from './pages/client/Checkout';
import UserAccount from './pages/client/UserAccount';
import Wishlist from './pages/client/Wishlist';
import OrderHistory from './pages/client/OrderHistory';
import About from './pages/client/About';
import Contact from './pages/client/Contact';
import Terms from './pages/client/Terms';
import Privacy from './pages/client/Privacy';
import OrderInvoice from './pages/client/OrderInvoice';
import BuyAgain from './pages/client/BuyAgain';

// --- Pages: ADMIN & STAFF ---
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';
import ManageCategories from './pages/admin/ManageCategories';
import Inventory from './pages/admin/Inventory';
import ManageLegal from './pages/admin/ManageLegal';
import OrderInvoiceAdmin from './pages/admin/OrderInvoiceAdmin';
import AdminLogs from './pages/admin/AdminLogs'; 

const AppHelmetProvider = HelmetProvider as any;

function App() {
  // REMOVED: useNavigate and useEffect for PASSWORD_RECOVERY
  // Because you are now using 8-digit OTP verification

  return (
    <AppHelmetProvider>
      <Helmet>
        <title>Aidezel</title>
        <link rel="canonical" href="https://www.aidezel.co.uk" />
        <meta property="og:url" content="https://www.aidezel.co.uk" />
      </Helmet>

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
        </Route>

        {/* STAFF ROUTES */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/register" element={<StaffRegister />} />
        <Route path="/staff" element={<StaffLayout />}>
           <Route index element={<AdminDashboard />} />
           <Route path="inventory" element={<Inventory />} />
           <Route path="products" element={<ManageProducts />} />
           <Route path="categories" element={<ManageCategories />} />
           <Route path="orders" element={<ManageOrders />} />
           <Route path="orders/:id" element={<OrderInvoiceAdmin />} />
        </Route>

        {/* AUTH ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Unified 2-Step Reset Route */}
        <Route path="/forgot-password" element={<ForgotPassword />} /> 
      </Routes>
    </AppHelmetProvider>
  );
}

export default App;