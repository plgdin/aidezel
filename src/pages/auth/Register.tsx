import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // --- STATE ---
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [userOtp, setUserOtp] = useState(''); 

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  // --- STEP 1: INITIAL SIGN UP (TRIGGERS EMAIL) ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This call triggers the official Supabase OTP via Resend SMTP
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

      // If we reach here, the email has been handed to Resend for delivery
      toast("Verification code sent!", { className: 'bg-blue-900 text-white' });
      setStep('otp');

    } catch (error: any) {
      toast(error.message || "Registration failed", { className: 'bg-red-900 text-white' });
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP (COMPLETES REGISTRATION) ---
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userOtp.length < 6) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: userOtp,
        type: 'signup', 
      });

      if (error) throw error;

      toast("Verified! Redirecting...", { className: 'bg-green-600 text-white' });
      navigate('/dashboard'); 

    } catch (error: any) {
      toast("Invalid code. Please check your email again.", { className: 'bg-red-900 text-white' });
    } finally {
      setLoading(false);
    }
  };

  // --- OPTIONAL: RESEND CODE ---
  const handleResendCode = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
    });
    setResending(false);
    if (error) toast(error.message);
    else toast("New code sent!");
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

        {/* SCREEN 1: FORM */}
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

        {/* SCREEN 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="relative">
              <input
                required
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[8px] font-bold p-4 border-2 border-gray-200 rounded-xl focus:border-black outline-none"
                value={userOtp}
                onChange={e => setUserOtp(e.target.value)}
              />
            </div>

            <button disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> Verify & Register</>}
            </button>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-2"
              >
                {resending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Didn't get a code? Resend
              </button>

              <button type="button" onClick={() => setStep('form')} className="text-gray-400 text-sm hover:text-black underline">
                Back to registration
              </button>
            </div>
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