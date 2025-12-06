import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../shared/Navbar'; 
import logo from '../../assets/logo.png'; // Ensure this matches your path
import { Toaster } from '../ui/toaster'; // 👈 UPDATED (relative import)

const ClientLayout = () => {
  return (
    // FIX: Using the new CSS variable for the background
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] font-sans">
      
      {/* --- NAVBAR --- */}
      <Navbar />

      {/* --- MAIN CONTENT --- */}
      {/* FIX: bg-transparent allows the grey body color to show through */}
      <main className="flex-1 bg-transparent">
        <Outlet />
      </main>

      {/* --- FOOTER (Dark Navy) --- */}
      <footer className="bg-[#0f172a] pt-16 pb-8 text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* 1. Brand Section */}
          <div>
            {/* Logo */}
            <img src={logo} alt="Aidezel" className="h-8 mb-6 opacity-80" />
            <p className="text-sm leading-relaxed max-w-xs">
              Your premium destination for electronics and lifestyle products. Quality guaranteed.
            </p>
          </div>
          
          {/* 2. Shop Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Shop</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/shop" className="hover:text-[#3b82f6] transition-colors">All Products</Link>
              </li>
              <li>
                <Link to="/new-arrivals" className="hover:text-[#3b82f6] transition-colors">New Arrivals</Link>
              </li>
            </ul>
          </div>

          {/* 3. Support Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/contact" className="hover:text-[#3b82f6] transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#3b82f6] transition-colors">Order Status</Link>
              </li>
            </ul>
          </div>

          {/* 4. Legal Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/terms" className="hover:text-[#3b82f6] transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#3b82f6] transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Copyright Bar */}
        <div className="container mx-auto px-4 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2025 Aidezel LTD. All rights reserved.</p>
          <div className="flex gap-4">
             <span>Secure Payment</span>
             <span>SSL Encrypted</span>
          </div>
        </div>
      </footer>

      {/* 🔔 Toast root for client side */}
      <Toaster />
    </div>
  );
};

export default ClientLayout;
