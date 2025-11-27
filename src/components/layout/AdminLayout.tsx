import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-900 text-white' : 'text-gray-300 hover:bg-blue-800 hover:text-white';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col">
        <div className="p-6 border-b border-blue-900">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/admin" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin')}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          
          <Link 
            to="/admin/products" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/products')}`}
          >
            <Package size={20} />
            Products
          </Link>
          
          <Link 
            to="/admin/orders" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/orders')}`}
          >
            <ShoppingCart size={20} />
            Orders
          </Link>
        </nav>

        <div className="p-4 border-t border-blue-900">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-blue-900 rounded-lg transition-colors">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;