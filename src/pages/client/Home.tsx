import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, Star, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; 
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';
import { Helmet } from 'react-helmet-async';

// FIX: Cast Helmet to 'any' to resolve TypeScript error
const SeoHelmet = Helmet as any;

// --- NEW: IMAGE OPTIMIZATION HELPER ---
const optimizeImage = (url: string | undefined | null, width: number) => {
  if (!url) return '';
  // Only optimize if it's a Supabase URL
  if (url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&format=webp&quality=80`;
  }
  return url;
};

// --- HELPER: Extract Dominant Color from Image ---
const getAverageColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    // Optimization: Request tiny version for color extraction to save bandwidth
    img.src = optimizeImage(imageUrl, 100); 
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('#ffffff'); // Fallback
        return;
      }
      canvas.width = 1;
      canvas.height = 1;
      
      // Draw image to 1x1 canvas to get average color
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      
      resolve(`rgb(${r},${g},${b})`);
    };

    img.onerror = () => {
      resolve('#ffffff'); // Fallback on error
    };
  });
};

// --- HERO BANNER COMPONENT ---
interface HeroBannerProps {
  heroProduct: any;
  heroCount: number;
  onNext: () => void;
  onPrev: () => void;
}

const HeroBanner = ({ heroProduct, heroCount, onNext, onPrev }: HeroBannerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dominantColor, setDominantColor] = useState<string>('rgb(255,255,255)'); 
  const navigate = useNavigate();

  // --- SWIPE LOGIC STATE ---
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // 1. Detect Color when heroProduct changes
  useEffect(() => {
    if (heroProduct && heroProduct.image_url) {
      getAverageColor(heroProduct.image_url).then((color) => {
        setDominantColor(color);
      });
    }
  }, [heroProduct]);
  
  // 2. Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      onNext();
    }
    if (isRightSwipe) {
      onPrev();
    }
  };

  // 3. Desktop Canvas Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    let dots: any[] = [];
    
    const mouse = { x: -1000, y: -1000 };

    const init = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      
      dots = [];
      const spacing = 30; 
      
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          dots.push({
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: 1.2,
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hoverRadius = 150;
        if (dist < hoverRadius) {
          const force = (hoverRadius - dist) / hoverRadius;
          const lift = force * 20;
          
          dot.y = dot.baseY - lift;
          dot.size = 1.2 + (force * 1.5);
          ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + force})`;
        } else {
          dot.y = dot.baseY;
          dot.size = 1.2;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(animate);
    };

    init();
    animate();
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    const handleResize = () => init();

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Function to handle click on hero item
  const handleHeroClick = () => {
    if (heroProduct) {
      navigate(`/product/${heroProduct.id}`);
    }
  };

  return (
    <div className="w-full bg-transparent pt-0 pb-4 lg:py-12">
      {/* MOBILE HERO */}
      <div 
        className="md:hidden px-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="relative w-full rounded-2xl overflow-hidden shadow-md border border-white/20 min-h-[520px] flex flex-col"
          style={{
            background: `linear-gradient(180deg, ${dominantColor} 0%, rgba(229, 237, 247, 0.9) 85%, #e5edf7 100%)`
          }}
        >
          <div className="p-6 pb-2 z-10 flex flex-col items-start w-full">
             <span className="bg-black/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-sm">
                {heroProduct ? 'Highlights' : 'Featured'}
             </span>
             <AnimatePresence mode="wait">
               <motion.div
                 key={heroProduct ? `txt-${heroProduct.id}` : 'mob-txt'}
                 initial={{ opacity: 0, y: -5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -5 }}
                 transition={{ duration: 0.3 }}
                 className="text-left"
               >
                  <h1 className="text-3xl font-black text-slate-900 leading-[1.1] mb-2 drop-shadow-sm">
                      {heroProduct ? heroProduct.name : 'Loading...'}
                  </h1>
                  <p className="text-sm text-slate-800 font-medium opacity-90 line-clamp-2">
                      {heroProduct?.description}
                  </p>
               </motion.div>
             </AnimatePresence>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-4">
             <AnimatePresence mode="wait">
               {heroProduct ? (
                 <motion.div 
                   key={heroProduct.id} 
                   className="relative rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/20 cursor-pointer" 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   transition={{ duration: 0.3 }}
                   onClick={handleHeroClick} 
                 >
                   {/* OPTIMIZATION: Request 600px width for mobile hero */}
                   {/* LCP OPTIMIZATION: loading="eager", fetchpriority="high" */}
                   <img 
                     src={optimizeImage(heroProduct.image_url, 600)} 
                     alt={heroProduct.name} 
                     className="w-full h-auto max-h-[300px] object-cover"
                     draggable={false} 
                     loading="eager"
                     // @ts-ignore
                     fetchpriority="high"
                   />
                 </motion.div>
               ) : (
                 <Loader2 className="animate-spin text-gray-400" />
               )}
             </AnimatePresence>
          </div>

          <div className="p-4 z-10">
              <Link 
                to={heroProduct ? `/product/${heroProduct.id}` : '#'} 
                className="flex items-center justify-between w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-transform"
                aria-label={heroProduct ? `View deal for ${heroProduct.name}` : 'View deal'}
              >
                <span>Check {heroProduct?.price} Deal</span>
                <ArrowRight size={18} />
              </Link>
          </div>
        </div>
      </div>

      {/* DESKTOP HERO */}
      <div className="hidden md:block container mx-auto px-4">
        <div ref={containerRef} className="relative w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#172554] min-h-[500px] flex items-center shadow-2xl group/hero">
          <canvas ref={canvasRef} className="absolute inset-0 z-0" />
          {heroCount > 1 && (
            <button 
              onClick={onPrev}
              aria-label="Previous hero item"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-24 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          {heroCount > 1 && (
            <button 
              onClick={onNext}
              aria-label="Next hero item"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-24 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
            >
              <ChevronRight size={28} />
            </button>
          )}
          <div className="relative z-10 w-full px-8 lg:px-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              key={heroProduct ? heroProduct.id : 'loading'} 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block border border-[#38bdf8]/50 px-4 py-1.5 rounded-full mb-6 bg-[#38bdf8]/10 backdrop-blur-md">
                  <span className="text-[#38bdf8] text-[10px] font-bold tracking-[0.15em] uppercase">
                    {heroProduct ? 'Curated Collection' : 'Limited Time Only'}
                </span>
              </div>
              <h1 className="text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6 text-white">
                {heroProduct ? (
                    <>
                        {heroProduct.name.split(' ').slice(0, 2).join(' ')} <br/>
                        <span className="text-[#93c5fd]">Now {heroProduct.price}</span>
                    </>
                  ) : (
                    <>
                        New Style <br/>
                        <span className="text-[#93c5fd]">Drops</span>
                   </>
                )}
              </h1>
              <p className="text-blue-100 text-sm lg:text-base mb-8 font-medium max-w-md line-clamp-2">
                {heroProduct ? heroProduct.description : 'Elevate your space with our premium lighting and furniture collections.'}
              </p>
              <Link 
                to={heroProduct ? `/product/${heroProduct.id}` : '/shop'} 
                className="inline-flex bg-[#3b82f6] text-white px-8 py-3 rounded-full font-bold items-center gap-2 hover:bg-[#2563eb] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                aria-label="Shop now for featured product"
              >
                Shop Now <ChevronRight size={18} strokeWidth={3}/>
              </Link>
            </motion.div>
            <motion.div 
              key={`img-${heroProduct ? heroProduct.id : 'load'}`}
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8 }} 
              className="relative w-full aspect-[16/10] rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm border border-white/10 cursor-pointer"
              onClick={handleHeroClick}
            >
              {heroProduct ? (
                 // OPTIMIZATION: Request 1200px width for desktop hero
                 // LCP OPTIMIZATION: loading="eager", fetchpriority="high"
                 <img 
                   src={optimizeImage(heroProduct.image_url, 1200)} 
                   alt={heroProduct.name} 
                   className="max-h-[90%] max-w-[90%] object-contain rounded-[2rem] transition-transform scale-[1.005] hover:scale-[1.05] duration-700 drop-shadow-2xl" 
                   loading="eager"
                   // @ts-ignore
                   fetchpriority="high"
                 />
               ) : (
                 <div className="w-full h-full bg-white/5 flex items-center justify-center border border-white/10 rounded-3xl">
                    <span className="text-white/20 font-bold tracking-widest uppercase text-sm">[ Hero Image ]</span>
                 </div>
               )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN HOME PAGE COMPONENT ---
const HomePage: React.FC = () => {
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showArrows = categories.length > 5;

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchCats = async () => {
        const { data } = await supabase.from('categories').select('*').order('id');
        if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchHeroItems = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_hero', true) 
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setHeroProducts(data.map((item: any) => ({
          id: item.id, 
          name: item.name, 
          price: `£${item.price}`, 
          image: item.image_url, 
          tag: 'Featured', 
          description: item.description, 
          image_url: item.image_url,
          stock_quantity: item.stock_quantity
        })));
      } else {
        const { data: fallback } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        if (fallback) {
            setHeroProducts(fallback.map((item: any) => ({
                id: item.id, 
                name: item.name, 
                price: `£${item.price}`, 
                image: item.image_url, 
                tag: 'New', 
                description: item.description, 
                image_url: item.image_url,
                stock_quantity: item.stock_quantity
            })));
        }
      }
    };
    fetchHeroItems();
  }, []);

  useEffect(() => {
    const fetchLatestGrid = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(8); 
        if (data) {
            setLatestProducts(data.map((item: any) => ({
                id: item.id, 
                name: item.name, 
                price: `£${item.price}`, 
                // OPTIMIZATION: Request 500px width for product cards
                image: optimizeImage(item.image_url, 500), 
                tag: 'New',
                stock_quantity: item.stock_quantity
            })));
        }
    };
    fetchLatestGrid();
  }, []);

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
        setCurrentHeroIndex(prev => (prev + 1) % heroProducts.length);
    }, 15000); 
    return () => clearInterval(timer);
  }, [heroProducts]);

  const nextHero = () => setCurrentHeroIndex(prev => (prev + 1) % heroProducts.length);
  const prevHero = () => setCurrentHeroIndex(prev => (prev - 1 + heroProducts.length) % heroProducts.length);

  // --- SCROLL FUNCTION (DEFINED INSIDE COMPONENT) ---
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const firstCard = container.querySelector('.snap-start') as HTMLElement;
      
      if (firstCard) {
        const itemSize = firstCard.offsetWidth + 16;
        const scrollAmount = itemSize * 3; 

        container.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth',
        });
      }
    }
  };

  // --- RENDER (RETURN) ---
  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 overflow-x-hidden">
      <SeoHelmet>
        <title>Aidezel Ltd | Premium Lighting, Fashion & Home Living</title>
        <meta name="description" content="Discover premium lighting solutions, stylish fashion, modern furniture, and home appliances at Aidezel. Elevate your living space with our curated collections. Fast UK delivery." />
        <meta name="keywords" content="lighting, fashion, home appliances, furniture, home decor, modern living, aidezel, uk shop" />
        <link rel="canonical" href="https://aidezel.co.uk/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Aidezel Ltd | Lighting, Fashion & Home" />
        <meta property="og:description" content="Elevate your lifestyle with premium lighting, fashion, and home decor from Aidezel." />
        <meta property="og:image" content="https://aidezel.co.uk/social-preview.jpg" />
        <meta property="og:url" content="https://aidezel.co.uk/" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "Aidezel Ltd",
            "image": "https://aidezel.co.uk/logo.png",
            "description": "Premium home, lighting, and fashion retailer offering fast delivery and authentic quality.",
            "telephone": "+44 123 456 7890",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "123 Aidezel Lane",
              "addressLocality": "London",
              "postalCode": "SW1A 1AA",
              "addressCountry": "UK"
            },
            "priceRange": "££"
          })}
        </script>
      </SeoHelmet>
      
      <HeroBanner 
        heroProduct={heroProducts[currentHeroIndex]} 
        heroCount={heroProducts.length}
        onNext={nextHero}
        onPrev={prevHero}
      />
      
      {/* CATEGORIES SECTION */}
      <div className="w-full py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Shop by Category</h2>
                <p className="text-slate-500 text-sm mt-1">Explore our wide range of collections</p>
            </div>

            <div className="flex items-center gap-4">
                {showArrows && (
                  <button 
                      onClick={() => scroll('left')} 
                      aria-label="Scroll left"
                      className="hidden lg:flex shrink-0 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 z-10"
                  >
                      <ChevronLeft size={24} strokeWidth={2} />
                  </button>
                )}

                <div 
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto flex-1 snap-x snap-mandatory scrollbar-hide scroll-smooth pt-0 pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {categories.map((cat, idx) => (
                    <div 
                        key={idx} 
                        className="snap-start shrink-0 w-[40%] md:w-[28%] lg:w-[calc((100%-64px)/5)]"
                    >
                        <Link to={`/shop?category=${cat.name}`}>
                            <div className="group/card relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 bg-white transform-gpu [-webkit-mask-image:linear-gradient(white,white)]">
                                {cat.image_url ? (
                                    // OPTIMIZATION: Request 400px width for category cards
                                    // LCP FIX: Removed loading="lazy" (defaults to eager or explicitly eager)
                                    <img 
                                        src={optimizeImage(cat.image_url, 400)} 
                                        alt={cat.name} 
                                        loading="eager"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                                        <span className="text-4xl font-black text-slate-200 uppercase">
                                            {cat.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover/card:opacity-70" />
                                <div className="absolute bottom-0 inset-x-0 p-4">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 py-2.5 rounded-xl text-center shadow-sm group-hover/card:bg-white/20 transition-colors">
                                        <span className="text-xs font-bold text-white tracking-widest uppercase truncate block px-2">
                                            {cat.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="w-full py-12 flex items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="animate-spin" /> Loading Collections...
                        </div>
                    )}
                </div>

                {showArrows && (
                  <button 
                      onClick={() => scroll('right')} 
                      aria-label="Scroll right"
                      className="hidden lg:flex shrink-0 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 z-10"
                  >
                      <ChevronRight size={24} strokeWidth={2} />
                  </button>
                )}
            </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-12 space-y-24">
        {/* LATEST LAUNCHES */}
        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Latest Launches</h2>
              <p className="text-slate-500 mt-2 text-sm">Discover our newest additions in fashion and home.</p>
            </div>
            <Link to="/shop" aria-label="View all latest products" className="text-[#2563eb] font-bold hover:text-[#1d4ed8] transition-all flex items-center gap-1 pb-0.5 border-b border-transparent hover:border-[#1d4ed8]">
              View All <ChevronRight size={14}/>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProducts.length > 0 ? (
              latestProducts.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
               <div className="col-span-4 py-20 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400">
                 Inventory syncing...
               </div>
            )}
          </div>
        </section>

        {/* FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { title: 'Fast Delivery', desc: 'UK-wide delivery within 24 hours', icon: Zap },
             { title: 'Premium Quality', desc: 'Authentic quality guaranteed', icon: Star },
             { title: 'Easy Returns', desc: 'Hassle-free return policy', icon: ShoppingBag },
           ].map((item, idx) => (
             <div key={idx} className="bg-white border border-slate-200 p-8 rounded-2xl flex items-center gap-6 hover:border-[#3b82f6] hover:-translate-y-1 transition-all duration-300 shadow-sm group">
               <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb] group-hover:scale-110 transition-transform">
                  <item.icon size={24} />
               </div>
               <div>
                 <h4 className="font-bold text-lg text-slate-900">{item.title}</h4>
                 <p className="text-slate-500 text-xs">{item.desc}</p>
               </div>
             </div>
           ))}
        </section>

      </main>
    </div>
  );
};

export default HomePage;