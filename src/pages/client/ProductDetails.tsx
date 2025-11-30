import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, User, MapPin, Share2, Heart, Truck, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { Session } from '@supabase/supabase-js';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedColor, setSelectedColor] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const fetchData = async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('id', id).single();
      
      if (prod) {
        setProduct(prod);
        // Mocking gallery for demo purposes
        setGalleryImages([prod.image_url, prod.image_url, prod.image_url, prod.image_url]);

        const { data: reviewsData } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', id)
            .order('created_at', { ascending: false });
        
        if (reviewsData) setRealReviews(reviewsData);
      }
      setLoading(false);
    };

    fetchData();
    window.scrollTo(0,0);
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newReview.trim()) return alert("Please log in.");

    const { error } = await supabase.from('reviews').insert([{
        product_id: id,
        user_name: session.user.user_metadata.full_name || 'Verified User',
        rating: rating,
        comment: newReview
    }]);

    if (!error) {
        setNewReview('');
        alert("Review submitted!");
        const { data } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false });
        if (data) setRealReviews(data);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-pulse text-xl font-medium text-gray-400">Loading...</div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const isOutOfStock = product.stock_quantity <= 0;
  const mrp = (product.price * 1.25).toFixed(2);
  const discount = Math.round(((parseFloat(mrp) - product.price) / parseFloat(mrp)) * 100);
  const maxSelectable = Math.min(product.stock_quantity, 10);
  const qtyOptions = Array.from({ length: maxSelectable > 0 ? maxSelectable : 1 }, (_, i) => i + 1);

  // DATA HANDLING
  const features = product.features && product.features.length > 0 
    ? product.features 
    : [
        "Premium Build Quality: Designed for durability.",
        "High Performance: Engineered for top-tier results.",
        "Standard Warranty Included."
      ];

  const specs = product.specs && Object.keys(product.specs).length > 0
    ? Object.entries(product.specs)
    : [
        ['Brand', product.brand || 'Aidezel'],
        ['Model Name', product.name],
        ['Category', product.category],
        ['Origin', 'United Kingdom'],
      ];

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 pb-24">
      
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
            <Link to="/" className="hover:text-blue-600">Home</Link> &rsaquo;
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-blue-600">{product.category}</Link> &rsaquo;
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* GALLERY */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
                <div className="relative w-full aspect-square bg-white border border-gray-200 rounded-2xl flex items-center justify-center p-6 mb-4 group overflow-hidden">
                    <button className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-md text-gray-400 hover:text-red-500 transition-colors"><Heart size={20} /></button>
                    <img src={galleryImages[activeImage]} alt={product.name} className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}/>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {galleryImages.map((img, idx) => (
                        <button key={idx} onMouseEnter={() => setActiveImage(idx)} className={`w-16 h-16 flex-shrink-0 rounded-lg border-2 p-1 ${activeImage === idx ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                            <img src={img} alt="thumb" className="w-full h-full object-contain mix-blend-multiply"/>
                        </button>
                    ))}
                </div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/shop" className="text-sm font-bold text-blue-600 hover:underline uppercase tracking-wide">Visit the {product.brand || 'Aidezel'} Store</Link>
            <h1 className="text-2xl font-medium text-gray-900 leading-snug">{product.name}</h1>
            
            <div className="flex items-center gap-2 text-sm border-b border-gray-100 pb-4">
                <div className="flex text-yellow-400">{[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}</div>
                <span className="text-blue-600 hover:underline cursor-pointer">{realReviews.length} ratings</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">1K+ bought in past month</span>
            </div>

            <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl text-red-700 font-light">-{discount}%</span>
                    <span className="text-3xl font-bold text-gray-900"><sup className="text-sm">£</sup>{product.price}</span>
                </div>
                <div className="text-gray-500 text-sm">M.R.P.: <span className="line-through">£{mrp}</span></div>
                <div className="text-sm text-gray-900">Inclusive of all taxes</div>
            </div>

            <div className="pt-2">
                <span className="text-sm font-bold text-gray-700">Color: </span>
                <span className="text-sm text-gray-600">{['Black', 'White', 'Blue'][selectedColor]}</span>
                <div className="flex gap-2 mt-2">
                    {['bg-gray-900', 'bg-gray-100', 'bg-blue-800'].map((color, idx) => (
                        <button key={idx} onClick={() => setSelectedColor(idx)} className={`w-9 h-9 rounded-full ${color} border-2 ${selectedColor === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-300'}`}/>
                    ))}
                </div>
            </div>

            {/* DYNAMIC BULLET POINTS */}
            <div className="pt-4">
                <h3 className="font-bold text-sm text-gray-900 mb-2">About this item</h3>
                <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700 marker:text-gray-400">
                    {features.map((feature: string, idx: number) => (
                        <li key={idx}>{feature}</li>
                    ))}
                </ul>
            </div>
          </div>

          {/* BUY BOX */}
          <div className="lg:col-span-3">
            <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white sticky top-24">
                <div className="mb-4"><span className="text-2xl font-bold text-gray-900">£{product.price}</span></div>
                
                <div className="text-sm space-y-3 mb-6">
                    <div className="text-gray-600">Delivery <span className="font-bold text-gray-900">Thursday, 5 Dec</span></div>
                    <div className="flex items-start gap-2 text-blue-600 text-xs cursor-pointer hover:underline">
                        <MapPin size={14} className="shrink-0 mt-0.5" /> Deliver to User - London W1...
                    </div>
                    <div className={`text-lg font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-700'} mt-2`}>
                        {isOutOfStock ? 'Currently unavailable.' : 'In Stock.'}
                    </div>
                    <div className="text-xs text-gray-500">
                        <p>Sold by <span className="text-blue-600">Aidezel Official</span></p>
                        <p>Fulfilled by <span className="text-blue-600">Aidezel</span></p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none z-10">Quantity:</span>
                        <select value={qty} onChange={(e) => setQty(Number(e.target.value))} disabled={isOutOfStock} className="w-full border border-gray-300 rounded-lg py-2.5 pl-20 pr-10 text-sm font-bold shadow-sm focus:border-blue-500 outline-none bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors text-gray-900">
                            {qtyOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><ChevronDown size={16} /></div>
                    </div>

                    <button onClick={() => addToCart({...product, quantity: qty})} disabled={isOutOfStock} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-full text-sm shadow-sm transition-colors disabled:opacity-50">Add to Cart</button>
                    <button disabled={isOutOfStock} className="w-full bg-black hover:bg-gray-900 text-white font-medium py-2.5 rounded-full text-sm shadow-sm transition-colors disabled:opacity-50">Buy Now</button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 text-center">
                    <div className="flex flex-col items-center gap-1"><ShieldCheck size={18} className="text-blue-600"/><span>Secure</span></div>
                    <div className="flex flex-col items-center gap-1"><Truck size={18} className="text-blue-600"/><span>Dispatched</span></div>
                    <div className="flex flex-col items-center gap-1"><RefreshCw size={18} className="text-blue-600"/><span>Returns</span></div>
                </div>
            </div>
          </div>

        </div>
        
        {/* LOWER SECTION: PRODUCT INFORMATION TABLE */}
        <div className="mt-16 border-t border-gray-200 pt-10">
             <h2 className="text-xl font-bold text-gray-900 mb-6">Product Information</h2>
             
             {/* DYNAMIC SPECS TABLE */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-10">
                 {specs.map(([key, val]: any, idx: number) => (
                    <div key={idx} className="flex border-b border-gray-100 py-2">
                        <span className="w-1/2 text-gray-500 text-sm font-medium bg-gray-50 px-2 py-1 rounded">{key}</span>
                        <span className="w-1/2 text-gray-900 text-sm px-2 py-1">{val}</span>
                    </div>
                 ))}
             </div>

             <h3 className="text-lg font-bold text-gray-900 mb-2">Product Description</h3>
             <p className="text-gray-700 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
                {product.description || 'No description available.'}
             </p>
             
             <hr className="my-8" />

             {/* REVIEWS SECTION */}
             <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-1 text-yellow-400">
                        <Star size={24} fill="currentColor"/>
                        <Star size={24} fill="currentColor"/>
                        <Star size={24} fill="currentColor"/>
                        <Star size={24} fill="currentColor"/>
                        <Star size={24} fill="currentColor" className="text-gray-200"/>
                    </div>
                    <span className="text-lg font-medium">4.2 out of 5</span>
                </div>

                {session ? (
                    <form onSubmit={submitReview} className="bg-gray-50 p-4 rounded-xl mb-8 border border-gray-200">
                        <h4 className="font-bold text-sm mb-2">Write a review</h4>
                        <div className="flex gap-1 mb-2 text-yellow-500">
                            {[1,2,3,4,5].map(star => (
                                <button type="button" key={star} onClick={() => setRating(star)}>
                                    <Star size={20} fill={star <= rating ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                        <textarea className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm" placeholder="What did you like or dislike?" value={newReview} onChange={e => setNewReview(e.target.value)} rows={3} />
                        <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Submit</button>
                    </form>
                ) : (
                    <div className="mb-8 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg">Please <Link to="/login" className="font-bold underline">login</Link> to write a review.</div>
                )}

                <div className="space-y-6 max-w-3xl">
                    {realReviews.length === 0 && <p className="text-gray-500 text-sm">No reviews yet.</p>}
                    {realReviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"><User size={12}/></div><span className="text-sm font-medium">{review.user_name}</span></div>
                            <div className="flex text-yellow-400 mb-2">{[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor"/>)}</div>
                            <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;