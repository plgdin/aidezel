import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
          setLoading(false);
          return;
      }

      // Fetch orders matching the user's email
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('email', session.user.email) 
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-medium">Loading orders...</div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
          <p className="text-gray-500">Looks like you haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                
                {/* Left Side: ID and Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-900">Order #{order.id}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                  </div>
                  <p className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                </div>

                {/* Right Side: Total and Details */}
                <div className="flex items-center gap-8 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                   <div className="text-left md:text-right">
                       <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Amount</p>
                       <p className="font-bold text-2xl text-gray-900">£{order.total_amount.toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;