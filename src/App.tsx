import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Layouts ---
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';

// --- Pages: AUTH ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UpdatePassword from './pages/auth/UpdatePassword';

// --- Pages: ADMIN AUTH (New) ---
import AdminLogin from './pages/admin/AdminLogin';

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
import OrderInvoice from './pages/client/OrderInvoice';
import BuyAgain from './pages/client/BuyAgain';

// --- Pages: ADMIN ---
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';
import ManageCategories from './pages/admin/ManageCategories';
import Inventory from './pages/admin/Inventory';
import OrderInvoiceAdmin from './pages/admin/OrderInvoiceAdmin';

function App() {
  return (
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

        {/* Footer Links Placeholders */}
        <Route path="privacy" element={<Terms />} />
        <Route path="cookies" element={<Terms />} />
        <Route path="returns" element={<Contact />} />
        <Route path="new-arrivals" element={<ShopPage />} />
      </Route>

      {/* =========================================
          ADMIN AUTH ROUTE (Standalone)
          ========================================= */}
      {/* This must be outside AdminLayout to prevent redirect loops */}
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

        {/* Placeholders */}
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="settings" element={<AdminDashboard />} />
      </Route>

      {/* =========================================
          AUTH ROUTES (No Layout)
          ========================================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;