import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Logic to check if user is admin (Simple hardcoded check for now)
      if (email === 'admin@aidezel.uk') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
        <form onSubmit={handleLogin} className="space-y-6 mt-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-3 border rounded-xl" placeholder="Email" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 p-3 border rounded-xl" placeholder="Password" required />
          </div>
          <button disabled={loading} className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
        <p className="text-center mt-6 text-sm">New here? <Link to="/register" className="font-bold underline">Create Account</Link></p>
      </div>
    </div>
  );
};
export default Login;