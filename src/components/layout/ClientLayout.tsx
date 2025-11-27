import React from 'react';
import { Outlet, Link } from 'react-router-dom';
// Import the separate Navbar component
import Navbar from '../shared/Navbar'; // Adjust path if needed (e.g. ../shared/Navbar)

const ClientLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      
      {/* USE THE SHARED NAVBAR COMPONENT */}
      <Navbar />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 bg-white">
        <Outlet />
      </main>

      {/* --- FOOTER (Dark Navy) --- */}
      <footer className="bg-[#0f172a] pt-16 pb-8 text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            {/* Footer Logo - Ensure path matches public folder */}
            <img src="/logo.png" alt="Aidezel" className="h-8 mb-6 opacity-80" />
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