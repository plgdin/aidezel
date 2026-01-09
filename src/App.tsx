// src/App.tsx
import React, { useEffect } from 'react'; // <--- Added useEffect
import { Routes, Route, useNavigate } from 'react-router-dom'; // <--- Added useNavigate
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabase'; // <--- Added supabase import

// --- Layouts ---
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout'; 

// --- Pages: AUTH ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UpdatePassword from './pages/auth/UpdatePassword';

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

// --- Pages: ADMIN & STAFF (Shared Components) ---
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';
import ManageCategories from './pages/admin/ManageCategories';
import Inventory from './pages/admin/Inventory';
import ManageLegal from './pages/admin/ManageLegal';
import OrderInvoiceAdmin from './pages/admin/OrderInvoiceAdmin';

// --- NEW IMPORT: ADMIN LOGS ---
import AdminLogs from './pages/admin/AdminLogs'; 

// FIX: Cast HelmetProvider to 'any' to resolve TypeScript error ts(2786)
const AppHelmetProvider = HelmetProvider as any;

function App() {
  const navigate = useNavigate(); // <--- Initialize Hook

  // --- STEP 3 FIX: Handle Password Recovery Event ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // This event fires specifically when a user clicks a "Reset Password" email link
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);
  // --------------------------------------------------

  return (
    <AppHelmetProvider>
      {/* GLOBAL SEO CONFIGURATION */}
      <Helmet>
        <title>Aidezel</title>
        <link rel="canonical" href="https://www.aidezel.co.uk" />
        <meta property="og:url" content="https://www.aidezel.co.uk" />
      </Helmet>

      <Routes>
        {/* =========================================
            CLIENT ROUTES (Navbar + Footer)
            ========================================= */}
        <Route path="/" element={<ClientLayout />}>
          {/* Main */}
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />

          {/* User Account Section */}
          <Route path="account" element={<UserAccount />} />
          <Route path="account/update-password" element={<UpdatePassword />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="orders/:id" element={<OrderInvoice />} />
          <Route path="buy-again/:orderId" element={<BuyAgain />} />
          <Route path="wishlist" element={<Wishlist />} />

          {/* Info Pages */}
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />

          {/* Footer Links Placeholders */}
          <Route path="cookies" element={<Terms />} />
          <Route path="returns" element={<Contact />} />
          <Route path="new-arrivals" element={<ShopPage />} />
        </Route>

        {/* =========================================
            ADMIN AUTH ROUTE (Standalone)
            ========================================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* =========================================
            ADMIN ROUTES (Protected by AdminLayout)
            ========================================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />

          {/* Product Management */}
          <Route path="products" element={<ManageProducts />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="categories" element={<ManageCategories />} />

          {/* Order Management */}
          <Route path="orders" element={<ManageOrders />} />
          <Route path="orders/:id" element={<OrderInvoiceAdmin />} />

          {/* Legal Content Management */}
          <Route path="content" element={<ManageLegal />} />

          {/* --- NEW ROUTE: Activity Logs --- */}
          <Route path="logs" element={<AdminLogs />} />

          {/* Placeholders */}
          <Route path="analytics" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminDashboard />} />
        </Route>

        {/* =========================================
            STAFF ROUTES (Protected by StaffLayout)
            ========================================= */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/register" element={<StaffRegister />} />

        <Route path="/staff" element={<StaffLayout />}>
           {/* Reusing Admin Components for Staff to ensure consistency */}
           <Route index element={<AdminDashboard />} />
           <Route path="inventory" element={<Inventory />} />
           <Route path="products" element={<ManageProducts />} />
           <Route path="categories" element={<ManageCategories />} />
           <Route path="orders" element={<ManageOrders />} />
           <Route path="orders/:id" element={<OrderInvoiceAdmin />} />
        </Route>

        {/* =========================================
            AUTH ROUTES (No Layout)
            ========================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/update-password" element={<UpdatePassword />} /> {/* <--- Added this route */}
      </Routes>
    </AppHelmetProvider>
  );
}

export default App;