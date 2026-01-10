// src/pages/staff/StaffRegister.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
// NEW: Added Eye and EyeOff imports
import { ShieldCheck, Loader2, User, CreditCard, Eye, EyeOff } from 'lucide-react'; 

const StaffRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffCode, setStaffCode] = useState('');
  
  // NEW: State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: upError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              access_code: staffCode, 
              full_name: fullName,
              employee_id: employeeId
            }
          }
      });
      
      if (upError) throw upError;
          
      alert("Registration Successful! Please check your email for confirmation.");
      navigate('/staff/login');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-4 text-purple-600">
            <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">Staff Registration</h1>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold">
                {error}
            </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Full Name Field */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <User size={14}/> Full Name
                </label>
                <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                />
            </div>

            {/* Employee ID Field */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <CreditCard size={14}/> Employee ID
                </label>
                <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg" 
                    value={employeeId} 
                    onChange={e => setEmployeeId(e.target.value)} 
                    required 
                />
            </div>

            {/* Access Code Field */}
            <div>
            <label className="text-xs font-bold text-gray-500 uppercase">ACCESS CODE</label>
                <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg" 
                    placeholder="Ask manager for code" 
                    value={staffCode} 
                    onChange={e => setStaffCode(e.target.value)} 
                    required 
                />
            </div>
            
            {/* Email Field */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                <input 
                    type="email" 
                    className="w-full p-3 border rounded-lg" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                />
            </div>

            {/* Password Field with Toggle */}
            <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        className="w-full p-3 border rounded-lg pr-10" // added pr-10 for icon space
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
            </div>

            <button disabled={loading} className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
            </button>
        </form>
        <div className="text-center mt-4 text-sm">
            <Link to="/staff/login" className="text-gray-500 hover:text-black">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default StaffRegister;