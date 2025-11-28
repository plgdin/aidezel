import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, X, SlidersHorizontal, Search, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom'; 
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';

// --- CONSTANTS ---
const PRICE_RANGES = [
  { label: 'Under £1,000', min: 0, max: 1000 },
  { label: '£1,000 - £5,000', min: 1000, max: 5000 },
  { label: '£5,000 - £10,000', min: 5000, max: 10000 },
  { label: 'Over £10,000', min: 10000, max: 1000000 },
];

// --- UTILITY: Levenshtein Distance ---
const getLevenshteinDistance = (a: string, b: string) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams(); 
  
  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState<{min: number, max: number, label: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // --- 1. LISTEN for URL changes ---
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const searchFromUrl = searchParams.get('search');
    
    if (categoryFromUrl) {
      if (categoryFromUrl.trim() === 'Home' || categoryFromUrl === 'Home & Kitchen') {
         setSelectedCategory('Home & Kitchen');
      } else {
         setSelectedCategory(categoryFromUrl);
      }
    } else {
      setSelectedCategory('All');
    }

    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    } else {
      setSearchTerm('');
    }
    
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
          price: `£${item.price.toLocaleString()}`,
          rawPrice: item.price,
          image: item.image_url,
          category: item.category,
          brand: item.brand,
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
    
    const matchesPrice = selectedPrice 
      ? (product.rawPrice >= selectedPrice.min && product.rawPrice <= selectedPrice.max)
      : true;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      product.name.toLowerCase().includes(searchLower) || 
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower));

    return matchesCategory && matchesPrice && matchesSearch;
  });

  // --- Suggestion Logic ---
  useEffect(() => {
    if (filteredProducts.length === 0 && searchTerm.length > 2) {
      let bestMatch = '';
      let lowestDistance = 100;
      const allTerms = new Set<string>();

      products.forEach(p => {
        if (p.name) allTerms.add(p.name);
        if (p.category) {
            allTerms.add(p.category);
            if (p.category === 'Home & Kitchen') allTerms.add('Kitchen');
        }
        // @ts-ignore
        if (p.brand) allTerms.add(p.brand);
      });

      allTerms.forEach(term => {
        if (typeof term === 'string') {
            const dist = getLevenshteinDistance(searchTerm.toLowerCase(), term.toLowerCase());
            if (dist < 4 && dist < lowestDistance) {
              lowestDistance = dist;
              bestMatch = term;
            }
        }
      });

      if (bestMatch && lowestDistance > 0) {
        setSuggestion(bestMatch);
      } else {
        setSuggestion(null);
      }
    } else {
      setSuggestion(null);
    }
  }, [searchTerm, filteredProducts, products]);

  const categories = ['All', 'Lighting', 'Jewellery', 'Home & Kitchen'];

  const clearSearch = () => {
    setSearchTerm('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
  };

  const resetAllFilters = () => {
    clearSearch();
    setSelectedPrice(null);
    setSelectedCategory('All');
  };

  const applySuggestion = () => {
    if (suggestion) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('search', suggestion);
      setSearchParams(newParams);
      setSearchTerm(suggestion);
    }
  };

  const FilterContent = () => (
    <div className="space-y-8">
      
      {/* CATEGORIES FILTER */}
      <div>
        <h3 className="font-bold text-lg mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <input 
                type="radio" 
                name="category" 
                id={cat} 
                checked={selectedCategory === cat}
                onChange={() => {
                    setSelectedCategory(cat);
                    const newParams = new URLSearchParams(searchParams);
                    if (cat === 'All') newParams.delete('category');
                    else newParams.set('category', cat);
                    setSearchParams(newParams);
                }}
                className="w-5 h-5 accent-black cursor-pointer"
              />
              <label htmlFor={cat} className="text-gray-700 font-medium cursor-pointer flex-1 py-1 hover:text-blue-600 transition-colors">{cat}</label>
            </div>
          ))}
        </div>
      </div>
      
      {/* PRICE FILTER */}
      <div>
        <h3 className="font-bold text-lg mb-4">Price</h3>
        <div className="space-y-3">
          {/* Option for All Prices */}
          <div className="flex items-center gap-3">
            <input 
              type="radio" 
              name="price" 
              id="price-all"
              checked={selectedPrice === null}
              onChange={() => setSelectedPrice(null)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
            <label htmlFor="price-all" className="text-gray-700 font-medium cursor-pointer flex-1 py-1 hover:text-blue-600 transition-colors">
              All Prices
            </label>
          </div>

          {/* Dynamic Ranges */}
          {PRICE_RANGES.map((range, index) => (
            <div key={index} className="flex items-center gap-3">
              <input 
                type="radio" 
                name="price" 
                id={`price-${index}`}
                checked={selectedPrice?.label === range.label}
                onChange={() => setSelectedPrice(range)}
                className="w-5 h-5 accent-black cursor-pointer"
              />
              <label htmlFor={`price-${index}`} className="text-gray-700 font-medium cursor-pointer flex-1 py-1 hover:text-blue-600 transition-colors">
                {range.label}
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  return (
    <div className="container mx-auto px-4 pt-4 pb-24 min-h-screen">
      
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
        
        <aside className="hidden lg:block w-64 space-y-8 h-fit sticky top-24">
          <FilterContent />
        </aside>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                Shop 
                <span className="text-gray-400 text-lg font-medium">({filteredProducts.length} results)</span>
            </h1>
            
            {searchTerm && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                    <span>Search: "{searchTerm}"</span>
                    <button onClick={clearSearch} className="hover:text-blue-900"><X size={14}/></button>
                </div>
            )}
          </div>

          {loading ? (
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
               {[1,2,3,4].map(i => <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>)}
             </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-12 rounded-xl text-center border border-dashed border-gray-300 mt-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">No products found</h3>
              <p className="text-gray-500 mt-2">We couldn't find anything for "{searchTerm}".</p>
              
              {suggestion && (
                // FIXED: Changed styles from yellow to neutral gray/blue
                <div className="mt-6 bg-gray-100 border border-gray-200 p-4 rounded-lg inline-block">
                  <p className="text-gray-600 text-sm mb-1">Did you mean?</p>
                  <button 
                    onClick={applySuggestion} 
                    className="text-lg font-bold text-blue-600 flex items-center gap-2 mx-auto hover:underline"
                  >
                    {suggestion} <ArrowRight size={16} />
                  </button>
                </div>
              )}

              <div className="mt-8">
                 <button onClick={resetAllFilters} className="text-blue-600 font-bold hover:underline">Clear all filters</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-safe h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white pb-4 border-b">
              <h2 className="text-2xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <FilterContent />
            <div className="sticky bottom-0 bg-white pt-4 mt-8 pb-4">
              <button onClick={() => setShowMobileFilters(false)} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg">
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