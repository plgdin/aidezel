import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, User, ShoppingCart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';

// --- HERO BANNER (FIXED WITH NAVIGATION) ---
interface HeroBannerProps {
  heroProduct: any;
  heroCount: number;
  onNext: () => void;
  onPrev: () => void;
}

const HeroBanner = ({ heroProduct, heroCount, onNext, onPrev }: HeroBannerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
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

  return (
    <div className="w-full bg-transparent py-8 lg:py-12">
      <div className="container mx-auto px-4">
        
        <div ref={containerRef} className="relative w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#172554] min-h-[500px] flex items-center shadow-2xl group/hero">
          
          <canvas ref={canvasRef} className="absolute inset-0 z-0" />

          {/* --- LEFT GLASS SLIDER (Vertical Rectangle) --- */}
          {heroCount > 1 && (
            <button 
              onClick={onPrev}
              // FIX: Removed 'flex' here because 'hidden md:flex' handles it correctly below
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-24 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hidden md:flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* --- RIGHT GLASS SLIDER (Vertical Rectangle) --- */}
          {heroCount > 1 && (
            <button 
              onClick={onNext}
              // FIX: Removed 'flex' here because 'hidden md:flex' handles it correctly below
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-24 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hidden md:flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
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
                    {heroProduct ? 'Featured Product' : 'Limited Time Only'}
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
                        Price Drop <br/>
                        <span className="text-[#93c5fd]">Alert</span>
                    </>
                )}
              </h1>
              
              <p className="text-blue-100 text-sm lg:text-base mb-8 font-medium max-w-md line-clamp-2">
                {heroProduct ? heroProduct.description : 'Grab the latest collections at unbeatable prices.'}
              </p>
              
              <Link 
                to={heroProduct ? `/product/${heroProduct.id}` : '/shop'} 
                className="inline-flex bg-[#3b82f6] text-white px-8 py-3 rounded-full font-bold items-center gap-2 hover:bg-[#2563eb] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
              >
                Shop Now <ChevronRight size={18} strokeWidth={3}/>
              </Link>
            </motion.div>

            <motion.div 
              key={`img-${heroProduct ? heroProduct.id : 'load'}`}
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8 }} 
              className="relative w-full aspect-[16/10] rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
               {heroProduct ? (
                 <img 
                   src={heroProduct.image_url} 
                   alt={heroProduct.name} 
                   className="max-h-[90%] max-w-[90%] object-contain rounded-[2rem] transition-transform scale-[1.005] hover:scale-[1.05] duration-700 drop-shadow-2xl" 
                 />
               ) : (
                 <div className="w-full h-full bg-white/5 flex items-center justify-center border border-white/10 rounded-3xl">
                    <span className="text-white/20 font-bold tracking-widest uppercase text-sm">[ Hero Product Image ]</span>
                 </div>
               )}
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN HOME PAGE ---
const HomePage: React.FC = () => {
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null); 

  // Derived state to check if we have more than 5 items
  const showArrows = categories.length > 5;

  useEffect(() => {
    const fetchCats = async () => {
        const { data } = await supabase.from('categories').select('*').order('id');
        if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  // --- FETCH HERO PRODUCTS (STARRED IN ADMIN) ---
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
          
          // --- FIX: ADDED STOCK QUANTITY HERE ---
          stock_quantity: item.stock_quantity
        })));
      } else {
        // Fallback
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
                
                // --- FIX: ADDED STOCK QUANTITY HERE ---
                stock_quantity: item.stock_quantity
            })));
        }
      }
    };
    fetchHeroItems();
  }, []);

  // --- FETCH LATEST PRODUCTS (FOR THE GRID BELOW) ---
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
                image: item.image_url, 
                tag: 'New',
                
                // --- FIX: ADDED STOCK QUANTITY HERE ---
                stock_quantity: item.stock_quantity
            })));
        }
    };
    fetchLatestGrid();
  }, []);

  // Cycle Hero Logic (15 seconds)
  useEffect(() => {
    if (heroProducts.length <= 1) return; // Don't auto-scroll if only 1 item
    const timer = setInterval(() => {
        setCurrentHeroIndex(prev => (prev + 1) % heroProducts.length);
    }, 15000); 
    return () => clearInterval(timer);
  }, [heroProducts]);

  // --- MANUAL HERO NAVIGATION ---
  const nextHero = () => {
    setCurrentHeroIndex(prev => (prev + 1) % heroProducts.length);
  };

  const prevHero = () => {
    setCurrentHeroIndex(prev => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  // --- SCROLL FUNCTION ---
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

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 overflow-x-hidden">
      
      {/* Pass Hero Data + Navigation Functions */}
      <HeroBanner 
        heroProduct={heroProducts[currentHeroIndex]} 
        heroCount={heroProducts.length}
        onNext={nextHero}
        onPrev={prevHero}
      />
      
      {/* --- NEW PREMIUM CATEGORIES SECTION --- */}
      <div className="w-full py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
            
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Shop by Category</h2>
                <p className="text-slate-500 text-sm mt-1">Explore our wide range of collections</p>
            </div>

            {/* Flex Container for List + Arrows */}
            <div className="flex items-center gap-4">
            
                {/* LEFT ARROW (Conditionally Rendered) */}
                {showArrows && (
                  <button 
                      onClick={() => scroll('left')} 
                      className="hidden lg:flex shrink-0 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 z-10"
                  >
                      <ChevronLeft size={24} strokeWidth={2} />
                  </button>
                )}

                {/* SCROLL AREA */}
                <div 
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto flex-1 snap-x snap-mandatory scrollbar-hide scroll-smooth py-4"
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
                                    <img 
                                        src={cat.image_url} 
                                        alt={cat.name} 
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

                    {/* Loader */}
                    {categories.length === 0 && (
                        <div className="w-full py-12 flex items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="animate-spin" /> Loading Collections...
                        </div>
                    )}
                </div>

                {/* RIGHT ARROW (Conditionally Rendered) */}
                {showArrows && (
                  <button 
                      onClick={() => scroll('right')} 
                      className="hidden lg:flex shrink-0 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 z-10"
                  >
                      <ChevronRight size={24} strokeWidth={2} />
                  </button>
                )}

            </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-12 space-y-24">
        {/* NEW ARRIVALS */}
        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Latest Launches</h2>
              <p className="text-slate-500 mt-2 text-sm">Fresh technology just arrived.</p>
            </div>
            <Link to="/shop" className="text-[#2563eb] font-bold hover:text-[#1d4ed8] transition-all flex items-center gap-1 pb-0.5 border-b border-transparent hover:border-[#1d4ed8]">
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
             { title: 'Official Warranty', desc: '100% Original products', icon: User },
             { title: 'Easy Returns', desc: 'Hassle-free return policy', icon: ShoppingCart },
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