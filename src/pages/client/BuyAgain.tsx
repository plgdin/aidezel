import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, ShoppingBag, AlertTriangle } from 'lucide-react';

const BuyAgain: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;

      try {
        setLoading(true);

        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        setOrder(orderData || null);

        const { data: itemsData, error } = await supabase
          .from('order_items')
          .select(
            `
            id,
            product_id,
            product_name,
            price,
            quantity,
            products (
              id,
              name,
              price,
              image_url,
              stock_quantity,
              status
            )
          `,
          )
          .eq('order_id', orderId);

        if (error) throw error;
        setItems(itemsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId]);

  const handleAddAllToCart = () => {
    items.forEach((item) => {
      const product = item.products || {};
      const finalPrice = Number(product.price ?? item.price ?? 0);
      const isOutOfStock =
        (product.stock_quantity ?? 0) <= 0 ||
        product.status === 'Out of Stock';

      if (finalPrice <= 0 || isOutOfStock) return;

      addToCart({
        id: product.id || item.product_id,
        name: product.name || item.product_name,
        price: finalPrice,
        quantity: item.quantity || 1,
        image: product.image_url,
        stock_quantity: product.stock_quantity ?? 100,
      });
    });

    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">
          Loading previous order…
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Buy Again</h1>
      {order && (
        <p className="text-gray-500 mb-6 text-sm">
          Reordering items from{' '}
          <span className="font-medium">Order #{order.id}</span> placed on{' '}
          {new Date(order.created_at).toLocaleDateString()}
        </p>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <p className="text-gray-500">No items found for this order.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 mb-8">
            {items.map((item) => {
              const product = item.products || {};
              const finalPrice = Number(product.price ?? item.price ?? 0);
              const isOutOfStock =
                (product.stock_quantity ?? 0) <= 0 ||
                product.status === 'Out of Stock';

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name || item.product_name}
                        className="w-full h-full object-cover mix-blend-multiply"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">
                        No image
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {product.name || item.product_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Qty: {item.quantity}{' '}
                      {isOutOfStock && (
                        <span className="inline-flex items-center gap-1 text-red-500 text-xs ml-2">
                          <AlertTriangle size={12} /> Currently unavailable
                        </span>
                      )}
                    </p>
                    <p className="mt-1 font-bold text-blue-600">
                      £{finalPrice.toFixed(2)}{' '}
                      <span className="text-xs text-gray-400">
                        (latest price)
                      </span>
                    </p>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (isOutOfStock) return;
                      addToCart({
                        id: product.id || item.product_id,
                        name: product.name || item.product_name,
                        price: finalPrice,
                        quantity: item.quantity || 1,
                        image: product.image_url,
                        stock_quantity: product.stock_quantity ?? 100,
                      });
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                      isOutOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    <ShoppingBag size={16} /> Add
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddAllToCart}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm"
          >
            <ShoppingBag size={18} /> Add All Items To Cart
          </button>
        </>
      )}
    </div>
  );
};

export default BuyAgain;
