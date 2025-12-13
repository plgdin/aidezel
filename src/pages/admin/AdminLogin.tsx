// src/pages/admin/AdminLogin.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2, Lock } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Attempt Login
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !user) throw new Error('Invalid credentials');

      // 2. Check Admin Status in Database
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.is_admin) {
        // If not admin, log them out immediately
        await supabase.auth.signOut();
        throw new Error('Access Denied: You do not have admin privileges.');
      }

      // 3. Success - Go to Dashboard
      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 p-8">
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
                <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-gray-400 text-sm">Authorized Personnel Only</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg mt-1 focus:border-red-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
                <input 
                type="password" 
                className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg mt-1 focus:border-red-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
                <Lock className="absolute right-3 top-4 text-gray-500" size={16} />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;