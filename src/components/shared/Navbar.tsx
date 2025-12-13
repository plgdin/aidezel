import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Home,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

import logo from '../../assets/logo.png';

const NAV_STYLE = {
  backgroundGradient:
    'radial-gradient(circle at 6% 50%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 110px), ' +
    'linear-gradient(100deg, rgba(125,211,252,0.95) 0%, rgba(56,103,214,0.88) 45%, rgba(8,20,48,0.95) 100%)',
  blurAmount: '24px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
  accentColor: '#60a5fa',
};

const TRENDING_SEARCHES = [
  'Wireless Headphones',
  'Smart Watch',
  'Gaming Laptop',
  'Mechanical Keyboard',
];

const Navbar = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState({
    line1: 'Select your',
    line2: 'Location',
    full: 'Select your location',
  });

  // --- UPDATED: Fetch Location Logic ---
  const fetchUserLocation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    setIsLoggedIn(!!session);

    if (session) {
      // 1. Try to fetch the DEFAULT address
      let { data: address } = await supabase
        .from('user_addresses')
        .select('full_name, city, postcode')
        .eq('user_id', session.user.id)
        .eq('is_default', true)
        .single();

      // 2. If no default exists, fetch ANY address
      if (!address) {
         const { data: anyAddress } = await supabase
          .from('user_addresses')
          .select('full_name, city, postcode')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();
          
          address = anyAddress;
      }

      if (address) {
        const firstName = address.full_name ? address.full_name.split(' ')[0] : 'User';
        const loc = `${address.city} ${address.postcode}`;
        
        setDeliveryLocation({
          line1: `Deliver to ${firstName}`,
          line2: loc,
          full: `Deliver to ${firstName} - ${loc}`,
        });
      } else {
         // Fallback to profile name if no addresses found
         const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
          
          const name = profile?.full_name ? profile.full_name.split(' ')[0] : 'User';
          setDeliveryLocation({
              line1: `Deliver to ${name}`,
              line2: 'Add an address',
              full: `Deliver to ${name} - Add an address`,
          });
      }
    } else {
      setDeliveryLocation({
          line1: 'Select your',
          line2: 'Location',
          full: 'Select your location',
      });
    }
  };

  // --- UPDATED: useEffect with Event Listener ---
  useEffect(() => {
    fetchUserLocation(); // Initial fetch

    // Listen for custom event 'address-updated' from UserAccount page
    const handleAddressUpdate = () => {
        fetchUserLocation();
    };

    window.addEventListener('address-updated', handleAddressUpdate);

    return () => {
        window.removeEventListener('address-updated', handleAddressUpdate);
    };
  }, []); // Run once on mount

  const handleLocationClick = () => {
    if (isLoggedIn) {
      navigate('/account');
    } else {
      navigate('/login');
    }
  };

  // --- LIVE SEARCH LOGIC ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      const { data } = await supabase
        .from('products')
        .select('name, category')
        .or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(5);

      if (data) {
        const rawSuggestions = data.map((item) => {
          if (item.category.toLowerCase().includes(searchQuery.toLowerCase())) {
            return item.category;
          }
          return item.name;
        });
        const unique = Array.from(new Set(rawSuggestions)).slice(0, 6);
        setSuggestions(unique);
      }
    };

    const timeoutId = setTimeout(() => fetchSuggestions(), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    setShowDropdown(false);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const isDropdownOpen =
    showDropdown && (suggestions.length > 0 || (!searchQuery && showDropdown));

  const renderSearchForm = () => (
    <div
      ref={searchContainerRef}
      className="w-full max-w-3xl mx-auto relative"
    >
      <form
        onSubmit={handleSearchSubmit}
        className={`w-full relative flex items-center
          ${
            isDropdownOpen
              ? 'bg-white rounded-t-2xl rounded-b-none border border-gray-100 border-b-0 z-50 shadow-none'
              : 'bg-white/90 backdrop-blur-md border border-white/40 rounded-full shadow-lg'
          }
        `}
      >
        <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={20} />
        </div>

        <input
          type="text"
          placeholder="Search premium electronics..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full py-3 pl-12 pr-14 bg-transparent text-slate-900 focus:outline-none text-sm placeholder:text-slate-500 h-12 rounded-full"
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <button
            type="submit"
            className="h-9 w-9 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-sm"
            style={{ backgroundColor: 'var(--nav-accent)' }}
          >
            <Search size={18} />
          </button>
        </div>
      </form>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-gray-100 rounded-b-2xl shadow-xl overflow-hidden z-40 -mt-px">
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
                        <Search
                          size={16}
                          className="text-slate-400 group-hover:text-[var(--nav-accent)]"
                        />
                        <span className="font-medium group-hover:text-[var(--nav-accent)]">
                          {term}
                        </span>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-blue-400 hover:text-[var(--nav-accent)] hover:shadow-sm transition-all flex items-center gap-1.5"
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
  );

  return (
    <>
      {/* MAIN NAVBAR */}
      <nav
        className="no-print sticky top-0 z-50 py-3 transition-all duration-300"
        style={{
          background: NAV_STYLE.backgroundGradient,
          backdropFilter: `blur(${NAV_STYLE.blurAmount})`,
          WebkitBackdropFilter: `blur(${NAV_STYLE.blurAmount})`,
          borderBottom: NAV_STYLE.borderBottom,
          boxShadow: NAV_STYLE.boxShadow,
          '--nav-accent': NAV_STYLE.accentColor,
        } as React.CSSProperties}
      >
        <div className="container mx-auto flex items-center justify-between gap-4 lg:gap-8">
          
          {/* 1. Logo */}
          <div className="flex items-center shrink-0">
            <Link
              to="/"
              className="shrink-0 relative z-50 group"
              aria-label="home"
            >
              <img
                src={logo}
                alt="Aidezel"
                className="h-[120px] w-auto object-contain -my-10 group-hover:scale-105 transition-transform"
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: 'transparent',
                  filter: 'drop-shadow(0 6px 18px rgba(2,6,23,0.45))',
                  WebkitFilter: 'drop-shadow(0 6px 18px rgba(2,6,23,0.45))',
                }}
              />
            </Link>
          </div>

          {/* --- MOBILE SEARCH BAR (Next to Logo) --- */}
          <div className="flex-1 lg:hidden ml-2">
             {renderSearchForm()}
          </div>

          {/* 2. DESKTOP ADDRESS WIDGET */}
          <button 
             onClick={handleLocationClick}
             className="hidden lg:flex items-center gap-2 cursor-pointer hover:opacity-80 active:scale-95 transition-all duration-200 p-2 min-w-[140px] text-left"
          >
             <div className="text-slate-900 mt-1"> 
                <MapPin size={20} />
             </div>
             <div className="flex flex-col leading-none">
                <span className="text-[12px] text-slate-600 font-medium leading-tight">{deliveryLocation.line1}</span>
                <span className="text-[14px] font-bold text-slate-900 leading-tight">{deliveryLocation.line2}</span>
             </div>
          </button>

          {/* 3. DESKTOP SEARCH */}
          <div className="hidden lg:flex flex-1 px-2 lg:px-4">
            <div className="w-full max-w-4xl">{renderSearchForm()}</div>
          </div>

          {/* 4. ICONS - Desktop */}
          <div className="hidden lg:flex items-center gap-14 text-white">
            <Link
              to="/wishlist"
              className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-blue-100 group"
            >
              <Heart
                size={26}
                strokeWidth={1.5}
                stroke="currentColor"
                className="group-hover:fill-white/20"
              />
              <span className="text-xs font-bold tracking-wide text-blue-100 group-hover:text-white">
                Wishlist
              </span>
            </Link>

            <Link
              to="/account"
              className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-blue-100 group"
            >
              <User size={26} strokeWidth={1.5} />
              <span className="text-xs font-bold tracking-wide text-blue-100 group-hover:text-white">
                Account
              </span>
            </Link>

            <Link
              to="/cart"
              className="flex flex-col items-center gap-1.5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:text-blue-100 group relative"
            >
              <div className="relative">
                <ShoppingCart size={26} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white/20 shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold tracking-wide text-blue-100 group-hover:text-white">
                Cart
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- MOBILE ADDRESS BAR (Dark Blue) --- */}
      <button 
          onClick={handleLocationClick}
          className="no-print w-full text-left lg:hidden bg-slate-900 text-white px-4 py-2.5 flex items-center gap-2 text-sm border-b border-slate-800 shadow-sm active:bg-slate-800 transition-colors"
      >
          <MapPin size={18} className="flex-shrink-0 text-blue-400" />
          <span className="truncate font-medium flex-1">
            {deliveryLocation.full}
          </span>
      </button>

      {/* BOTTOM NAV - Mobile Only */}
      <div className="no-print fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 lg:hidden pb-safe">
        <div className="flex justify-between items-center px-6 py-2">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Home size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Home</span>
          </Link>

          <Link
            to="/shop"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/shop' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <ShoppingBag size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Shop</span>
          </Link>

          <Link
            to="/wishlist"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/wishlist'
                ? 'text-blue-600'
                : 'text-slate-400'
            }`}
          >
            <Heart size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Wishlist</span>
          </Link>

          <Link
            to="/cart"
            className={`flex flex-col items-center gap-1 relative transition-colors ${
              location.pathname === '/cart' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={1.5} />
              {cartCount > 0 && (
                <div
                  className="absolute -top-2 -right-2 w-4 h-4 text-white rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: 'var(--nav-accent)' }}
                >
                  {cartCount}
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold">Cart</span>
          </Link>

          <Link
            to="/account"
            className={`flex flex-col items-center gap-1 transition-colors ${
              location.pathname === '/account'
                ? 'text-blue-600'
                : 'text-slate-400'
            }`}
          >
            <User size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Account</span>
          </Link>
        </div>
      </div>

      {/* Spacer so page content doesn't hide behind bottom nav on mobile */}
      <div className="no-print h-20 lg:hidden" />
    </>
  );
};

export default Navbar;