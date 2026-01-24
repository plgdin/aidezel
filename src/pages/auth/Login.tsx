import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // FIX: Force cleanup of any stale local sessions before logging in
      // This solves the issue where being logged in elsewhere or having an old token blocks new logins
      await supabase.auth.signOut();

      // 2. Attempt Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) throw new Error("No user returned");

      // 3. Logic for Admin vs Client redirect
      if (email === 'admin@aidezel.uk') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      // Display the ACTUAL error message from Supabase to help debug
      setMessage({
        type: 'error',
        text: error.message || 'Authentication failed. Please check your credentials.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-8 transition-all duration-300">
        
        {/* HEADER */}
        <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Enter your credentials to access your account.
        </p>
        
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