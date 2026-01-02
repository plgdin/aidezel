import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, CheckCircle, Truck, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logAction } from '../../lib/logger'; // <--- IMPORTED LOGGER

const ManageOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'Pending'
        ? 'Shipped'
        : currentStatus === 'Shipped'
        ? 'Delivered'
        : 'Pending';

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)),
    );

    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      alert('Failed to update status');
      fetchOrders(); // revert
    } else {
      // --- LOGGING ADDED HERE ---
      // This runs only if the database update was successful
      await logAction('Order Status Update', `Changed Order #${id} status from ${currentStatus} to ${nextStatus}`);
    }
  };

  if (loading) return <div className="p-8">Loading.</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Orders Management</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Optional search row (icon imported already) */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <Search size={16} className="text-gray-400" />
          <span className="text-xs text-gray-500">
            Showing {orders.length} orders (simple list – filter can be added later)
          </span>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Order ID</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status (Click to change)</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">#{order.id}</td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">
                      {order.customer_name}
                    </span>
                    <span className="text-xs text-gray-500">{order.email}</span>
                  </div>
                </td>

                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 font-bold text-gray-900">
                  £{Number(order.total_amount).toLocaleString()}
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => updateStatus(order.id, order.status)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit cursor-pointer select-none ${
                      order.status === 'Delivered'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : order.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {order.status === 'Shipped' && <Truck size={12} />}
                    {order.status === 'Delivered' && <CheckCircle size={12} />}
                    {order.status === 'Pending' && <Clock size={12} />}
                    {order.status}
                  </button>
                </td>

                <td className="px-6 py-4">
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Eye size={14} /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageOrders;