import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Tags, ClipboardList } from 'lucide-react';
import { Toaster } from '../ui/toaster'; // 👈 UPDATED (relative import)

const AdminLayout = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-900 text-white' : 'text-gray-300 hover:bg-blue-800 hover:text-white';
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-blue-900">
          <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* 1. Dashboard */}
          <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin')}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          
          {/* 2. Inventory */}
          <Link to="/admin/inventory" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/inventory')}`}>
            <ClipboardList size={20} /> Inventory
          </Link>

          {/* 3. Add Product */}
          <Link to="/admin/products" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/products')}`}>
            <Package size={20} /> Add Product
          </Link>

          {/* 4. Categories */}
          <Link to="/admin/categories" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/categories')}`}>
            <Tags size={20} /> Categories
          </Link>
          
          {/* 5. Orders */}
          <Link to="/admin/orders" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/orders')}`}>
            <ShoppingCart size={20} /> Orders
          </Link>
        </nav>

        <div className="p-4 border-t border-blue-900">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-blue-900 rounded-lg transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* 🔔 Toast root for admin side */}
      <Toaster />
    </div>
  );
};

export default AdminLayout;
