import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartTotal, cartItems, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', address: '', city: '', postcode: '', email: ''
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const totalAmount = cartTotal * 1.2; 

    try {
      // 1. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
            customer_name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            postcode: formData.postcode,
            total_amount: totalAmount,
            status: 'Pending' 
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert Order Items AND Reduce Stock
      for (const item of cartItems) {
        // A. Add item to order history
        await supabase.from('order_items').insert({
          order_id: orderData.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          // FIX: item.price is already a number now, so we pass it directly
          price: item.price 
        });

        // B. Fetch current stock
        const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.id)
            .single();

        if (product) {
            // C. Calculate new stock
            const newStock = Math.max(0, product.stock_quantity - item.quantity);
            const newStatus = newStock === 0 ? 'Out of Stock' : 'In Stock';
            
            // D. Update Database
            await supabase
                .from('products')
                .update({ stock_quantity: newStock, status: newStatus })
                .eq('id', item.id);
        }
      }

      clearCart();
      alert("Order Placed Successfully!");
      navigate('/'); 

    } catch (error: any) {
      alert("Error placing order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl border border-gray-200 bg-white">
            <h2 className="text-xl font-bold mb-6">Shipping Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="First Name" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input required placeholder="Last Name" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, lastName: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="md:col-span-2 p-3 border rounded-lg" onChange={e => setFormData({...formData, email: e.target.value})} />
              <input required placeholder="Address" className="md:col-span-2 p-3 border rounded-lg" onChange={e => setFormData({...formData, address: e.target.value})} />
              <input required placeholder="City" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, city: e.target.value})} />
              <input required placeholder="Post Code" className="p-3 border rounded-lg" onChange={e => setFormData({...formData, postcode: e.target.value})} />
            </div>
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "Place Order"}
          </button>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
             <h3 className="font-bold text-lg mb-4">Order Total: £{(cartTotal * 1.2).toLocaleString()}</h3>
             <div className="flex items-center gap-2 text-green-600 text-xs font-bold"><ShieldCheck size={16} /> Secure SSL Encryption</div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;