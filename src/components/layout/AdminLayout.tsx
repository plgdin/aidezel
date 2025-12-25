// src/components/layout/AdminLayout.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
// ADDED: FileText icon
import { LayoutDashboard, Package, ShoppingCart, LogOut, Tags, ClipboardList, Loader2, FileText } from 'lucide-react';
import { Toaster } from '../ui/toaster';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- NEW SECURITY CHECK ---
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin/login'); // Redirect to new Admin Login
        return;
      }

      // Check Profile for is_admin flag
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!profile || !profile.is_admin) {
        alert("Unauthorized Access");
        navigate('/'); // Kick them out to home
      }
      
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);
  // --------------------------

  const isActive = (path: string) => {
    return location.pathname === path ?
    'bg-blue-900 text-white' : 'text-gray-300 hover:bg-blue-800 hover:text-white';
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      navigate('/admin/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2"/> Verifying Privileges...
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-blue-900">
          <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin')}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/admin/inventory" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/inventory')}`}>
             <ClipboardList size={20} /> Inventory
          </Link>
          <Link to="/admin/products" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/products')}`}>
            <Package size={20} /> Add Product
          </Link>
          <Link to="/admin/categories" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/categories')}`}>
            <Tags size={20} /> Categories
          </Link>
          <Link to="/admin/orders" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/orders')}`}>
            <ShoppingCart size={20} /> Orders
          </Link>
          {/* NEW: Legal Content Link */}
          <Link to="/admin/content" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/content')}`}>
            <FileText size={20} /> Legal Content
          </Link>
        </nav>

        <div className="p-4 border-t border-blue-900">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-blue-900 rounded-lg transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default AdminLayout;