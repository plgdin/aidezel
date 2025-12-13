import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartTotal, cartItems, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postcode: '',
    email: '',
  });

  // --- NEW: Pre-fill data from Profile ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 2. Get Profile Data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // 3. Split Full Name into First/Last
          const names = (profile.full_name || '').split(' ');
          const firstName = names[0] || '';
          const lastName = names.slice(1).join(' ') || '';

          // 4. Pre-fill Form
          setFormData({
            firstName: firstName,
            lastName: lastName,
            email: session.user.email || '',
            address: profile.address || '',
            city: profile.city || '',
            postcode: profile.postcode || '',
          });
        }
      }
    };

    fetchUserProfile();
  }, []);
  // -------------------------------------

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast('Cart is empty', {
        description: 'Please add some products before placing an order.',
        className: 'bg-red-900 border border-red-700 text-white',
      });
      return;
    }

    setLoading(true);
    const totalAmount = cartTotal * 1.2; // 20% VAT

    try {
      // 🔹 0. Get logged-in user (if any)
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user || null;

      // We always use the ACCOUNT email to link orders to "My Orders".
      const accountEmail = user?.email || formData.email;

      // 1. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: `${formData.firstName} ${formData.lastName}`,
            email: accountEmail, // 🔥 key line: use auth email if logged in
            address: formData.address,
            city: formData.city,
            postcode: formData.postcode,
            total_amount: totalAmount,
            status: 'Pending',
          },
        ])
        .select()
        .single();

      if (orderError || !orderData) {
        throw orderError || new Error('Failed to create order');
      }

      // 2. Insert Order Items AND Reduce Stock
      for (const item of cartItems) {
        // A. Add item to order history
        const { error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price, // already number
          });

        if (orderItemError) {
          console.error(orderItemError);
          throw new Error('Failed to save order items');
        }

        // B. Fetch current stock
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();

        if (productError) {
          console.error(productError);
          throw new Error('Failed to fetch product stock');
        }

        if (product) {
          // C. Calculate new stock
          const newStock = Math.max(0, product.stock_quantity - item.quantity);
          const newStatus = newStock === 0 ? 'Out of Stock' : 'In Stock';

          // D. Update Database
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock, status: newStatus })
            .eq('id', item.id);

          if (updateError) {
            console.error(updateError);
            throw new Error('Failed to update product stock');
          }
        }
      }

      // 3. Clear cart
      clearCart();

      // 4. Success toast
      toast('Order Confirmed ✔', {
        description: (
          <span className="text-slate-300">
            Thank you for shopping with <b className="text-blue-400">Aidezel</b>.
            You can view your invoice in the Orders page.
          </span>
        ),
        className:
          'bg-slate-950 border border-slate-800 text-white shadow-xl rounded-xl',
        duration: 4000,
      });

      // 5. Redirect to My Orders (change to '/' if you prefer home)
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast('Order Failed ❌', {
        description:
          error?.message || 'There was an error placing your order. Please try again.',
        className: 'bg-red-900 border border-red-700 text-white',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-3 gap-12"
      >
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl border border-gray-200 bg-white">
            <h2 className="text-xl font-bold mb-6">Shipping Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder="First Name"
                className="p-3 border rounded-lg"
                value={formData.firstName} // <-- Added Value Binding
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
              <input
                required
                placeholder="Last Name"
                className="p-3 border rounded-lg"
                value={formData.lastName} // <-- Added Value Binding
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
              <input
                required
                type="email"
                placeholder="Email Address"
                className="md:col-span-2 p-3 border rounded-lg"
                value={formData.email} // <-- Added Value Binding
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <input
                required
                placeholder="Address"
                className="md:col-span-2 p-3 border rounded-lg"
                value={formData.address} // <-- Added Value Binding
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <input
                required
                placeholder="City"
                className="p-3 border rounded-lg"
                value={formData.city} // <-- Added Value Binding
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
              <input
                required
                placeholder="Post Code"
                className="p-3 border rounded-lg"
                value={formData.postcode} // <-- Added Value Binding
                onChange={(e) =>
                  setFormData({ ...formData, postcode: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Place Order'}
          </button>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-lg mb-4">
              Order Total: £{(cartTotal * 1.2).toLocaleString()}
            </h3>
            <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
              <ShieldCheck size={16} /> Secure SSL Encryption
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;