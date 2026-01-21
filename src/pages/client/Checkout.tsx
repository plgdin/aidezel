import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { generateInvoiceBase64 } from '../../utils/invoiceGenerator';

// --- 1. INITIALIZE STRIPE ---
const stripePromise = loadStripe('pk_test_51Sglkr4oJa5N3YQp50I51KNbXYnq0Carqr1e7TYcCYMsanyfFBxW9aOt2wdQ5xkNDeDcRTfpomZAjRl3G9Wmvotf00wXuzGGbW');

// --- 2. INNER PAYMENT FORM COMPONENT ---
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
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setMessage("Payment processing...");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-4 border border-gray-200 rounded-xl bg-white">
          <PaymentElement />
      </div>
      
      {message && <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded">{message}</div>}
      
      <button 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
      >
        {isProcessing ? (
           <><Loader2 className="animate-spin" /> Processing...</>
        ) : (
           <><Lock size={18} /> Pay £{totalAmount.toLocaleString()}</>
        )}
      </button>
      
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
        <ShieldCheck size={14} className="text-green-600"/>
        <span>Payments processed securely by Stripe</span>
      </div>
    </form>
  );
};

// --- 3. MAIN CHECKOUT PAGE ---
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartTotal, cartItems, clearCart } = useCart();
  
  // State
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentStep, setPaymentStep] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
  });

  const totalAmount = cartTotal * 1.2; 

  // --- Pre-fill data from Profile ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const names = (profile.full_name || '').split(' ');
          setFormData({
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            email: session.user.email || '',
            address: profile.address || '',
            city: profile.city || '',
            postcode: profile.postcode || '',
            phone: profile.phone || '',
          });
        }
      }
    };
    fetchUserProfile();
  }, []);

  // --- STEP 1: INITIALIZE PAYMENT ---
  const initializePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // FIX: Reverted to (string, object) syntax
    if (cartItems.length === 0) return toast('Cart is empty', { className: 'bg-red-900 text-white' });
    if (!formData.firstName || !formData.address || !formData.email) return toast('Missing Details', { description: 'Please fill in all details', className: 'bg-red-900 text-white' });

    setLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();

        const { data, error } = await supabase.functions.invoke('bright-responder', {
            body: { 
                // *** FIX APPLIED HERE: Multiply by 100 for Stripe cents/pence ***
                amount: Math.round(totalAmount * 100), 
                metadata: { 
                    userId: session?.user?.id,
                    email: formData.email 
                } 
            }
        });

        if (error) throw error;
        if (data?.clientSecret) {
            setClientSecret(data.clientSecret);
          setPaymentStep(true);
        }
    } catch (err: any) {
        console.error("Payment setup failed:", err);
      // FIX: Reverted syntax
        toast('Payment Error', { 
            description: 'Could not connect to payment server. Please try again.',
            className: 'bg-red-900 text-white'
        });
    } finally {
        setLoading(false);
    }
  };

  // --- STEP 2: HANDLE ORDER SUCCESS ---
  const handleOrderSuccess = async (paymentId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user || null;
      const accountEmail = user?.email || formData.email;

      // 1. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null,
          customer_name: `${formData.firstName} ${formData.lastName}`,
          email: accountEmail,
          address: formData.address,
          city: formData.city,
          postcode: formData.postcode,
          total_amount: totalAmount,
          status: 'Paid',
          payment_id: paymentId,
        }])
        .select()
        .single();

      if (orderError || !orderData) throw orderError || new Error('Failed to create order');

      // 2. Insert Order Items & Reduce Stock
      const invoiceItems = [];

      for (const item of cartItems) {
        await supabase.from('order_items').insert({
            order_id: orderData.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
            selected_variant: (item as any).selectedVariant || ''
        });

        await supabase.rpc('decrement_stock', { 
            product_id: item.id, 
            quantity: item.quantity 
        });

        invoiceItems.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        });
      }

      // --- 3. GENERATE INVOICE & SEND EMAIL ---
      try {
        // Safe PDF Generation
        const pdfBase64 = generateInvoiceBase64(
          {
            id: orderData.id,
            customer_name: `${formData.firstName} ${formData.lastName}`,
          },
          invoiceItems || []
        );

        console.log("PDF generated successfully, length:", pdfBase64.length);

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            type: 'invoice',
            data: {
              orderId: orderData.id.slice(0, 8).toUpperCase(),
              name: `${formData.firstName} ${formData.lastName}`,
              total: totalAmount,
            },
            attachments: [
              {
                content: pdfBase64,
                filename: `Invoice-${orderData.id.slice(0, 8)}.pdf`,
              }
            ]
          })
        });

        console.log("Invoice sent successfully");
      } catch (emailErr) {
        console.error("Failed to send invoice email:", emailErr);
      }

      // 4. Cleanup
      clearCart();

      // FIX: Reverted syntax
      toast('Order Paid Successfully', {
        description: 'Check your email for the invoice.',
        className: 'bg-green-600 text-white border-none',
      });

      setTimeout(() => navigate('/orders'), 2000);

    } catch (error: any) {
      console.error(error);
      // FIX: Reverted syntax and fixed missing brace
      toast('Order Creation Failed', {
        description: 'Please contact support.',
        className: 'bg-red-900 text-white',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen bg-gray-50/50">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT COLUMN: Shipping Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className={`p-6 rounded-2xl border bg-white transition-all duration-300 ${paymentStep ? 'border-gray-200 opacity-60 pointer-events-none' : 'border-blue-200 shadow-md'}`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Shipping Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="First Name" className="p-3 border rounded-lg"
                value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              
              <input required placeholder="Last Name" className="p-3 border rounded-lg"
                value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              
              <input required type="email" placeholder="Email Address" className="md:col-span-2 p-3 border rounded-lg"
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              
              <input required placeholder="Address" className="md:col-span-2 p-3 border rounded-lg"
                value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              
              <input required placeholder="City" className="p-3 border rounded-lg"
                value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              
              <input required placeholder="Post Code" className="p-3 border rounded-lg"
                value={formData.postcode} onChange={(e) => setFormData({ ...formData, postcode: e.target.value })} />
                
              <input placeholder="Phone (Optional)" className="md:col-span-2 p-3 border rounded-lg"
                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            {!paymentStep && (
                <button
                    onClick={initializePayment}
                    disabled={loading}
                    className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Proceed to Payment'}
                </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Payment */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Subtotal</span><span>£{cartTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>VAT / Tax (20%)</span><span>£{(cartTotal * 0.2).toLocaleString()}</span></div>
                    <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-lg">
                        <span>Total</span><span>£{totalAmount.toLocaleString()}</span>
                    </div>
                </div>
                
                {!paymentStep && (
                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold justify-center bg-green-50 py-2 rounded-lg">
                        <ShieldCheck size={16} /> Secure SSL Encryption
                    </div>
                )}
            </div>

            {paymentStep && clientSecret && (
                <div className="bg-white p-6 rounded-2xl border border-blue-500 shadow-xl ring-4 ring-blue-50/50">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                        Secure Payment
                    </h2>
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <PaymentForm 
                            totalAmount={totalAmount} 
                            onSuccess={handleOrderSuccess}
                        />
                    </Elements>
                    <button onClick={() => setPaymentStep(false)} className="text-xs text-gray-400 underline mt-4 text-center w-full hover:text-gray-600">
                        Edit Shipping Details
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;