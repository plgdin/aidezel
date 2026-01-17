import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRole }: { allowedRole: 'admin' | 'staff' | 'client' }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if user exists and if their metadata role matches the required role
      if (user && user.user_metadata.role === allowedRole) {
        setIsAuthorized(true);
      }
      setLoading(false);
    };
    checkAuth();
  }, [allowedRole]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // If not authorized, kick them back to the login page
  return isAuthorized ? <Outlet /> : <Navigate to={allowedRole === 'admin' ? "/admin/login" : "/login"} replace />;
};

export default ProtectedRoute;