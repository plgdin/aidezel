import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, User, MapPin, Heart, Truck, RefreshCw, ChevronDown, CheckCircle, ShoppingBag, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { Session } from '@supabase/supabase-js';
// SEO: Import Helmet
import { Helmet } from 'react-helmet-async';
import { toast as shadcnToast } from '../../components/ui/use-toast'; // Import Toast Function

// FIX: Cast Helmet to 'any' to resolve the TypeScript error
const SeoHelmet = Helmet as any;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();                      
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
  
  // --- SELECTED OPTIONS STATE ---
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  
  // STATE: Wishlist
  const [isWishlisted, setIsWishlisted] = useState(false);

  // --- HELPER: FIXED NOTIFY FUNCTION (SONNER COMPATIBLE) ---
  const notify = (title: string, description: string, type: 'success' | 'error' | 'wishlist' = 'success') => {
    shadcnToast(title, {
      description: description,
      action: type === 'error' ? { label: 'Close', onClick: () => {} } : undefined,
      className: type === 'error' ? "bg-red-600 text-white border-red-600" : "bg-slate-900 text-white border-slate-800",
    });
  };

  useEffect(() => {
    // Listen for auth changes to keep session sync
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const fetchData = async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('id', id).single();
      const { data: { user } } = await supabase.auth.getUser();

      if (prod) {
        setProduct(prod);
        
        // Gallery Logic
        if (prod.gallery && Array.isArray(prod.gallery) && prod.gallery.length > 0) {
            setGalleryImages([prod.image_url, ...prod.gallery]); 
        } else {
            setGalleryImages([prod.image_url, prod.image_url, prod.image_url, prod.image_url]); 
        }

        // --- INIT OPTIONS DEFAULTS ---
        if (prod.options && Array.isArray(prod.options)) {
            const defaults: Record<string, string> = {};
            prod.options.forEach((opt: any) => {
                if (opt.values && opt.values.length > 0) {
                    defaults[opt.name] = opt.values[0]; // Select first value by default
                }
            });
            setSelectedOptions(defaults);
        }

        if (user) {
            // FIX: Use maybeSingle() to prevent 406 errors if item isn't in wishlist yet
            const { data: wishlistData } = await supabase
                .from('wishlist')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', id)
                .maybeSingle();
            if (wishlistData) setIsWishlisted(true);
        }

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

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [id]);

  // FUNCTION: Toggle Wishlist
  const toggleWishlist = async () => {
    if (!session) return notify("Login Required", "Please log in to add items to your wishlist.", "error");

    const previousState = isWishlisted;
    setIsWishlisted(!previousState);

    if (previousState) {
        notify("Removed from Wishlist", "Item removed from your list.", 'wishlist');
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', session.user.id)
            .eq('product_id', id);
        if (error) setIsWishlisted(true);
    } else {
        notify("Added to Wishlist", "Item added to your wishlist.", 'wishlist');
        const { error } = await supabase
            .from('wishlist')
            .insert([{ user_id: session.user.id, product_id: id }]);
        if (error) setIsWishlisted(false);
    }
  };

  // --- REVISED SUBMIT REVIEW (Smart Name Detection) ---
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Get a FRESH session directly from Supabase (Guarantees accuracy)
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    // 2. Check if logged in FIRST
    if (!currentSession) {
        return notify("Authentication Error", "Please log in to submit a review.", "error");
    }

    // 3. Check if review is empty SECOND
    if (!newReview.trim()) {
        return notify("Empty Review", "Please write something before submitting.", "error");
    }

    // 4. DETERMINE USER NAME (Smart Fallback)
    let reviewerName = 'Verified User';
    const meta = currentSession.user.user_metadata;

    if (meta?.full_name) {
        reviewerName = meta.full_name; // Use metadata name if available
    } else if (meta?.name) {
        reviewerName = meta.name;      // Use 'name' if 'full_name' is missing
    } else if (currentSession.user.email) {
        // Fallback: Use email username (e.g., "azeez" from "azeez@gmail.com")
        reviewerName = currentSession.user.email.split('@')[0];
    }

    // 5. Submit to Database
    const { error } = await supabase.from('reviews').insert([{
        product_id: id,
        user_name: reviewerName, // <--- Using the detected name
        user_id: currentSession.user.id, 
        rating: rating,
        comment: newReview
    }]);

    if (!error) {
        setNewReview('');
        notify("Review Submitted", "Thank you for your feedback!", 'success');
        
        // Refresh reviews list
        const { data } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', id)
            .order('created_at', { ascending: false });
            
        if (data) setRealReviews(data);
    } else {
        console.error(error);
        notify("Error", "Could not submit review. Please try again.", "error");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-xl font-medium text-gray-400">Loading...</div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  const isOutOfStock = product.stock_quantity <= 0;
  const mrp = (product.price * 1.25).toFixed(2);
  const discount = Math.round(((parseFloat(mrp) - product.price) / parseFloat(mrp)) * 100);
  const maxSelectable = Math.min(product.stock_quantity, 10);
  const qtyOptions = Array.from({ length: maxSelectable > 0 ? maxSelectable : 1 }, (_, i) => i + 1);

  // DATA HANDLING
  const features = product.features && product.features.length > 0 
    ? product.features 
    : ["Premium Build Quality.", "High Performance.", "Standard Warranty Included."];

  const specs = product.specs && Object.keys(product.specs).length > 0
    ? Object.entries(product.specs)
    : [
        ['Brand', product.brand || 'Aidezel'], 
        ['Model Name', product.name], 
        ['Category', product.category],
        ['Origin', 'United Kingdom']
      ];

  // Calculate Average Rating
  const averageRating = realReviews.length > 0 
    ? (realReviews.reduce((acc, r) => acc + r.rating, 0) / realReviews.length).toFixed(1)
    : 0;

  // --- HANDLE ADD TO CART WITH OPTIONS ---
  const handleAddToCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          navigate('/login');
          return false;
      }

      const optionString = Object.entries(selectedOptions).map(([key, val]) => `${key}: ${val}`).join(', ');
      
      addToCart({ 
          ...product, 
          quantity: qty,
          selectedVariant: optionString 
      });

      // TRIGGER PILL TOAST HERE
      notify("Added to Bag", `${product.name} (${qty}x)`, 'success');
      return true;
  };
  
  // SEO Helper
  const metaDescription = product.description 
      ? product.description.substring(0, 160).replace(/(\r\n|\n|\r)/gm, " ") + "..." 
      : `Buy ${product.name} at Aidezel UK. Best price, fast delivery, and official warranty.`;

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 pb-24 relative">
      
      {/* --- SEO METADATA START --- */}
      <SeoHelmet>
        <title>{`${product.name} | Buy Online at Aidezel UK`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://aidezel.com/product/${product.id}`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.image_url} />
        <meta property="og:url" content={`https://aidezel.com/product/${product.id}`} />
        <meta property="product:price:amount" content={product.price} />
        <meta property="product:price:currency" content="GBP" />
        <meta property="product:brand" content={product.brand || 'Aidezel'} />
        <meta property="product:availability" content={isOutOfStock ? 'out of stock' : 'in stock'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.name} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={product.image_url} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": galleryImages,
            "description": product.description,
            "brand": { "@type": "Brand", "name": product.brand || "Aidezel" },
            "sku": product.id,
            "offers": {
              "@type": "Offer",
              "url": `https://aidezel.co.uk/product/${product.id}`,
              "priceCurrency": "GBP",
              "price": product.price,
              "priceValidUntil": "2025-12-31",
              "itemCondition": "https://schema.org/NewCondition",
              "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              "seller": { "@type": "Organization", "name": "Aidezel Ltd" }
            },
            "aggregateRating": realReviews.length > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": averageRating,
              "reviewCount": realReviews.length
            } : undefined
          })}
        </script>
      </SeoHelmet>
      {/* --- SEO METADATA END --- */}

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
                    {/* Wishlist Button */}
                    <button 
                        onClick={toggleWishlist}
                        aria-label="Add to wishlist"
                        className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-md transition-all duration-200 ${isWishlisted ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'}`}
                    >
                        <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>

                    <img 
                      src={galleryImages[activeImage]} 
                      alt={`${product.name} - View ${activeImage + 1}`} 
                      className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
                      loading="eager" 
                      // @ts-ignore
                      fetchpriority="high"
                    />
                </div>
                {/* Only show thumbnails if there are multiple images */}
                {galleryImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {galleryImages.map((img, idx) => (
                            <button key={idx} onMouseEnter={() => setActiveImage(idx)} className={`w-16 h-16 flex-shrink-0 rounded-lg border-2 p-1 ${activeImage === idx ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                                <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply"/>
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>

          {/* DETAILS */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/shop" className="text-sm font-bold text-blue-600 hover:underline uppercase tracking-wide">Visit the {product.brand || 'Aidezel'} Store</Link>
            <h1 className="text-2xl font-medium text-gray-900 leading-snug">{product.name}</h1>
            
            <div className="flex items-center gap-2 text-sm border-b border-gray-100 pb-4">
                <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map(i => (
                        <Star key={i} size={16} fill={i <= Number(averageRating) ? "currentColor" : "none"} className={i <= Number(averageRating) ? "text-yellow-400" : "text-gray-300"} />
                    ))}
                </div>
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

            {/* --- NEW: DYNAMIC OPTIONS SELECTOR (RENDERED HERE) --- */}
            {product.options && Array.isArray(product.options) && product.options.map((option: any, idx: number) => (
                <div key={idx} className="pt-2">
                    <span className="text-sm font-bold text-gray-700">{option.name}: </span>
                    <span className="text-sm text-gray-600 font-medium">{selectedOptions[option.name]}</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {option.values.map((val: string, valIdx: number) => (
                            <button 
                                key={valIdx} 
                                onClick={() => setSelectedOptions(prev => ({...prev, [option.name]: val}))} 
                                className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                                    selectedOptions[option.name] === val 
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                                    : 'border-gray-200 bg-white hover:border-gray-400 text-gray-700'
                                }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

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
                </div>

                {/* --- ADD TO CART / BUY NOW --- */}
                <div className="space-y-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none z-10">Quantity:</span>
                        <select
                          value={qty}
                          onChange={(e) => setQty(Number(e.target.value))}
                          disabled={isOutOfStock}
                          className="w-full border border-gray-300 rounded-lg py-2.5 pl-20 pr-10 text-sm font-bold shadow-sm focus:border-blue-500 outline-none bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors text-gray-900"
                        >
                            {qtyOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><ChevronDown size={16} /></div>
                    </div>

                    <button 
                        onClick={handleAddToCart}
                        disabled={isOutOfStock} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-full text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={16} /> Add to Cart
                    </button>
                    
                    <button
                      disabled={isOutOfStock}
                      onClick={async () => {
                        if (isOutOfStock) return;
                        const success = await handleAddToCart();
                        if (success) {
                            navigate('/checkout');                        
                        }
                      }}
                      className="w-full bg-black hover:bg-gray-900 text-white font-medium py-2.5 rounded-full text-sm shadow-sm transition-colors disabled:opacity-50"
                    >
                      Buy Now
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 text-center">
                    <div className="flex flex-col items-center gap-1"><ShieldCheck size={18} className="text-blue-600"/><span>Secure</span></div>
                    <div className="flex flex-col items-center gap-1"><Truck size={18} className="text-blue-600"/><span>Dispatched</span></div>
                    <div className="flex flex-col items-center gap-1"><RefreshCw size={18} className="text-blue-600"/><span>Returns</span></div>
                </div>
            </div>
          </div>
        </div>
        
        {/* LOWER SECTION */}
        <div className="mt-16 border-t border-gray-200 pt-10">
             <h2 className="text-xl font-bold text-gray-900 mb-6">Product Information</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-10">
                 {specs.map(([key, val]: any, idx: number) => (
                    <div key={idx} className="flex border-b border-gray-100 py-2">
                        <span className="w-1/2 text-gray-500 text-sm font-medium bg-gray-50 px-2 py-1 rounded">{key}</span>
                        <span className="w-1/2 text-gray-900 text-sm px-2 py-1">{val}</span>
                    </div>
                 ))}
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">Product Description</h3>
             <p className="text-gray-700 text-sm leading-relaxed mb-8 whitespace-pre-wrap">{product.description || 'No description available.'}</p>
             <hr className="my-8" />
             <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-1 text-yellow-400">
                        {/* Dynamic Stars in Reviews Header */}
                        {[1,2,3,4,5].map(i => (
                            <Star key={i} size={24} fill={i <= Number(averageRating) ? "currentColor" : "none"} className={i <= Number(averageRating) ? "text-yellow-400" : "text-gray-200"}/>
                        ))}
                    </div>
                    {/* FIXED: Check if number > 0 */}
                    <span className="text-lg font-medium">{Number(averageRating) > 0 ? `${averageRating} out of 5` : 'No reviews yet'}</span>
                </div>
                {/* --- RENDER REVIEW FORM IF LOGGED IN --- */}
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