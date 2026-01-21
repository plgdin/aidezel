import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const StaffLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email, password
      });

      if (authError || !user) throw new Error('Invalid credentials');

      // 1. Fetch role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // --- NEW SECURITY CHECKS ---
      if (!profile) throw new Error("Profile not found.");

      if (profile.role === 'pending_staff') {
        await supabase.auth.signOut();
        throw new Error("Account Pending: An administrator has not approved your account yet.");
      }

      if (profile.role === 'banned') {
        await supabase.auth.signOut();
        throw new Error("Access Denied: This account has been suspended.");
      }

      if (profile.role !== 'staff' && profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access Denied: Not a registered staff member.');
      }

      // --- LOG SESSION (CLOCK IN) ---
      // We only log sessions for 'staff', not admins (unless you want to)
      if (profile.role === 'staff') {
         await supabase.from('staff_sessions').insert({
            user_id: user.id,
            login_at: new Date().toISOString()
         });
      }

      navigate('/staff'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Staff Login</h1>
            <p className="text-slate-500 text-sm">Access the inventory & order system</p>
        </div>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold border border-red-100">
                {error}
            </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
            <input 
                type="email" 
                placeholder="Staff Email" 
                className="w-full p-3 border rounded-lg bg-gray-50" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
            />
            
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    className="w-full p-3 border rounded-lg bg-gray-50 pr-10"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <button disabled={loading} className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : "Enter Portal"}
            </button>
        </form>
        
        <div className="text-center mt-4 text-sm">
            <Link to="/staff/register" className="text-purple-600 hover:underline">New staff? Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;