// src/pages/staff/StaffRegister.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Loader2, 
  User, 
  CreditCard, 
  Eye, 
  EyeOff, 
  ArrowRight,    
  CheckCircle2,  
  RefreshCw      
} from 'lucide-react'; 
// IMPORT THE CUSTOM TOAST
import { toast } from '../../components/ui/toaster';

const StaffRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // --- STATE FOR STEPS ---
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [userOtp, setUserOtp] = useState('');
  
  // --- FORM STATE ---
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // --- STEP 1: INITIAL SIGN UP ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Initial validation check
    if (!staffCode) {
        toast.error("Missing Code", "Please enter the Staff Access Code.");
        setLoading(false);
        return;
    }

    try {
      const { error: upError } = await supabase.auth.signUp({ 
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
          
      // Success - Move to OTP
      toast.success("Code Sent!", `Please check ${email} for your verification code.`);
      setStep('otp');

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error("Registration Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (userOtp.length < 6) {
      toast.error("Invalid Code", "Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    const loadingId = toast.loading("Verifying...", "Checking your code");

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: userOtp,
        type: 'signup', 
      });

      if (error) throw error;

      // SUCCESS
      toast.dismiss(loadingId);
      
      // Use a slightly longer duration for this important message
      toast.success("Registration Successful!", "Your account is now PENDING APPROVAL. Please wait for an Admin.");
      
      // Optional: Delay navigation slightly so they see the toast
      setTimeout(() => {
          navigate('/staff/login'); 
      }, 2000);

    } catch (err: any) {
      toast.dismiss(loadingId);
      setError(err.message || "Invalid code.");
      toast.error("Verification Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RESEND LOGIC ---
  const handleResendCode = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    setResending(false);
    
    if (error) {
        toast.error("Error", error.message);
    } else {
        toast.success("New Code Sent", "Check your inbox again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        
        <div className="flex justify-center mb-4 text-purple-600">
            <ShieldCheck size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
            {step === 'form' ? 'Staff Registration' : 'Verify Email'}
        </h1>
        
        <p className="text-center text-gray-500 mb-6 text-sm">
           {step === 'form' ? 'Secure access for authorized personnel' : `Enter code sent to ${email}`}
        </p>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold text-center border border-red-100">
                {error}
            </div>
        )}

        {/* --- STEP 1: REGISTRATION FORM --- */}
        {step === 'form' && (
            <form onSubmit={handleSignUp} className="space-y-4">
                {/* Full Name Field */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        <User size={14}/> Full Name
                    </label>
                    <input 
                        type="text" 
                        className="w-full p-3 border rounded-lg focus:border-purple-600 outline-none" 
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
                        className="w-full p-3 border rounded-lg focus:border-purple-600 outline-none" 
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
                        className="w-full p-3 border rounded-lg focus:border-purple-600 outline-none" 
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
                        className="w-full p-3 border rounded-lg focus:border-purple-600 outline-none" 
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
                            className="w-full p-3 border rounded-lg pr-10 focus:border-purple-600 outline-none" 
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

                <button disabled={loading} className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors">
                    {loading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight size={18} /></>}
                </button>
            </form>
        )}

        {/* --- STEP 2: OTP INPUT --- */}
        {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in">
                <div className="relative">
                    <input
                        required
                        type="text"
                        maxLength={8} 
                        placeholder="000000"
                        className="w-full text-center text-3xl tracking-[4px] font-bold p-4 border-2 border-purple-100 rounded-xl focus:border-purple-600 outline-none text-slate-800"
                        value={userOtp}
                        onChange={e => setUserOtp(e.target.value)}
                    />
                </div>

                <button disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center gap-2 shadow-lg shadow-green-100">
                    {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> Verify Staff ID</>}
                </button>

                <div className="flex flex-col gap-3">
                    <button type="button" onClick={handleResendCode} disabled={resending} className="text-sm text-purple-600 hover:underline flex items-center justify-center gap-2">
                        {resending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Resend Code
                    </button>
                    <button type="button" onClick={() => setStep('form')} className="text-gray-400 text-sm hover:text-slate-800 underline">
                        Back to registration
                    </button>
                </div>
            </form>
        )}

        {step === 'form' && (
            <div className="text-center mt-4 text-sm">
                <Link to="/staff/login" className="text-gray-500 hover:text-purple-700 transition-colors">Back to Login</Link>
            </div>
        )}
      </div>
    </div>
  );
};

export default StaffRegister;