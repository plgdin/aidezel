import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [isResetMode, setIsResetMode] = useState(false); // Toggles between Login and Reset
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (email === 'admin@aidezel.uk') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Invalid login credentials' });
    } finally {
      setLoading(false);
    }
  };

  // --- RESET PASSWORD HANDLER ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setMessage({ type: 'error', text: 'Please enter your email address.' });
    
    setLoading(true);
    setMessage(null);

    try {
      // This sends a password reset email to the user
      // Note: You must configure the "Site URL" in Supabase Auth settings for the redirect to work perfectly
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/update-password`,
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Check your email for the password reset link.' 
      });
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-8 transition-all duration-300">
        
        {/* HEADER */}
        <h2 className="text-3xl font-bold text-center mb-2">
          {isResetMode ? 'Reset Password' : 'Welcome Back'}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {isResetMode 
            ? 'Enter your email to receive recovery instructions.' 
            : 'Enter your credentials to access your account.'}
        </p>
        
        {/* MESSAGE BOX (Error / Success) */}
        {message && (
          <div className={`px-4 py-3 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 mb-6 ${
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* --- FORM START --- */}
        <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-5">
          
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
          
          {!isResetMode && (
            <div className="relative animate-in fade-in slide-in-from-top-2">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                placeholder="Password" 
                required 
              />
              {/* FORGOT PASSWORD LINK */}
              <div className="text-right mt-2">
                <button 
                  type="button"
                  onClick={() => { setIsResetMode(true); setMessage(null); }}
                  className="text-xs font-bold text-gray-500 hover:text-blue-600 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          )}

          <button 
            disabled={loading} 
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95 transform duration-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              isResetMode ? <>Send Link <ArrowRight size={18} /></> : <>Sign In <ArrowRight size={18} /></>
            )}
          </button>

        </form>
        {/* --- FORM END --- */}

        {/* FOOTER LINKS */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {isResetMode ? (
            <button 
              onClick={() => { setIsResetMode(false); setMessage(null); }}
              className="flex items-center justify-center gap-2 mx-auto font-bold text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          ) : (
            <p>New here? <Link to="/register" className="font-bold underline text-black hover:text-gray-700">Create Account</Link></p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;