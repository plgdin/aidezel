import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

export interface Product {
  id: number;
  name: string;
  price: string;
  rawPrice?: number;
  image: string;
  tag?: string;
  category?: string;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent clicking the link
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Please login to save items!");
        return;
    }

    if (isWishlisted) {
        // Optimistic UI update (optional, simple toggle for now)
        setIsWishlisted(false);
        // Note: To delete accurately we'd need the wishlist ID, 
        // but for this simple card we usually just handle "adding".
    } else {
        setIsWishlisted(true);
        const { error } = await supabase.from('wishlist').insert({
            user_id: session.user.id,
            product_id: product.id
        });
        if (error) {
            console.error(error);
            setIsWishlisted(false); // Revert if error
        }
    }
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1 hover:border-[#3b82f6]">
      
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-slate-50">
        
        {product.tag && (
          <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm shadow-sm ${
            product.tag === 'Sold Out' ? 'bg-red-500 text-white' : 'bg-[#0f172a] text-white'
          }`}>
            {product.tag}
          </span>
        )}
        
        {/* FUNCTIONAL HEART BUTTON */}
        <button 
          className={`absolute top-3 right-3 z-10 p-2 backdrop-blur rounded-full transition-all duration-200 shadow-md translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 ${
              isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-600 hover:text-red-500 hover:bg-white'
          }`}
          onClick={toggleWishlist}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs uppercase tracking-widest">
            No Image
          </div>
        )}
        
        {/* Quick Add */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hidden lg:block bg-gradient-to-t from-white/90 to-transparent">
           <button 
             onClick={(e) => { 
               e.preventDefault(); 
               addToCart({ ...product, quantity: 1, price: product.price, id: product.id.toString() }); 
             }}
             className="w-full bg-[#0f172a] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
           >
             <ShoppingBag size={16} /> Quick Add
           </button>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5em] group-hover:text-[#2563eb] transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{product.category || 'Electronics'}</span>
             <span className="font-bold text-lg text-[#0f172a]">{product.price}</span>
          </div>
          
          <button 
            onClick={() => addToCart({ ...product, quantity: 1, price: product.price, id: product.id.toString() })}
            className="lg:hidden w-9 h-9 bg-[#0f172a] text-white rounded-full flex items-center justify-center active:scale-95 shadow-md"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;