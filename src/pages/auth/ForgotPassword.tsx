import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // --- PASSWORD STRENGTH LOGIC ---
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (!pw) return 0;
    if (pw.length >= 8) score++; 
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthLabels = ["Very Weak", "Weak", "Medium", "Strong", "Excellent"];
  const strengthColors = ["bg-gray-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  // 1. Send OTP via Aidezel Custom SMTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast(error.message, { className: 'bg-red-900 text-white' });
    } else {
      setStep('otp');
      toast("8-digit code sent to your email!", { className: 'bg-blue-900 text-white' });
    }
    setLoading(false);
  };

  // 2. Verify 8-Digit OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 8) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery', // Recovery type for password resets
    });
    if (error) {
      toast("Invalid code. Try again.", { className: 'bg-red-900 text-white' });
    } else {
      setStep('reset');
    }
    setLoading(false);
  };

  // 3. Final Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast(error.message);
    } else {
      toast("Security updated! Redirecting to Home...");
      navigate('/'); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-gray-100 transition-all">
        <h2 className="text-3xl font-extrabold text-center mb-2 text-gray-900">
          {step === 'email' && 'Reset Password'}
          {step === 'otp' && 'Verify Identity'}
          {step === 'reset' && 'Create Password'}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          {step === 'email' && 'Enter your email for a reset code.'}
          {step === 'otp' && `Enter the 8-digit code sent to ${email}`}
          {step === 'reset' && 'Choose a strong, unique password.'}
        </p>

        {step === 'email' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full pl-10 p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                required 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <button disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" /> : <>Send Code <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <input 
              maxLength={8} 
              placeholder="00000000" 
              className="w-full text-center text-4xl tracking-[10px] font-black p-5 border-2 border-gray-100 rounded-2xl focus:border-black outline-none transition-all" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              required
            />
            <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">
              {loading ? <Loader2 className="animate-spin" /> : 'Verify Identity'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="password" 
                placeholder="New Password" 
                className="w-full pl-10 p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                required 
                minLength={8} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </div>

            {/* STRENGTH METER UI */}
            <div className="px-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Security Level</span>
                <span className={`text-xs font-bold ${strength > 2 ? 'text-green-600' : 'text-gray-500'}`}>
                  {strengthLabels[strength]}
                </span>
              </div>
              <div className="flex gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-full w-full rounded-full transition-all duration-500 ${
                      i <= strength ? strengthColors[strength] : "bg-gray-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button 
              disabled={loading || strength < 3} 
              className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all 
                ${strength < 3 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-xl shadow-green-100'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Secure Account</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;