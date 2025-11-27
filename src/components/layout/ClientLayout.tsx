import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Search, Heart, User, ShoppingCart } from 'lucide-react';

const ClientLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      
      {/* --- HEADER (Solid Dark Blue/Slate) --- */}
      <header className="bg-[#0f172a] border-b border-slate-800 py-4 relative z-50">
        <div className="container mx-auto px-4 flex items-center justify-between gap-8">
          
          {/* 1. LOGO */}
          <Link to="/" className="shrink-0">
            <img src="/UPSCALED.jpg" alt="Aidezel" className="h-10 w-auto rounded-sm" />
          </Link>

          {/* 2. SEARCH BAR */}
          <div className="hidden md:block flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Search premium electronics..." 
              className="w-full bg-[#1e293b] border border-slate-700 rounded-full py-2.5 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-[#3b82f6] transition-all placeholder-slate-400"
            />
            <button className="absolute right-1 top-1 h-8 w-8 bg-[#3b82f6] rounded-full flex items-center justify-center text-white hover:bg-[#2563eb] transition-colors shadow-lg">
              <Search size={16} />
            </button>
          </div>

          {/* 3. ICONS */}
          <div className="flex items-center gap-6 text-slate-300">
            <Link to="/wishlist" className="flex flex-col items-center gap-1 hover:text-[#60a5fa] transition-colors">
              <Heart size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Wishlist</span>
            </Link>
            
            <Link to="/account" className="flex flex-col items-center gap-1 hover:text-[#60a5fa] transition-colors">
              <User size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
            </Link>
            
            <Link to="/cart" className="flex flex-col items-center gap-1 hover:text-[#60a5fa] transition-colors relative">
              <div className="relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 bg-[#3b82f6] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0f172a]">2</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 bg-white">
        <Outlet />
      </main>

      {/* --- FOOTER (Dark Blue) --- */}
      <footer className="bg-[#0f172a] pt-16 pb-8 text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <img src="/UPSCALED.jpg" alt="Aidezel" className="h-8 mb-6 opacity-80" />
            <p className="text-sm leading-relaxed">
              Your premium destination for electronics and lifestyle products.
            </p>
          </div>
          
          {['Shop', 'Support', 'Legal'].map((col) => (
            <div key={col}>
              <h4 className="text-white font-bold mb-6">{col}</h4>
              <ul className="space-y-4 text-sm">
                {['Link 1', 'Link 2', 'Link 3'].map(l => (
                  <li key={l}><a href="#" className="hover:text-[#3b82f6] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center text-xs pt-8 border-t border-slate-800">
          © 2025 Aidezel LTD. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default ClientLayout;