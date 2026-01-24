import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from '../../components/ui/toaster'; 

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // --- FIX: NUCLEAR CLEANUP ON LOAD ---
  // This ensures that if you open this page, any old/stale session is destroyed immediately.
  useEffect(() => {
    const cleanSession = async () => {
      // 1. Tell Supabase to kill the session
      await supabase.auth.signOut();
      // 2. Force clear local storage to fix the "Next Tab" issue
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
    };
    cleanSession();
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const loadId = toast.loading("Logging in...", "Verifying credentials");

    try {
      // Double check: Ensure we are starting fresh
      await supabase.auth.signOut();

      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new Error(error?.message || "Invalid email or password");
      }

      const user = data.user;

      // 2. Fetch Profile to get Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error("Profile not found.");

      toast.dismiss(loadId);

      // --- ROLE CHECKS ---

      // Check 1: Banned Users
      if (profile.role === 'banned') {
        await supabase.auth.signOut();
        const msg = "Access Denied: Your account has been suspended.";
        setMessage({ type: 'error', text: msg });
        toast.error("Blocked", msg);
        return;
      }

      // Check 2: Pending Staff
      if (profile.role === 'pending_staff') {
        await supabase.auth.signOut();
        const msg = "Account Pending: Please wait for admin approval.";
        setMessage({ type: 'error', text: msg });
        toast.error("Pending", msg);
        return;
      }

      // Check 3: Staff Logic
      if (profile.role === 'staff') {
        // Log staff session
        await supabase.from('staff_sessions').insert({
          user_id: user.id,
          login_at: new Date().toISOString()
        });

        toast.success("Welcome Staff", "Redirecting to Staff Portal...");
        navigate('/staff');
        return;
      }

      // Check 4: Admin Logic
      if (profile.role === 'admin') {
        toast.success("Welcome Admin", "Redirecting to Admin Panel...");
        navigate('/admin');
        return;
      }

      // Default: Client
      toast.success("Welcome Back", "Login successful.");
      navigate('/');

    } catch (error: any) {
      toast.dismiss(loadId);
      // Show the ACTUAL error message
      const errorMsg = error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message;

      setMessage({ type: 'error', text: errorMsg });
      toast.error("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-8 transition-all duration-300">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 text-sm">
            Enter your credentials to access your account.
          </p>
        </div>
        
        {/* MESSAGE BOX */}
        {message && (
          <div className={`px-4 py-3 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 mb-6 ${
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* EMAIL FIELD */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
              placeholder="Email Address" 
              required 
            />
          </div>
          
          {/* PASSWORD FIELD */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)} 
              className="w-full pl-10 pr-10 p-3 border rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              placeholder="Password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            {/* FORGOT PASSWORD REDIRECT */}
            <div className="text-right mt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-gray-500 hover:text-black transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95 transform duration-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* FOOTER */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>New here? <Link to="/register" className="font-bold underline text-black hover:text-gray-700">Create Account</Link></p>
        </div>

      </div>
    </div>
  );
};

export default Login;