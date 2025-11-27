import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Layouts ---
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';

// --- Pages: AUTH ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register'; // <--- ADDED THIS

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

// --- Pages: ADMIN ---
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';

function App() {
  return (
    <Routes>
      
      {/* =========================================
          CLIENT ROUTES (Navbar + Footer) 
          ========================================= */}
      <Route path="/" element={<ClientLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        
        {/* User Account Section */}
        <Route path="account" element={<UserAccount />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="wishlist" element={<Wishlist />} />
        
        {/* Info Pages */}
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="terms" element={<Terms />} />
        
        {/* Placeholders for links in footer (point to existing pages for now) */}
        <Route path="privacy" element={<Terms />} />
        <Route path="cookies" element={<Terms />} />
        <Route path="returns" element={<Contact />} />
        <Route path="new-arrivals" element={<ShopPage />} />
      </Route>

      {/* =========================================
          ADMIN ROUTES (Sidebar + Dashboard) 
          ========================================= */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<ManageProducts />} />
        <Route path="orders" element={<ManageOrders />} />
        
        {/* Placeholder for Analytics pointing to Dashboard */}
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="settings" element={<AdminDashboard />} />
      </Route>

      {/* =========================================
          AUTH ROUTES (No Layout) 
          ========================================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> {/* <--- ADDED THIS */}
      
    </Routes>
  );
}

export default App;