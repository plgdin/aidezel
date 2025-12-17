import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Wishlist = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetchWishlist = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        setLoading(false);
        return;
    }

    // Fetch wishlist AND the related product details
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', session.user.id);

    if (error) console.error(error);
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (id: number) => {
    await supabase.from('wishlist').delete().eq('id', id);
    setItems(items.filter(item => item.id !== id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400"/></div>;

  return (
    <div className="container mx-auto px-4 pt-4 lg:py-12 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Heart className="text-red-500 fill-red-500" /> My Wishlist
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
           <h3 className="text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
           <Link to="/shop" className="text-blue-600 font-bold hover:underline">Start Shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
             const product = item.products; // Access the joined product data
             if (!product) return null;

             return (
               <div key={item.id} className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                  <Link to={`/product/${product.id}`} className="block aspect-[4/5] bg-gray-50 p-4">
                     <img src={product.image_url} alt={product.name} className="w-full h-full object-cover mix-blend-multiply transition-transform group-hover:scale-105" />
                  </Link>
                  <div className="p-4">
                     <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                     <p className="text-blue-600 font-bold mt-1">£{product.price}</p>
                     
                     <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => addToCart({...product, quantity: 1, price: `£${product.price}`, image: product.image_url})}
                          className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800"
                        >
                           <ShoppingBag size={16} /> Add
                        </button>
                        <button 
                           onClick={() => removeFromWishlist(item.id)}
                           className="w-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
               </div>
             )
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;