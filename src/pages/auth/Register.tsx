import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- STATE ---
  const [step, setStep] = useState<'form' | 'otp'>('form'); // Controls which screen to show
  const [serverOtp, setServerOtp] = useState(''); // The code we sent
  const [userOtp, setUserOtp] = useState('');     // The code they typed

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // --- STEP 1: SEND OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setServerOtp(code); // Save it to compare later

      // 2. Send it via your API
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          type: 'otp', // Uses the "Amazon Style" template
          data: { code: code }
        })
      });

      // 3. Switch to OTP Screen
      // FIX: specific string first, then options
      toast("OTP Sent! Check your email.", { className: 'bg-blue-900 text-white' });
      setStep('otp');

    } catch (error: any) {
      console.error(error);
      toast("Failed to send OTP", { className: 'bg-red-900 text-white' });
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY & REGISTER ---
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Check the code
    if (userOtp !== serverOtp) {
      setLoading(false);
      // FIX: specific string first
      return toast("Incorrect OTP. Please try again.", { className: 'bg-red-900 text-white' });
    }

    try {
  // 2. Sign up with Supabase Auth AND pass metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'client' // Ensure they get the client role
          },
        },
      });

      if (error) throw error;

      // 3. Success
      // FIX: specific string first
      toast("Registration successful! Please log in.", { className: 'bg-green-600 text-white' });
      navigate('/login');

    } catch (error: any) {
      // FIX: specific string first
      toast(error.message, { className: 'bg-red-900 text-white' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-8">

        <h2 className="text-3xl font-bold text-center mb-2">
          {step === 'form' ? 'Create Account' : 'Verify Email'}
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {step === 'form' ? 'Start your journey with Aidezel' : `Enter the code sent to ${formData.email}`}
        </p>

        {/* === SCREEN 1: REGISTRATION FORM === */}
        {step === 'form' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:border-black"
                  required
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:border-black"
                  required
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:border-black"
                  required
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
            <button disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 transition-colors">
              {loading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {/* === SCREEN 2: OTP INPUT === */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="flex justify-center">
              <div className="bg-gray-100 p-4 rounded-full">
                <Mail className="text-black" size={32} />
              </div>
            </div>

            <div className="relative">
              <div className="text-center mb-2 text-xs text-gray-500 uppercase tracking-wider font-bold">One Time Password</div>
              <input
                required
                type="text"
                maxLength={6}
                placeholder="123456"
                className="w-full text-center text-3xl tracking-[8px] font-bold p-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-all"
                value={userOtp}
                onChange={e => setUserOtp(e.target.value)}
              />
            </div>

            <button disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center gap-2 shadow-lg shadow-green-100">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> Verify & Register</>}
            </button>

            <button type="button" onClick={() => setStep('form')} className="w-full text-gray-400 text-sm hover:text-black underline">
              Incorrect email? Go Back
            </button>
          </form>
        )}

        {/* FOOTER (Only show on first step) */}
        {step === 'form' && (
          <p className="text-center mt-6 text-sm">Already have an account? <Link to="/login" className="font-bold underline">Login</Link></p>
        )}
      </div>
    </div>
  );
};
export default Register;