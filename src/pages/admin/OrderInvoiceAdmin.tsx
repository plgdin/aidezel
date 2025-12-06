import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Printer } from 'lucide-react';

const OrderInvoiceAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);

        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
        setOrder(orderData || null);

        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id);

        setItems(itemsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <div className="p-8">Loading invoice…</div>;
  if (!order)
    return (
      <div className="p-8 text-red-500">
        Order not found.
        <div className="mt-4">
          <Link
            to="/admin/orders"
            className="text-blue-600 hover:underline text-sm"
          >
            &larr; Back to Orders
          </Link>
        </div>
      </div>
    );

  const itemsTotal = items.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const grandTotal = Number(order.total_amount || 0);
  const tax = Math.max(0, grandTotal - itemsTotal);

  const handlePrint = () => window.print();

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-2 rounded-lg"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-blue-900 text-blue-900 bg-white hover:bg-blue-50"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-900 text-white hover:bg-blue-800"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      {/* Reuse same layout as client invoice */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Aidezel – Admin Copy
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Internal invoice view for order management.
            </p>
          </div>
          <div className="text-sm text-gray-600 space-y-1 md:text-right">
            <p className="font-semibold text-gray-900">
              Invoice #{order.id}
            </p>
            <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
            <p>
              Status:{' '}
              <span className="font-semibold">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Billing / Shipping */}
        <div className="grid md:grid-cols-2 gap-6 py-6 border-b border-gray-100 text-sm">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">
              Customer
            </h2>
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
            <p className="text-gray-600">
              Payment: Card / Online (manual)
            </p>
            <p className="text-gray-600">Shipping: Free</p>
            <p className="text-gray-600">Currency: GBP (£)</p>
          </div>
        </div>

        {/* Items */}
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
          Internal admin invoice for Aidezel. Use this for packing,
          shipping and accounting workflows.
        </p>
      </div>
    </div>
  );
};

export default OrderInvoiceAdmin;
