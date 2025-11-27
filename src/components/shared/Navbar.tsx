import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu, Home, Filter } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { cartCount } = useCart();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? "text-red-600" : "text-gray-600";

  return (
    <>
      {/* =========================================================
          TOP NAVBAR
          Desktop (lg): 'sticky top-0' -> STAYS VISIBLE at the top.
          Mobile (default): 'relative' -> SCROLLS AWAY (moves up).
          ========================================================= */}
      <nav className="relative lg:sticky lg:top-0 z-50 bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-8">
          
          {/* Logo & Menu */}
          <div className="flex items-center gap-4">
            {/* Hamburger (Mobile Only) */}
            <button className="p-2 hover:bg-gray-800 rounded-lg lg:hidden text-white">
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Brand Logo */}
            <Link to="/" className="text-2xl font-bold text-white tracking-tight cursor-pointer flex items-center gap-2">
              AIDE<span className="text-primary">ZEL</span>
              <div className="w-8 h-2 bg-gradient-to-r from-primary to-transparent rounded-full ml-1"></div>
            </Link>
          </div>

          {/* Search Bar (Desktop View Only) */}
          <div className="hidden lg:flex flex-1 max-w-2xl relative">
            <input 
              type="text" 
              placeholder="Search for premium electronics..." 
              className="w-full py-3 px-5 pl-12 bg-gray-900 border border-gray-700 rounded-full text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-400"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <button className="absolute right-2 top-1.5 bg-primary text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-yellow-400 transition-colors">
              <Search size={18} />
            </button>
          </div>

          {/* DESKTOP ICONS (Desktop View Only) */}
          <div className="hidden lg:flex items-center gap-16">
            
            {/* WISHLIST */}
            <Link 
              to="/wishlist" 
              className="flex flex-col items-center cursor-pointer group transition-transform duration-300 hover:-translate-y-1"
            >
              <Heart className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium mt-1 text-gray-300 group-hover:text-primary transition-colors">Wishlist</span>
            </Link>
            
            {/* ACCOUNT */}
            <Link 
              to="/account" 
              className="flex flex-col items-center cursor-pointer group transition-transform duration-300 hover:-translate-y-1"
            >
              <User className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium mt-1 text-gray-300 group-hover:text-primary transition-colors">Account</span>
            </Link>
            
            {/* CART */}
            <Link 
              to="/cart" 
              className="flex flex-col items-center cursor-pointer group relative transition-transform duration-300 hover:-translate-y-1"
            >
              {cartCount > 0 && (
                 <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-black rounded-full text-[11px] font-bold flex items-center justify-center">{cartCount}</div>
              )}
              <ShoppingCart className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium mt-1 text-gray-300 group-hover:text-primary transition-colors">Cart</span>
            </Link>

          </div>

          {/* Mobile Search Icon (Mobile View Only) */}
          <div className="lg:hidden">
             <Search className="w-6 h-6 text-white" />
          </div>
        </div>
      </nav>

      {/* =========================================================
          BOTTOM NAVIGATION BAR (Mobile View Only)
          This is 'fixed' so it ALWAYS stays at the bottom.
          ========================================================= */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 lg:hidden pb-safe">
        <div className="flex justify-between items-center px-6 py-3">
          
          <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
            <Home size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Shop</span>
          </Link>

          <Link to="/shop" className={`flex flex-col items-center gap-1 ${isActive('/shop')}`}>
            <Filter size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Filters</span>
          </Link>

          <Link to="/wishlist" className={`flex flex-col items-center gap-1 ${isActive('/wishlist')}`}>
            <Heart size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Wishlist</span>
          </Link>

          <Link to="/cart" className={`flex flex-col items-center gap-1 relative ${isActive('/cart')}`}>
            {cartCount > 0 && (
              <div className="absolute -top-2 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {cartCount}
              </div>
            )}
            <ShoppingCart size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Cart</span>
          </Link>

          <Link to="/account" className={`flex flex-col items-center gap-1 ${isActive('/account')}`}>
            <User size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">My account</span>
          </Link>

        </div>
      </div>
      
      {/* Spacer */}
      <div className="h-16 lg:hidden"></div> 
    </>
  );
};

export default Navbar;