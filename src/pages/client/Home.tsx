import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, User, ShoppingCart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';

// --- HERO BANNER (Unchanged) ---
const HeroBanner = ({ heroProduct }: { heroProduct: any }) => {
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
    <div className="w-full bg-white py-8 lg:py-12">
      <div className="container mx-auto px-4">
        
        <div ref={containerRef} className="relative w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#172554] min-h-[500px] flex items-center shadow-2xl">
          
          <canvas ref={canvasRef} className="absolute inset-0 z-0" />
          
          <div className="relative z-10 w-full px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <motion.div 
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
                        <span className="text-[#93c5fd]">Now £{heroProduct.price}</span>
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
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8 }} 
              className="relative w-full aspect-[16/10] bg-[#0f172a]/60 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-inner overflow-hidden"
            >
               {heroProduct ? (
                 <img 
                    src={heroProduct.image_url} 
                    alt={heroProduct.name} 
                    className="w-full h-full object-contain p-8 drop-shadow-2xl" 
                 />
               ) : (
                 <span className="text-white/20 font-bold tracking-widest uppercase text-sm">[ Hero Product Image ]</span>
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
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [heroProduct, setHeroProduct] = useState<any>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [catIndex, setCatIndex] = useState(0);
  
  // Show 8 categories at once
  const VISIBLE_CATS = 8;

  useEffect(() => {
    const fetchCats = async () => {
        const { data } = await supabase.from('categories').select('*').order('id');
        if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(4);
      if (data) {
        setDbProducts(data.map((item: any) => ({
          id: item.id, name: item.name, price: `£${item.price}`, image: item.image_url, tag: 'New'
        })));

        const hero = data.find((p: any) => p.is_hero);
        if (hero) {
            setHeroProduct(hero);
        } else {
            const { data: heroData } = await supabase.from('products').select('*').eq('is_hero', true).limit(1);
            if (heroData && heroData.length > 0) setHeroProduct(heroData[0]);
        }
      }
    };
    fetchLatest();
  }, []);

  const nextCat = () => setCatIndex(prev => Math.min(prev + 1, categories.length - VISIBLE_CATS));
  const prevCat = () => setCatIndex(prev => Math.max(prev - 1, 0));

  // Determine if scrolling is needed
  const isScrollable = categories.length > VISIBLE_CATS;
  const isStart = catIndex === 0;
  const isEnd = !isScrollable || catIndex >= categories.length - VISIBLE_CATS;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      <HeroBanner heroProduct={heroProduct} />
      
      {/* --- DYNAMIC CATEGORIES CAROUSEL --- */}
      <div className="bg-white py-12 relative group/carousel">
        <div className="container mx-auto px-4">
            
            <div className="relative flex items-center justify-center gap-4">
                
                {/* PREV BUTTON (Only render if we have > 8 categories) */}
                {isScrollable && (
                    <button 
                        onClick={prevCat}
                        disabled={isStart}
                        // UPDATED STYLE: Increased gap with lg:-left-8
                        className={`absolute left-0 lg:-left-8 z-20 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-white/50 text-slate-800 transition-all duration-300
                            ${isStart ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'bg-white/40 backdrop-blur-md hover:bg-white/80 hover:scale-110 cursor-pointer'}
                        `}
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}

                {/* THE CATEGORIES LIST */}
                <div className="flex justify-center gap-6 lg:gap-10 transition-all duration-300 w-full overflow-hidden py-4 px-4 lg:px-12">
                    {categories.slice(catIndex, catIndex + VISIBLE_CATS).map((cat, idx) => (
                        <Link 
                            key={idx} 
                            to={`/shop?category=${cat.name}`} 
                            className="flex flex-col items-center gap-4 cursor-pointer group w-32 flex-shrink-0"
                        >
                            <div className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-3xl overflow-hidden shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 bg-white">
                                
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />

                                {cat.image_url ? (
                                    <img 
                                        src={cat.image_url} 
                                        alt={cat.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center text-slate-400">
                                        <span className="text-4xl font-black opacity-20 uppercase">{cat.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            
                            <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors text-center leading-tight">
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                    
                    {categories.length === 0 && (
                        <div className="text-gray-400 text-sm flex items-center gap-2 py-10">
                            <Loader2 className="animate-spin" /> Loading Categories...
                        </div>
                    )}
                </div>

                {/* NEXT BUTTON (Only render if we have > 8 categories) */}
                {isScrollable && (
                    <button 
                        onClick={nextCat}
                        disabled={isEnd}
                        // UPDATED STYLE: Increased gap with lg:-right-8
                        className={`absolute right-0 lg:-right-8 z-20 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-white/50 text-slate-800 transition-all duration-300
                            ${isEnd ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'bg-white/40 backdrop-blur-md hover:bg-white/80 hover:scale-110 cursor-pointer'}
                        `}
                    >
                        <ChevronRight size={24} />
                    </button>
                )}

            </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-20 space-y-24">
        
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
            {dbProducts.length > 0 ? (
              dbProducts.map((product) => <ProductCard key={product.id} product={product} />)
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
             <div key={idx} className="bg-white border border-slate-200 p-8 rounded-2xl flex items-center gap-6 hover:border-[#3b82f6] hover:-translate-y-1 transition-all duration-300 shadow-sm">
               <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb]">
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