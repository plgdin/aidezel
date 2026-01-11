import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- STATE ---
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [userOtp, setUserOtp] = useState('');     // The code they type from their email

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // --- STEP 1: INITIAL SIGN UP ---
  // This triggers Supabase to send the REAL OTP via your Resend SMTP
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'client'
          },
        },
      });

      if (error) throw error;

      // If successful, Supabase has now sent the OTP automatically
      toast("Verification code sent to your email!", { className: 'bg-blue-900 text-white' });
      setStep('otp');

    } catch (error: any) {
      console.error(error);
      toast(error.message, { className: 'bg-red-900 text-white' });
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP ---
  // This tells Supabase "The user typed this code, now let them in"
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: userOtp,
        type: 'signup', // Crucial: tells Supabase this is a new registration
      });

      if (error) throw error;

      toast("Email verified! Welcome to Aidezel.", { className: 'bg-green-600 text-white' });
      navigate('/dashboard'); // Go straight to the app

    } catch (error: any) {
      toast("Invalid or expired code. Please try again.", { className: 'bg-red-900 text-white' });
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
          {step === 'form' ? 'Start your journey with Aidezel' : `Enter the 6-digit code sent to ${formData.email}`}
        </p>

        {/* === SCREEN 1: REGISTRATION FORM === */}
        {step === 'form' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:border-black"
                  required
                  placeholder="John Doe"
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
                  placeholder="email@example.com"
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
                  placeholder="••••••••"
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
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="flex justify-center">
              <div className="bg-gray-100 p-4 rounded-full">
                <Mail className="text-black" size={32} />
              </div>
            </div>

            <div className="relative">
              <div className="text-center mb-2 text-xs text-gray-500 uppercase tracking-wider font-bold">Security Code</div>
              <input
                required
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[8px] font-bold p-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-all"
                value={userOtp}
                onChange={e => setUserOtp(e.target.value)}
              />
            </div>

            <button disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center gap-2 shadow-lg shadow-green-100">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> Verify & Login</>}
            </button>

            <button type="button" onClick={() => setStep('form')} className="w-full text-gray-400 text-sm hover:text-black underline">
              Back to registration
            </button>
          </form>
        )}

        {step === 'form' && (
          <p className="text-center mt-6 text-sm">Already have an account? <Link to="/login" className="font-bold underline">Login</Link></p>
        )}
      </div>
    </div>
  );
};

export default Register;