import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. Create a profile entry in the database
        const { error: profileError } = await supabase.from('profiles').insert([
          { id: data.user.id, email: formData.email, full_name: formData.fullName }
        ]);
        
        if (profileError) throw profileError;

        alert('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Full Name</label>
            <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18} /><input className="w-full pl-10 p-3 border rounded-xl" required onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Email</label>
            <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18} /><input type="email" className="w-full pl-10 p-3 border rounded-xl" required onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Password</label>
            <div className="relative"><Lock className="absolute left-3 top-3 text-gray-400" size={18} /><input type="password" className="w-full pl-10 p-3 border rounded-xl" required onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          </div>
          <button disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <>Sign Up <ArrowRight size={18}/></>}
          </button>
        </form>
        <p className="text-center mt-6 text-sm">Already have an account? <Link to="/login" className="font-bold underline">Login</Link></p>
      </div>
    </div>
  );
};
export default Register;