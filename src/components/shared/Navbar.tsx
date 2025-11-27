import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu, Home, Filter } from 'lucide-react';
import { useCart } from '../../context/CartContext';

import logo from '../../assets/logo.png'; 

const Navbar = () => {
  const { cartCount } = useCart();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? "text-[#2563eb]" : "text-gray-500";

  return (
    <>
      {/* =========================================================
          TOP NAVBAR
          ========================================================= */}
      <nav className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          
          {/* Logo & Menu */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-800 rounded-lg lg:hidden text-white">
              <Menu className="w-6 h-6" />
            </button>
            
            {/* FIXED: Restored the 120px Floating Logo */}
            <Link to="/" className="shrink-0 relative z-50">
              <img 
                src={logo} 
                alt="Aidezel" 
                className="h-[120px] w-auto object-contain brightness-0 invert -my-10 hover:scale-105 transition-transform" 
              />
            </Link>
          </div>

          {/* Search Bar - LARGE */}
          <div className="hidden lg:flex flex-1 max-w-3xl relative">
            <input 
              type="text" 
              placeholder="Search premium electronics..." 
              className="w-full py-3 px-5 pl-12 bg-[#1e293b]/50 border border-slate-700 rounded-full text-white focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all placeholder:text-slate-400 text-sm backdrop-blur-sm"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <button className="absolute right-1.5 top-1.5 h-9 w-9 bg-gradient-to-br from-[#38bdf8] to-[#2563eb] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg">
              <Search size={18} />
            </button>
          </div>

          {/* ICONS - WIDER GAP */}
          <div className="hidden lg:flex items-center gap-14 text-slate-300">
            
            <Link 
              to="/wishlist" 
              className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-[#38bdf8] group"
            >
              <Heart size={26} strokeWidth={1.5} className="group-hover:fill-white/10" />
              <span className="text-xs font-bold tracking-wide">Wishlist</span>
            </Link>
            
            <Link 
              to="/account" 
              className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-[#38bdf8] group"
            >
              <User size={26} strokeWidth={1.5} />
              <span className="text-xs font-bold tracking-wide">Account</span>
            </Link>
            
            <Link 
              to="/cart" 
              className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-[#38bdf8] group relative"
            >
              <div className="relative">
                <ShoppingCart size={26} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#38bdf8] text-[#0f172a] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0f172a]">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold tracking-wide">Cart</span>
            </Link>
          </div>

          {/* Mobile Search Icon */}
          <div className="lg:hidden text-white">
             <Search className="w-7 h-7" />
          </div>
        </div>
      </nav>

      {/* BOTTOM NAV (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 lg:hidden pb-safe">
        <div className="flex justify-between items-center px-6 py-2">
          <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/')}`}>
            <Home size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Shop</span>
          </Link>
          <Link to="/shop" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/shop')}`}>
            <Filter size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Filters</span>
          </Link>
          <Link to="/wishlist" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/wishlist')}`}>
            <Heart size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Wishlist</span>
          </Link>
          <Link to="/cart" className={`flex flex-col items-center gap-1 relative transition-colors ${isActive('/cart')}`}>
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={1.5} />
              {cartCount > 0 && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#2563eb] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold">Cart</span>
          </Link>
          <Link to="/account" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/account')}`}>
            <User size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Account</span>
          </Link>
        </div>
      </div>
      
      <div className="h-20 lg:hidden"></div> 
    </>
  );
};

export default Navbar;