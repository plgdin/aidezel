import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, ShieldCheck, RotateCcw, MapPin, User, Minus, Plus, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  
  // Independent states for accordions
  const [showDesc, setShowDesc] = useState(true);
  const [showReviews, setShowReviews] = useState(false);

  // Interactive Image Gallery State
  const [activeImage, setActiveImage] = useState(0);
  // Placeholder gallery logic (since DB usually only has 1 image)
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Mock reviews
  const reviews = [
    { user: "Alex Johnson", rating: 5, date: "2 days ago", text: "Absolutely love the finish on this. Matches my kitchen perfectly." },
    { user: "Sarah Smith", rating: 4, date: "1 week ago", text: "Great quality for the price. Installation was a bit tricky but worth it." }
  ];

  useEffect(() => {
    const fetchData = async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('id', id).single();
      
      if (prod) {
        setProduct(prod);
        // Mocking a gallery by using the main image multiple times for demo
        setGalleryImages([
            prod.image_url, 
            prod.image_url, 
            prod.image_url, 
            prod.image_url
        ]);

        const { data: related } = await supabase.from('products').select('*')
          .eq('category', prod.category)
          .neq('id', prod.id)
          .limit(4);
        setRelatedProducts(related || []);
      }
      setLoading(false);
    };
    fetchData();
    window.scrollTo(0,0);
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-pulse text-xl font-medium text-gray-400">Loading...</div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 pb-24">
      
      <div className="container mx-auto px-4 pt-6 lg:pt-12">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-8">
           <Link to="/" className="hover:text-black transition-colors">Home</Link> / 
           <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-black transition-colors">{product.category}</Link> / 
           <span className="text-black font-medium truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* LEFT: GALLERY */}
          <div className="relative">
            <div className="sticky top-24 space-y-6">
               
               {/* Main Image */}
               <div className="aspect-[4/5] bg-gray-50 rounded-3xl flex items-center justify-center p-8 border border-gray-100 relative overflow-hidden group">
                 
                 {/* FIX: Changed rounded-md to rounded-full for pill shape */}
                 {isOutOfStock && (
                   <div className="absolute top-6 left-6 z-20 bg-[#ef4444] text-white text-xs font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                     Sold Out
                   </div>
                 )}
                 {!isOutOfStock && (
                    <div className="absolute top-6 left-6 z-20 bg-black text-white text-xs font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                     In Stock
                   </div>
                 )}

                 <img 
                    src={galleryImages[activeImage] || product.image_url} 
                    alt={product.name} 
                    className={`w-full h-full object-cover mix-blend-multiply transition-all duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}`} 
                 />
               </div>

               {/* Thumbnail Grid */}
               <div className="grid grid-cols-4 gap-4">
                 {galleryImages.map((img, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setActiveImage(idx)}
                     className={`aspect-square rounded-xl border-2 flex items-center justify-center p-2 bg-gray-50 transition-all overflow-hidden ${
                       activeImage === idx ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-transparent hover:border-gray-300'
                     }`}
                   >
                     <img src={img} className="w-full h-full object-cover mix-blend-multiply" />
                   </button>
                 ))}
               </div>
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="flex flex-col">
            
            <div className="mb-6">
              <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex text-yellow-400">
                  {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <span className="text-sm text-gray-500 underline underline-offset-4">4 Verified Reviews</span>
              </div>
            </div>

            <div className="mb-8">
               <div className="flex items-end gap-4 mb-2">
                 <span className="text-4xl font-extrabold text-black">£{product.price}</span>
                 <span className="text-xl text-gray-400 line-through mb-1">£{(product.price * 1.2).toFixed(2)}</span>
               </div>
               <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                 <ShieldCheck size={14} /> Best Price Guaranteed
               </p>
            </div>

            {/* Tech Specs Grid */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {['Fast Ship', 'Original', 'Warranty', 'Support'].map((spec, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{spec}</p>
                  <div className="flex justify-center mt-1 text-blue-600"><ShieldCheck size={16}/></div>
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-100 w-full mb-8"></div>

            {/* ACTIONS */}
            <div className="space-y-6 mb-10">
               <div className="flex items-center gap-6">
                 <div className="flex items-center border border-gray-300 rounded-full px-4 py-3 gap-6">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={isOutOfStock} className="text-gray-500 hover:text-black disabled:opacity-50"><Minus size={16}/></button>
                    <span className="font-bold w-4 text-center">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))} disabled={isOutOfStock} className="text-gray-500 hover:text-black disabled:opacity-50"><Plus size={16}/></button>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                   disabled={isOutOfStock}
                   onClick={() => addToCart({...product, quantity: qty})}
                   className="py-4 rounded-full border-2 border-gray-200 font-bold text-lg hover:border-black hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Add to Cart
                 </button>
                 
                 <button 
                   disabled={isOutOfStock}
                   className="py-4 rounded-full font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-transform hover:-translate-y-1 active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                   style={{ 
                     background: isOutOfStock ? '#ccc' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                     boxShadow: isOutOfStock ? 'none' : '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
                   }}
                 >
                   <ShoppingBag size={20} /> {isOutOfStock ? 'Sold Out' : 'Buy Now'}
                 </button>
               </div>
            </div>

            {/* ACCORDION LOGIC - INDEPENDENT STATES */}
            <div className="border-t border-gray-200">
              
              {/* Description Toggle */}
              <div className="border-b border-gray-200 py-6">
                <button onClick={() => setShowDesc(!showDesc)} className="flex justify-between items-center w-full text-left group">
                  <span className="font-bold text-lg group-hover:text-blue-600 transition-colors">Description</span>
                  {showDesc ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </button>
                
                {showDesc && (
                  <div className="mt-4 text-gray-600 leading-relaxed whitespace-pre-line animate-in slide-in-from-top-2 duration-200">
                    {product.description || "Experience premium quality with this item. Designed for performance and style, it fits perfectly into modern lifestyles. \n\n Constructed with high-grade materials and backed by our official warranty."}
                  </div>
                )}
              </div>

              {/* Reviews Toggle */}
              <div className="border-b border-gray-200 py-6">
                <button onClick={() => setShowReviews(!showReviews)} className="flex justify-between items-center w-full text-left group">
                  <span className="font-bold text-lg group-hover:text-blue-600 transition-colors">Reviews ({reviews.length})</span>
                  {showReviews ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </button>
                
                {showReviews && (
                  <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {reviews.map((review, idx) => (
                      <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><User size={14}/></div>
                            <span className="text-sm font-bold">{review.user}</span>
                          </div>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                        <div className="flex text-yellow-400 mb-2">
                          {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                        </div>
                        <p className="text-sm text-gray-600">{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;