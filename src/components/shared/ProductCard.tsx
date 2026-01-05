import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Heart, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

export interface Product {
  id: number | string;
  name: string;
  price: string | number;
  rawPrice?: number;
  image: string;
  tag?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  stock_quantity?: number;
  description?: string;
  features?: string[];
  specs?: any;
}

interface ProductCardProps {
  product: Product;
  onQuickAdd?: () => void;
}

const ProductCard = ({ product, onQuickAdd }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // State for the "Pill" notification
  const [notification, setNotification] = useState({ show: false, visible: false, message: '' });

  const showNotification = (msg: string) => {
    setNotification({ show: true, visible: false, message: msg });
    
    // Smooth entry
    setTimeout(() => setNotification(prev => ({ ...prev, visible: true })), 10);

    // Auto dismiss
    setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
        setTimeout(() => setNotification({ show: false, visible: false, message: '' }), 500);
    }, 3000);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Please login to save items!");
        return;
    }

    if (isWishlisted) {
        setIsWishlisted(false);
    } else {
        setIsWishlisted(true);
        // We can reuse the pill style for wishlist too, or keep it simple. 
        // For now, let's use the nice pill style!
        showNotification("Saved to Wishlist");

        const { error } = await supabase.from('wishlist').insert({
            user_id: session.user.id,
            product_id: product.id
        });
        if (error) setIsWishlisted(false); 
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({ ...product, quantity: 1, id: product.id });

    // Show the "Added to Bag" message
    showNotification("Added to Bag");

    if (onQuickAdd) onQuickAdd();
  };

  return (
    <>
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1 hover:border-[#3b82f6]">
      
      {/* --- EXISTING CARD CONTENT --- */}
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-slate-50">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs uppercase tracking-widest">No Image</div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hidden lg:block bg-gradient-to-t from-white/90 to-transparent">
           <button 
             onClick={handleAddToCart}
             className="w-full bg-[#0f172a] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
           >
             <ShoppingBag size={16} /> Quick Add
           </button>
        </div>
      </Link>

      {product.tag && (
        <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm shadow-sm pointer-events-none ${
          product.tag === 'Sold Out' ? 'bg-red-500 text-white' : 'bg-[#0f172a] text-white'
        }`}>
          {product.tag}
        </span>
      )}
      
      <button 
        className={`absolute top-3 right-3 z-20 p-2 rounded-full transition-all duration-200 shadow-md translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 ${
            isWishlisted ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-white text-slate-600 hover:text-red-500 hover:bg-gray-50'
        }`}
        onClick={toggleWishlist}
      >
        <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
      </button>

      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5em] group-hover:text-[#2563eb] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{product.category || 'Electronics'}</span>
              <span className="font-bold text-lg text-[#0f172a]">
                {typeof product.price === 'number' ? `£${product.price}` : product.price}
              </span>
          </div>
          <button 
            onClick={handleAddToCart}
            className="lg:hidden w-9 h-9 bg-[#0f172a] text-white rounded-full flex items-center justify-center active:scale-95 shadow-md"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>

    {/* --- NEW "PILL" NOTIFICATION (Royal Blue Style) --- */}
    {notification.show && (
        <div 
          className={`
            fixed left-1/2 -translate-x-1/2 z-[100] 
            transition-all duration-500 ease-cubic-bezier(0.4, 0, 0.2, 1)
            ${notification.visible 
                ? 'top-8 opacity-100 translate-y-0' 
                : '-top-20 opacity-0 -translate-y-full'
            }
          `}
        >
            <div className="bg-[#0f172a] text-white pl-2 pr-2 py-2 rounded-full flex items-center gap-4 shadow-2xl border border-white/10 min-w-[280px]">
                
                {/* Product Thumbnail with Royal Blue Border */}
                <div className="relative">
                   <img 
                    src={product.image} 
                    alt="product" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#4169E1]" 
                   />
                </div>

                {/* Text Content */}
                <div className="flex flex-col flex-1 mr-2">
                   <span className="font-bold text-sm leading-none mb-0.5">{notification.message}</span>
                   <span className="text-[10px] text-slate-400 max-w-[120px] truncate leading-none">
                     {product.name}
                   </span>
                </div>

                {/* Right Icon Button (Royal Blue Background) */}
                <div className="bg-[#4169E1] w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-pulse-once">
                   {/* We use ShoppingBag or Check based on context, but ShoppingBag matches your image */}
                   <ShoppingBag size={16} className="text-white fill-white/20" />
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default ProductCard;