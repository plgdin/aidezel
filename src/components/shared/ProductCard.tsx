import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

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
        
        <button 
          className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur rounded-full text-slate-600 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-200 shadow-md"
          onClick={(e) => { e.preventDefault(); }}
        >
          <Heart size={16} />
        </button>

        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs uppercase tracking-widest">
            No Image
          </div>
        )}
        
        {/* Quick Add (Blue Gradient) */}
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