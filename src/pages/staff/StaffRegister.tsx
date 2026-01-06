// src/pages/staff/StaffRegister.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, User, Lock, Mail, KeyRound } from 'lucide-react';

const StaffRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffCode, setStaffCode] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Send data to Supabase Auth
      const { data, error: upError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              // CRITICAL FIX: Sending 'access_code' in snake_case to match DB Trigger
              access_code: staffCode,
              full_name: fullName // Now using the actual input value
            }
          }
      });
      
      // 2. Handle Database Errors (e.g., Wrong Access Code)
      if (upError) throw upError;
          
      // 3. Success
      alert("Registration Successful! Please check your email for confirmation.");
      navigate('/staff/login');

    } catch (err: any) {
      console.error(err);
      // Clean up the error message to be more user-friendly
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-4 text-purple-600">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Staff Registration</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Create your account to access the dashboard</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Access Code Field */}
            <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Access Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text" 
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Enter STAFF2025"
                value={staffCode}
                onChange={e => setStaffCode(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Full Name Field (Added this for you) */}
            <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="John Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email" 
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
            <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password" 
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3.5 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
            </button>
        </form>

        <div className="text-center mt-6 text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/staff/login" className="text-purple-700 font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffRegister;