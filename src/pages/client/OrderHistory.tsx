import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, FileText, RotateCw, ImageOff, MessageCircleQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderWithPreview {
  id: number;
  created_at: string;
  total_amount: number;
  status: string;
  // preview data we compute
  preview_product_name?: string | null;
  preview_image_url?: string | null;
  preview_quantity?: number | null; 
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get current user (by email)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // 2️⃣ Fetch all orders for this email
        const { data: baseOrders, error } = await supabase
          .from('orders')
          .select('*')
          .eq('email', session.user.email)
          .order('created_at', { ascending: false });

        if (error || !baseOrders) {
          console.error(error);
          setOrders([]);
          setLoading(false);
          return;
        }

        // 3️⃣ For each order, fetch FIRST order item and its product image
        const ordersWithPreview: OrderWithPreview[] = await Promise.all(
          baseOrders.map(async (order: any) => {
            let previewName: string | null = null;
            let previewImage: string | null = null;
            let previewQty: number | null = null; 

            // 3A: get first order_item
            const { data: firstItem } = await supabase
              .from('order_items')
              .select('product_id, product_name, quantity')
              .eq('order_id', order.id)
              .order('id', { ascending: true })
              .limit(1)
              .maybeSingle();

            if (firstItem) {
              previewName = firstItem.product_name;
              previewQty = firstItem.quantity;

              // 3B: get product image
              const { data: product } = await supabase
                .from('products')
                .select('image_url')
                .eq('id', firstItem.product_id)
                .maybeSingle();

              if (product) {
                previewImage = product.image_url;
              }
            }

            return {
              id: order.id,
              created_at: order.created_at,
              total_amount: order.total_amount,
              status: order.status,
              preview_product_name: previewName,
              preview_image_url: previewImage,
              preview_quantity: previewQty, 
            };
          })
        );

        setOrders(ordersWithPreview);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-medium">
          Loading orders…
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 pt-4 lg:pt-4 lg:py-12 min-h-screen">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No orders yet
          </h3>
          <p className="text-gray-500">
            Looks like you haven't placed any orders yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-4 lg:pt-4 lg:py-12 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="grid gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            {/* LEFT: thumbnail + product name + meta */}
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {order.preview_image_url ? (
                  <img
                    src={order.preview_image_url}
                    alt={order.preview_product_name || 'Product image'}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                ) : (
                  <ImageOff size={20} className="text-gray-400" />
                )}
              </div>

              <div className="space-y-1">
                {/* Product name & Quantity */}
                <p className="font-semibold text-gray-900 line-clamp-2">
                  {order.preview_product_name || `Order #${order.id}`}
                  
                  {/* --- QUANTITY BADGE --- */}
                  {order.preview_quantity && order.preview_quantity > 1 && (
                    <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        x{order.preview_quantity}
                    </span>
                  )}
                </p>

                <p className="text-xs text-gray-500">
                  Order #{order.id} • Placed on{' '}
                  {new Date(order.created_at).toLocaleDateString()}
                </p>

                {/* status pill */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 ${
                    order.status === 'Delivered'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'Shipped'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {/* RIGHT: total + actions */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Total Amount
                </p>
                <p className="font-bold text-2xl text-gray-900">
                  £{Number(order.total_amount).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <FileText size={14} /> View Invoice
                </Link>
                <Link
                  to={`/buy-again/${order.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-black text-white hover:bg-gray-800"
                >
                  <RotateCw size={14} /> Buy Again
                </Link>
                
                {/* --- NEW: GET HELP BUTTON --- */}
                <Link
                  to={`/contact?orderId=${order.id}&subject=Help with Order #${order.id} - ${order.preview_product_name}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                >
                  <MessageCircleQuestion size={14} /> Get Help
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;