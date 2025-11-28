import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu, Home, Filter, ArrowRight, Package, TrendingUp } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

import logo from '../../assets/logo.png'; 

const TRENDING_SEARCHES = ['Wireless Headphones', 'Smart Watch', 'Gaming Laptop', 'Mechanical Keyboard'];

const Navbar = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path ? "text-[#2563eb]" : "text-gray-500";

  // --- LIVE SEARCH LOGIC ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      const { data } = await supabase
        .from('products')
        .select('name, category, image_url')
        .or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(5);

      if (data) {
        // Extract names/categories for text suggestions
        const rawSuggestions = data.map(item => {
             if (item.category.toLowerCase().includes(searchQuery.toLowerCase())) return item.category;
             return item.name;
        });
        const unique = Array.from(new Set(rawSuggestions)).slice(0, 6);
        setSuggestions(unique);
      }
    };

    const timeoutId = setTimeout(() => fetchSuggestions(), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    setShowDropdown(false);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const isDropdownOpen = showDropdown && (suggestions.length > 0 || (!searchQuery && showDropdown));

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          
          {/* Logo & Menu */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-800 rounded-lg lg:hidden text-white">
              <Menu className="w-6 h-6" />
            </button>
            
            <Link to="/" className="shrink-0 relative z-50">
              {/* Logo: 120px Overhanging */}
              <img 
                src={logo} 
                alt="Aidezel" 
                className="h-[120px] w-auto object-contain brightness-0 invert -my-10 hover:scale-105 transition-transform" 
              />
            </Link>
          </div>

          {/* --- FIXED SEARCH CONTAINER --- */}
          <div className="hidden lg:flex flex-1 max-w-3xl relative" ref={searchContainerRef}>
            <form 
                onSubmit={handleSearchSubmit} 
                className={`w-full relative flex items-center bg-[#1e293b]/80 border border-slate-600 transition-all duration-200
                    ${isDropdownOpen ? 'rounded-t-2xl border-b-0 bg-[#1e293b] z-50' : 'rounded-full'}
                `}
            >
                {/* Icon (Absolute center left) */}
                <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
                    <Search size={20} />
                </div>

                {/* Input Field */}
                <input 
                  type="text" 
                  placeholder="Search premium electronics..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full py-3 pl-12 pr-14 bg-transparent text-white focus:outline-none text-sm placeholder:text-slate-400 h-12"
                />

                {/* Submit Button (Absolute center right) */}
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <button type="submit" className="h-9 w-9 bg-gradient-to-br from-[#38bdf8] to-[#2563eb] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg">
                        <Search size={18} />
                    </button>
                </div>
            </form>

            {/* --- DROPDOWN (Attached Perfectly) --- */}
            {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-slate-200 rounded-b-2xl shadow-2xl overflow-hidden z-40">
                    
                    {/* 1. Suggestions */}
                    {searchQuery && suggestions.length > 0 && (
                        <div className="py-2">
                            <p className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Suggested Searches
                            </p>
                            <ul>
                                {suggestions.map((term, idx) => (
                                    <li key={idx}>
                                        <button 
                                            onClick={() => handleSuggestionClick(term)}
                                            className="w-full text-left px-5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group text-sm text-slate-700"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Search size={16} className="text-slate-400 group-hover:text-[#2563eb]" />
                                                <span className="font-medium group-hover:text-[#2563eb]">
                                                    {term}
                                                </span>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 2. Trending (If no text or no results) */}
                    {(!searchQuery || suggestions.length === 0) && (
                        <div className="bg-slate-50 py-3">
                            <p className="px-5 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={12} /> Trending Now
                            </p>
                            <div className="flex flex-wrap gap-2 px-5">
                                {TRENDING_SEARCHES.map((term, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSuggestionClick(term)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all flex items-center gap-1.5"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* ICONS */}
          <div className="hidden lg:flex items-center gap-14 text-slate-300">
            <Link to="/wishlist" className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-[#38bdf8] group">
              <Heart size={26} strokeWidth={1.5} className="group-hover:fill-white/10" />
              <span className="text-xs font-bold tracking-wide">Wishlist</span>
            </Link>
            
            <Link to="/account" className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-[#38bdf8] group">
              <User size={26} strokeWidth={1.5} />
              <span className="text-xs font-bold tracking-wide">Account</span>
            </Link>
            
            <Link to="/cart" className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-[#38bdf8] group relative">
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

      {/* BOTTOM NAV */}
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