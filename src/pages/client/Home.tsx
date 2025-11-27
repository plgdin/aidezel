import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lightbulb, Gem, Armchair, Zap, User, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';

// MODIFIED: Slightly increased icon size to 32
const CATEGORIES = [
  { name: 'Lighting', icon: <Lightbulb size={32} /> },
  { name: 'Home & Kitchen', icon: <Armchair size={32} /> },
  { name: 'Jewellery', icon: <Gem size={32} /> },
];

const HeroBanner: React.FC = () => {
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
    
    // Mouse state starts off-screen
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
            size: 1.2, // Slightly smaller to fit the density
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Calculate distance between mouse and dot
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hoverRadius = 150; // Tighter interaction radius for dense grid

        // LOGIC: "Raised Up" Effect
        if (dist < hoverRadius) {
          const force = (hoverRadius - dist) / hoverRadius;
          const lift = force * 20; // Lift height
          
          dot.y = dot.baseY - lift;
          dot.size = 1.2 + (force * 1.5); 
          
          // Bright Cyan when hovered
          ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + force})`; 
        } else {
          // Static state
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

    // Track mouse relative to the hero container
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
    // WRAPPER: White Background
    <div className="w-full bg-white py-8 lg:py-12">
      <div className="container mx-auto px-4">
        
        {/* THE CARD: Deep Royal Blue Gradient */}
        <div ref={containerRef} className="relative w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#172554] min-h-[500px] flex items-center shadow-2xl">
          
          {/* Canvas Layer */}
          <canvas ref={canvasRef} className="absolute inset-0 z-0" />
          
          <div className="relative z-10 w-full px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-block border border-[#38bdf8]/50 px-4 py-1.5 rounded-full mb-6 bg-[#38bdf8]/10 backdrop-blur-md">
                <span className="text-[#38bdf8] text-[10px] font-bold tracking-[0.15em] uppercase">Limited Time Only</span>
              </div>
              
              {/* Heading */}
              <h1 className="text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6 text-white">
                Price Drop <br/>
                <span className="text-[#93c5fd]">Alert</span>
              </h1>
              
              <p className="text-blue-100 text-sm lg:text-base mb-8 font-medium max-w-md">
                Grab the latest collections at unbeatable prices.
              </p>
              
              {/* Button */}
              <button className="bg-[#3b82f6] text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#2563eb] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                Shop Now <ChevronRight size={18} strokeWidth={3}/>
              </button>
            </motion.div>

            {/* Right Image Placeholder */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8 }} 
              className="relative w-full aspect-[16/10] bg-[#0f172a]/60 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-inner"
            >
               <span className="text-white/20 font-bold tracking-widest uppercase text-sm">[ Hero Product Image ]</span>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(4);
      if (data) {
        setDbProducts(data.map((item: any) => ({
          id: item.id, name: item.name, price: `£${item.price}`, image: item.image_url, tag: 'New'
        })));
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      <HeroBanner />
      
      {/* CATEGORIES */}
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 flex justify-center gap-16 lg:gap-24 flex-wrap">
          {CATEGORIES.map((cat, idx) => (
            <Link key={idx} to={`/shop?category=${cat.name}`} className="flex flex-col items-center gap-5 cursor-pointer">
              
              {/* MODIFIED: Circle Container -> w-20 h-20 (80px) */}
              <div className="group relative w-20 h-20 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-[#3b82f6] bg-white">
                
                {/* The Fill Layer */}
                <div className="absolute bottom-0 left-0 w-full h-0 bg-[#3b82f6] transition-all duration-300 ease-out group-hover:h-full"></div>

                {/* The Icon */}
                <div className="relative z-10 text-slate-400 transition-colors duration-300 group-hover:text-white">
                  {cat.icon}
                </div>

              </div>
              
              {/* MODIFIED: Text Label -> text-base */}
              <span className="text-base font-bold text-slate-600 hover:text-[#0f172a] transition-colors">{cat.name}</span>
            </Link>
          ))}
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