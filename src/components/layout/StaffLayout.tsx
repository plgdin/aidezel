// src/components/layout/StaffLayout.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { LayoutDashboard, Package, ShoppingCart, LogOut, Tags, ClipboardList, Loader2, UserCircle } from 'lucide-react';
import { Toaster } from '../ui/toaster';

const StaffLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- SECURITY CHECK (Permissive) ---
  useEffect(() => {
    const checkStaff = async () => {
      // 1. Check Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/staff/login'); // Redirects to Staff Login
        return;
      }

      // 2. Check Profile Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role') // Fetch specific role
        .eq('id', session.user.id)
        .single();

      // 3. ALLOW STAFF OR ADMIN
      // This is the key logic: Staff can enter, Admins can also enter (to supervise).
      // Clients/Public are blocked.
      if (!profile || (profile.role !== 'staff' && profile.role !== 'admin')) {
        alert("Unauthorized: Staff Access Only");
        navigate('/'); 
      }
      
      setLoading(false);
    };

    checkStaff();
  }, [navigate]);
  // ---------------------------------

  const isActive = (path: string) => {
    return location.pathname === path ?
    'bg-purple-900 text-white' : 'text-gray-300 hover:bg-purple-800 hover:text-white';
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      navigate('/staff/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2"/> Verifying Staff Access...
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      {/* Sidebar - Using Purple theme to distinguish from Admin */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <UserCircle className="text-purple-400"/>
          <h2 className="text-xl font-bold tracking-tight">Staff Portal</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/staff" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/staff')}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/staff/inventory" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/staff/inventory')}`}>
             <ClipboardList size={20} /> Inventory
          </Link>
          <Link to="/staff/products" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/staff/products')}`}>
            <Package size={20} /> Add Product
          </Link>
          <Link to="/staff/categories" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/staff/categories')}`}>
            <Tags size={20} /> Categories
          </Link>
          <Link to="/staff/orders" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/staff/orders')}`}>
            <ShoppingCart size={20} /> Orders
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} /> Staff Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-auto bg-gray-50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default StaffLayout;