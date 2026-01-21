import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Lock, MapPin, Plus, Tag, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { generateInvoiceBase64 } from '../../utils/invoiceGenerator';

// --- INITIALIZE STRIPE ---
const stripePromise = loadStripe('pk_test_51Sglkr4oJa5N3YQp50I51KNbXYnq0Carqr1e7TYcCYMsanyfFBxW9aOt2wdQ5xkNDeDcRTfpomZAjRl3G9Wmvotf00wXuzGGbW');

// --- HELPER: GENERATE STRICTLY DIGITS (9 Digits) ---
// Guarantees a number between 100,000,000 and 999,999,999.
const generateOrderId = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

// --- TYPES ---
interface Address {
  id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
}

interface Coupon {
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
}

// --- HELPER: CUSTOM TOAST NOTIFICATION ---
const notify = (title: string, description: string, type: 'success' | 'error' = 'success') => {
  const isError = type === 'error';
  
  toast(
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex items-center gap-3">
        {/* Left Icon Container */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isError ? 'bg-red-500/20' : 'bg-white/10'}`}>
           {isError ? <AlertCircle size={20} className="text-red-500" /> : <Check size={20} className="text-green-400" />}
        </div>
        
        {/* Text Content */}
        <div className="flex flex-col">
          <h4 className="font-bold text-white text-sm leading-tight">{title}</h4>
          <p className="text-slate-400 text-xs mt-0.5 leading-tight">{description}</p>
        </div>
      </div>

      {/* Right Action Button */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${isError ? 'bg-red-600' : 'bg-blue-600'}`}>
        {isError ? <X size={18} className="text-white" /> : <ShieldCheck size={18} className="text-white" />}
      </div>
    </div>, 
    {
      className: `bg-[#0f172a] border border-slate-800 shadow-2xl rounded-full p-2 pr-2 min-w-[320px] flex items-center animate-in slide-in-from-bottom-5 fade-in duration-300`,
    }
  );
};

// --- VALIDATION HELPERS ---
const isValidUKPostcode = (postcode: string) => {
  const regex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
  return regex.test(postcode.trim());
};

// --- PAYMENT FORM COMPONENT ---
const PaymentForm = ({ totalAmount, onSuccess }: { totalAmount: number, onSuccess: (id: string) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/orders",
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      notify("Payment Failed", error.message || "Please check your card details.", "error");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setMessage("Redirecting...");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-4 border border-gray-200 rounded-xl bg-white">
          <PaymentElement />
      </div>
      
      {message && (
        <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} /> {message}
        </div>
      )}
      
      <button 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.99] duration-200"
      >
        {isProcessing ? <><Loader2 className="animate-spin" /> Processing...</> : <><Lock size={18} /> Pay £{totalAmount.toLocaleString()}</>}
      </button>
      
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
        <ShieldCheck size={14} className="text-green-600"/>
        <span>Payments processed securely by Stripe</span>
      </div>
    </form>
  );
};

// --- MAIN CHECKOUT PAGE ---
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartTotal, cartItems, clearCart } = useCart();
  
  // -- STATE --
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentStep, setPaymentStep] = useState(false);
  
  // Address State
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [shouldSaveNewAddress, setShouldSaveNewAddress] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // New Address Form Data
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', address_line1: '', address_line2: '', city: '', postcode: '', country: '', phone: '', email: '',
  });

  // -- CALCULATIONS --
  const subTotal = cartTotal;
  const tax = cartTotal * 0.2;
  const grossTotal = subTotal + tax;
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percent') {
        discountAmount = (grossTotal * appliedCoupon.value) / 100;
    } else {
        discountAmount = appliedCoupon.value;
    }
  }
  
  const finalTotal = Math.max(0, grossTotal - discountAmount);

  // -- 1. FETCH SAVED ADDRESSES --
  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setFormData(prev => ({ ...prev, email: session.user.email || '' }));

        const { data: addresses } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('is_default', { ascending: false });

        if (addresses && addresses.length > 0) {
          setSavedAddresses(addresses);
          setSelectedAddressId(addresses[0].id); 
        }
      }
    };
    loadData();
  }, []);

  // -- 2. HANDLE COUPON --
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

    setCouponLoading(false);

    if (error || !data) {
        notify('Invalid Coupon', 'This code does not exist or is expired.', 'error');
        setAppliedCoupon(null);
    } else {
        setAppliedCoupon(data);
        const savedVal = data.discount_type === 'percent' ? `${data.value}%` : `£${data.value}`;
        notify('Coupon Applied!', `You saved ${savedVal} on this order.`);
    }
  };

  // -- 3. INITIALIZE PAYMENT --
  const initializePayment = async () => {
    if (cartItems.length === 0) return notify('Cart is empty', 'Add items to proceed.', 'error');
    
    // Resolve Shipping Details
    let shippingDetails;
    if (selectedAddressId === 'new') {
         // 1. Check for Missing Fields (Including Phone)
         if (!formData.firstName || !formData.address_line1 || !formData.city || !formData.postcode || !formData.phone) {
             return notify('Missing Details', 'Please fill in all address fields, including your phone number.', 'error');
         }

         // 2. Validate Postcode
         if (!isValidUKPostcode(formData.postcode)) {
             return notify('Invalid Postcode', 'Please enter a valid UK postcode (e.g. SW1A 1AA).', 'error');
         }

         shippingDetails = {
             full_name: `${formData.firstName} ${formData.lastName}`,
             address_line1: formData.address_line1,
             address_line2: formData.address_line2,
             city: formData.city,
             postcode: formData.postcode,
             country: formData.country,
             phone: formData.phone,
             email: formData.email
         };
    } else {
        const addr = savedAddresses.find(a => a.id === selectedAddressId);
        if (!addr) return;
        shippingDetails = {
            full_name: addr.full_name,
            address_line1: addr.address_line1,
            address_line2: addr.address_line2,
            city: addr.city,
            postcode: addr.postcode,
            country: addr.country,
            phone: addr.phone,
            email: formData.email
        };
    }

    setLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();

        // Save New Address Logic
        if (selectedAddressId === 'new' && shouldSaveNewAddress && session) {
            await supabase.from('user_addresses').insert({
                user_id: session.user.id,
                full_name: shippingDetails.full_name,
                address_line1: shippingDetails.address_line1,
                address_line2: shippingDetails.address_line2,
                city: shippingDetails.city,
                postcode: shippingDetails.postcode,
                country: shippingDetails.country,
                phone: shippingDetails.phone
            });
        }

        // Call Backend
        const { data, error } = await supabase.functions.invoke('bright-responder', {
            body: { 
                amount: Math.round(finalTotal * 100), 
                metadata: { 
                    userId: session?.user?.id,
                    email: shippingDetails.email,
                    coupon: appliedCoupon ? appliedCoupon.code : null
                } 
            }
        });

        if (error) throw error;
        if (data?.clientSecret) {
            setClientSecret(data.clientSecret);
            setPaymentStep(true);
        }
    } catch (err: any) {
        console.error(err);
        notify('Connection Error', 'Could not connect to payment server. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
  };

  // -- 4. HANDLE SUCCESS (Updated with Numeric ID + Async Invoice) --
  const handleOrderSuccess = async (paymentId: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        let finalShipping;
        if (selectedAddressId === 'new') {
            finalShipping = {
                name: `${formData.firstName} ${formData.lastName}`,
                address: formData.address_line1 + (formData.address_line2 ? `, ${formData.address_line2}` : ''),
                city: formData.city,
                postcode: formData.postcode,
            };
        } else {
            const addr = savedAddresses.find(a => a.id === selectedAddressId);
            finalShipping = {
                name: addr?.full_name,
                address: addr?.address_line1 + (addr?.address_line2 ? `, ${addr.address_line2}` : ''),
                city: addr?.city,
                postcode: addr?.postcode,
            };
        }

        // FIX 1: Generate Short Numeric ID
        const customOrderId = generateOrderId();

        const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
            id: customOrderId, // Insert 9-digit numeric ID
            user_id: session?.user?.id || null,
            customer_name: finalShipping.name,
            email: formData.email,
            address: finalShipping.address,
            city: finalShipping.city,
            postcode: finalShipping.postcode,
            total_amount: finalTotal,
            status: 'Paid',
            payment_id: paymentId,
        }])
        .select().single();

        if (orderError) throw orderError;

        const invoiceItems = [];
        for (const item of cartItems) {
            // FIX 2: Store Gross Price (Price * 1.2) for proper invoice calculation
            const priceIncTax = item.price * 1.2;

            await supabase.from('order_items').insert({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: priceIncTax, // Storing Gross Price
                selected_variant: (item as any).selectedVariant || ''
            });

            await supabase.rpc('decrement_stock', { product_id: item.id, quantity: item.quantity });
            invoiceItems.push({ name: item.name, quantity: item.quantity, price: priceIncTax });
        }

        // FIX 3: Await the Async Invoice Generator (to load logo)
        const pdfBase64 = await generateInvoiceBase64({ id: orderData.id, customer_name: finalShipping.name || '' }, invoiceItems);
        
        await fetch('/api/send-email', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 email: formData.email,
                 type: 'invoice',
                 data: { orderId: orderData.id, name: finalShipping.name, total: formatCurrency(finalTotal) },
                 attachments: [{ content: pdfBase64, filename: `Invoice-${orderData.id}.pdf` }]
             })
        });

        clearCart();
        notify('Order Successful!', 'Thank you for your purchase. Invoice sent.');
        setTimeout(() => navigate('/orders'), 2000);

    } catch (error: any) {
        console.error(error);
        notify('Order Creation Failed', 
            error.message.includes('uuid') ? 'DB Error: Ensure Order ID is TEXT type in Supabase.' : 'Payment taken but order failed. Please contact support.', 
            'error'
        );
    }
  };

  const formatCurrency = (val: number) => `£${val.toFixed(2)}`;

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen bg-gray-50/50">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* --- LEFT COLUMN: ADDRESS & PAYMENT --- */}
        <div className="lg:col-span-2 space-y-8">
            
          <div className={`p-6 rounded-2xl border bg-white transition-all duration-300 ${paymentStep ? 'opacity-60 pointer-events-none' : 'shadow-md border-blue-200'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Shipping Details
            </h2>

            {/* SAVED ADDRESSES GRID */}
            {savedAddresses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {savedAddresses.map((addr) => (
                        <div 
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 font-bold text-gray-900 truncate">
                                    <MapPin size={16} /> {addr.full_name}
                                </div>
                                {selectedAddressId === addr.id && <Check size={18} className="text-blue-600"/>}
                            </div>
                            <p className="text-sm text-gray-600 mt-2 truncate">{addr.address_line1}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.postcode}</p>
                        </div>
                    ))}
                    
                    <button 
                        onClick={() => setSelectedAddressId('new')}
                        className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${selectedAddressId === 'new' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-500 hover:border-blue-400'}`}
                    >
                        <Plus size={24} />
                        <span className="font-bold">Add New Address</span>
                    </button>
                </div>
            )}

            {/* NEW ADDRESS FORM */}
            {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required placeholder="First Name" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                        <input required placeholder="Last Name" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                        <input required type="email" placeholder="Email Address" className="md:col-span-2 p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        
                        <input required placeholder="Address Line 1" className="md:col-span-2 p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} />
                        <input placeholder="Address Line 2 (Optional)" className="md:col-span-2 p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.address_line2} onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })} />

                        <input required placeholder="City" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                        
                        {/* POSTCODE VALIDATION UI HINT */}
                        <div className="relative">
                            <input required placeholder="Post Code (e.g. SW1A 1AA)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all uppercase"
                                value={formData.postcode} onChange={(e) => setFormData({ ...formData, postcode: e.target.value })} />
                        </div>

                        <input placeholder="Country" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                        
                        {/* PHONE IS NOW REQUIRED */}
                        <input required placeholder="Phone Number" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                        <input 
                            type="checkbox" 
                            id="saveAddr" 
                            checked={shouldSaveNewAddress} 
                            onChange={(e) => setShouldSaveNewAddress(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="saveAddr" className="text-sm text-gray-700 cursor-pointer select-none">Save this address for future orders</label>
                    </div>
                </div>
            )}

            {!paymentStep && (
                <button
                    onClick={initializePayment}
                    disabled={loading}
                    className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-[0.99] duration-200"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Proceed to Payment'}
                </button>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: SUMMARY & COUPONS --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate max-w-[180px]">{item.quantity}x {item.name}</span>
                            <span className="font-medium">£{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                {!paymentStep && (
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Have a coupon?</label>
                        <div className="flex gap-2">
                            <input 
                                placeholder="Enter code" 
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={!!appliedCoupon}
                                className="flex-1 p-2 text-sm border rounded-lg uppercase outline-none focus:border-black transition-colors"
                            />
                            {appliedCoupon ? (
                                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-red-100 text-red-600 px-3 rounded-lg hover:bg-red-200 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            ) : (
                                <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                                    {couponLoading ? <Loader2 size={16} className="animate-spin"/> : 'Apply'}
                                </button>
                            )}
                        </div>
                        {appliedCoupon && (
                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1 font-bold bg-green-50 p-2 rounded animate-in fade-in slide-in-from-top-1">
                                <Tag size={12} /> Coupon "{appliedCoupon.code}" applied!
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2 mb-4 text-sm text-gray-600 border-t pt-4">
                    <div className="flex justify-between"><span>Subtotal</span><span>£{subTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>VAT (20%)</span><span>£{tax.toLocaleString()}</span></div>
                    
                    {appliedCoupon && (
                        <div className="flex justify-between text-green-600 font-bold">
                            <span>Discount ({appliedCoupon.code})</span>
                            <span>-£{discountAmount.toLocaleString()}</span>
                        </div>
                    )}
                    
                    <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-xl">
                        <span>Total</span><span>£{finalTotal.toLocaleString()}</span>
                    </div>
                </div>

                {!paymentStep && (
                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold justify-center bg-green-50 py-2 rounded-lg">
                        <ShieldCheck size={16} /> Secure SSL Encryption
                    </div>
                )}
            </div>

            {paymentStep && clientSecret && (
                <div className="bg-white p-6 rounded-2xl border border-blue-500 shadow-xl ring-4 ring-blue-50/50 animate-in zoom-in-95 duration-300">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                        Secure Payment
                    </h2>
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <PaymentForm totalAmount={finalTotal} onSuccess={handleOrderSuccess} />
                    </Elements>
                    <button onClick={() => setPaymentStep(false)} className="text-xs text-gray-400 underline mt-4 text-center w-full hover:text-gray-600">
                        Edit details or Coupon
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;