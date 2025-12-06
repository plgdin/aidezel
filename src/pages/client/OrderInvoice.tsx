import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Printer } from 'lucide-react';

const OrderInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        // 1️⃣ Fetch the order itself
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (orderError || !orderData) {
          throw orderError || new Error('Order not found');
        }

        // Optional: check user email matches
        if (session && orderData.email !== session.user.email) {
          throw new Error('You are not allowed to view this order.');
        }

        // 2️⃣ Fetch all items for this order
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id)
          .order('id', { ascending: true });

        if (itemsError) throw itemsError;

        setOrder(orderData);
        setItems(itemsData || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading invoice…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-red-600 font-medium mb-4">
          {error || 'Invoice not found.'}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
      </div>
    );
  }

  const itemsTotal = items.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const grandTotal = Number(order.total_amount || 0);
  const tax = Math.max(0, grandTotal - itemsTotal);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Top actions */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800"
          >
            <Download size={16} /> Download (Print to PDF)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Aidezel
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Premium Electronics &amp; Lifestyle Store
            </p>
          </div>
          <div className="text-sm text-gray-600 space-y-1 md:text-right">
            <p className="font-semibold text-gray-900">
              Invoice #{order.id}
            </p>
            <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
            <p>
              Status: <span className="font-semibold">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Billing / Order Info */}
        <div className="grid md:grid-cols-2 gap-6 py-6 border-b border-gray-100 text-sm">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Billed To</h2>
            <p className="text-gray-800">{order.customer_name}</p>
            <p className="text-gray-600">{order.address}</p>
            <p className="text-gray-600">
              {order.city} {order.postcode}
            </p>
            <p className="text-gray-600 mt-1">Email: {order.email}</p>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">
              Order Details
            </h2>
            <p className="text-gray-600">Order ID: #{order.id}</p>
            <p className="text-gray-600">Payment: Card / Online</p>
            <p className="text-gray-600">Shipping: Free</p>
            <p className="text-gray-600">Currency: GBP (£)</p>
          </div>
        </div>

        {/* Items table */}
        <div className="py-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border border-gray-100">
              <tr className="text-left text-gray-500 uppercase text-xs tracking-wider">
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold text-right">
                  Qty
                </th>
                <th className="px-4 py-3 font-semibold text-right">
                  Price
                </th>
                <th className="px-4 py-3 font-semibold text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-x border-b border-gray-100">
              {items.map((item) => {
                const lineTotal =
                  Number(item.price || 0) *
                  Number(item.quantity || 0);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-800">
                      <p className="font-medium">
                        {item.product_name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      £{Number(item.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      £{lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-400 text-sm"
                  >
                    No items found for this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-2 text-sm">
          <div className="w-full md:w-72 space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Items Total</span>
              <span>£{itemsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (est.)</span>
              <span>£{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
              <span className="font-semibold text-gray-900">
                Grand Total
              </span>
              <span className="font-bold text-lg text-gray-900">
                £{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-[11px] text-gray-400 text-center">
          Thank you for shopping with Aidezel. This is a
          computer-generated invoice and does not require a physical
          signature.
        </p>
      </div>
    </div>
  );
};

export default OrderInvoice;
