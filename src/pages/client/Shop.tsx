import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom'; 
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const [searchParams] = useSearchParams(); 
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(3000);

  // --- 1. LISTEN for URL changes & FIX "Home & Kitchen" bug ---
  useEffect(() => {
    let categoryFromUrl = searchParams.get('category');
    
    if (categoryFromUrl) {
      // FIX: If URL breaks at '&' and gives us "Home " or "Home", we force it to the correct category
      if (categoryFromUrl.trim() === 'Home' || categoryFromUrl === 'Home & Kitchen') {
         setSelectedCategory('Home & Kitchen');
      } else {
         setSelectedCategory(categoryFromUrl);
      }
    } else {
      setSelectedCategory('All');
    }
    
    // Scroll to top when switching categories or entering shop
    window.scrollTo(0, 0);
  }, [searchParams]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: `£${item.price}`,
          rawPrice: item.price,
          image: item.image_url,
          category: item.category,
          tag: item.status === 'Out of Stock' ? 'Sold Out' : 'New'
        }));
        setProducts(formatted);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // --- Filter Logic ---
  const filteredProducts = products.filter((product: any) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesPrice = product.rawPrice <= priceRange;
    return matchesCategory && matchesPrice;
  });

  const categories = ['All', 'Lighting', 'Jewellery', 'Home & Kitchen'];

  // Reusable Filter Content
  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-lg mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <input 
                type="radio" 
                name="category" 
                id={cat} 
                // FIX: Ensure 'Home & Kitchen' is checked even if there are subtle string differences
                checked={selectedCategory === cat}
                onChange={() => setSelectedCategory(cat)}
                className="w-5 h-5 accent-black cursor-pointer"
              />
              <label htmlFor={cat} className="text-gray-700 font-medium cursor-pointer flex-1 py-1">{cat}</label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-4 flex justify-between">
          Max Price <span>£{priceRange}</span>
        </h3>
        <input 
          type="range" 
          min="0" 
          max="3000" 
          value={priceRange} 
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>£0</span>
          <span>£3,000+</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 pt-4 pb-24 min-h-screen">
      
      {/* Mobile Header Controls */}
      <div className="lg:hidden mb-6 flex gap-3 sticky top-[72px] z-30 bg-gray-50/95 backdrop-blur py-2">
        <button 
          onClick={() => setShowMobileFilters(true)}
          className="flex-1 bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm active:scale-95 transition-transform"
        >
          <SlidersHorizontal size={18} /> Filters
        </button>
        <button className="flex-1 bg-white border border-gray-200 p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm active:scale-95 transition-transform">
          <ChevronDown size={18} /> Sort By
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden lg:block w-64 space-y-8 h-fit sticky top-24">
          <FilterContent />
        </aside>

        {/* MAIN GRID */}
        <div className="flex-1">
          <div className="hidden lg:flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Shop ({filteredProducts.length})</h1>
          </div>

          {loading ? (
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
               {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>)}
             </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-12 rounded-xl text-center border border-dashed border-gray-300">
              <h3 className="text-xl font-bold text-gray-800">No products found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTERS DRAWER (Slide Up) */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
          
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-safe h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white pb-4 border-b">
              <h2 className="text-2xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <FilterContent />
            
            <div className="sticky bottom-0 bg-white pt-4 mt-8 pb-4">
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Shop;