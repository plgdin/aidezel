import React, { useState, useEffect, useMemo } from 'react';
// FIX: Added 'ChevronRight' to the import list
import { Filter, ChevronDown, X, SlidersHorizontal, Search, ArrowRight, Check, ChevronLeft, ChevronUp, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom'; 
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';

// --- CONSTANTS ---
const PRICE_RANGES = [
  { label: 'Under £50', min: 0, max: 50 },
  { label: '£50 - £100', min: 50, max: 100 },
  { label: '£100 - £500', min: 100, max: 500 },
  { label: 'Over £500', min: 500, max: 1000000 },
];

// --- UTILITY: Levenshtein Distance ---
const getLevenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams(); 
  
  // --- FILTER STATE ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([]); 
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);   
  const [selectedPrice, setSelectedPrice] = useState<{min: number, max: number, label: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New state for dynamic specs filtering (if needed for drill down)
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      const { data: cats } = await supabase.from('categories').select('name').order('name');
      if (cats) setCategories(cats.map(c => c.name));

      const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      
      if (prods) {
        const formatted = prods.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: `£${item.price.toLocaleString()}`,
          rawPrice: item.price,
          image: item.image_url,
          category: item.category,
          subcategory: item.subcategory,
          brand: item.brand,
          specs: item.specs || {},
          tag: item.status === 'Out of Stock' ? 'Sold Out' : (item.is_hero ? 'Featured' : 'New')
        }));
        setAllProducts(formatted);
      }
      setLoading(false);
    };
    initData();
  }, []);

  // --- 2. SYNC URL PARAMS ---
  useEffect(() => {
    const catUrl = searchParams.get('category');
    const searchUrl = searchParams.get('search');
    
    if (catUrl) {
       setSelectedCategory(decodeURIComponent(catUrl));
    } else {
       setSelectedCategory('All');
    }

    if (searchUrl) setSearchTerm(searchUrl);
    else setSearchTerm('');

  }, [searchParams]);


  // --- 3. DYNAMIC METADATA ---
  const { availableSubcats, availableBrands, availableSpecs } = useMemo(() => {
    let relevantProducts = allProducts;
    
    // If a category is selected, ONLY show metadata for that category
    if (selectedCategory !== 'All') {
        relevantProducts = allProducts.filter(p => p.category === selectedCategory);
    }

    const subcats = Array.from(new Set(relevantProducts.map(p => p.subcategory).filter(Boolean)));
    const brands = Array.from(new Set(relevantProducts.map(p => p.brand).filter(Boolean)));
    
    // Extract dynamic specs
    const specsMap: Record<string, Set<string>> = {};
    relevantProducts.forEach((p: any) => {
        if (p.specs) {
            Object.entries(p.specs).forEach(([key, val]) => {
                if (!specsMap[key]) specsMap[key] = new Set();
                specsMap[key].add(String(val));
            });
        }
    });

    const specsArray = Object.entries(specsMap).map(([key, values]) => ({
        key,
        values: Array.from(values).sort()
    })).sort((a, b) => a.key.localeCompare(b.key));

    return { 
        availableSubcats: subcats.sort(), 
        availableBrands: brands.sort(),
        availableSpecs: specsArray
    };
  }, [selectedCategory, allProducts]);


  // --- 4. MASTER FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSubcat = selectedSubcats.length === 0 || (product.subcategory && selectedSubcats.includes(product.subcategory));
      const matchesBrand = selectedBrands.length === 0 || (product.brand && selectedBrands.includes(product.brand));
      
      const matchesSpecs = Object.entries(selectedSpecs).every(([key, values]) => {
          if (values.length === 0) return true;
          return product.specs && product.specs[key] && values.includes(product.specs[key]);
      });

      const matchesPrice = selectedPrice 
        ? (product.rawPrice >= selectedPrice.min && product.rawPrice <= selectedPrice.max)
        : true;
        
      const matchesDelivery = fastDeliveryOnly ? product.tag !== 'Sold Out' : true;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) || 
        (product.category && product.category.toLowerCase().includes(searchLower)) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower));

      return matchesCategory && matchesSubcat && matchesBrand && matchesSpecs && matchesPrice && matchesDelivery && matchesSearch;
    });
  }, [allProducts, selectedCategory, selectedSubcats, selectedBrands, selectedSpecs, selectedPrice, fastDeliveryOnly, searchTerm]);


  // --- HANDLERS ---
  const handleCategoryChange = (cat: string) => {
      setSelectedCategory(cat);
      setSelectedSubcats([]); 
      setSelectedBrands([]);
      setSelectedSpecs({});
      
      const newParams = new URLSearchParams(searchParams);
      if (cat === 'All') newParams.delete('category');
      else newParams.set('category', cat);
      setSearchParams(newParams);
  };

  const toggleFilter = (item: string, list: string[], setList: Function) => {
      if (list.includes(item)) setList(list.filter(i => i !== item));
      else setList([...list, item]);
  };

  const toggleSpec = (key: string, value: string) => {
      setSelectedSpecs(prev => {
          const currentValues = prev[key] || [];
          const newValues = currentValues.includes(value)
             ? currentValues.filter(v => v !== value)
             : [...currentValues, value];
          
          if (newValues.length === 0) {
              const { [key]: _, ...rest } = prev;
              return rest;
          }
          return { ...prev, [key]: newValues };
      });
  };

  const clearSearch = () => {
    setSearchTerm('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
  };

  const resetAllFilters = () => {
    clearSearch();
    setSelectedPrice(null);
    setSelectedSubcats([]);
    setSelectedBrands([]);
    setSelectedSpecs({});
    setFastDeliveryOnly(false);
    handleCategoryChange('All');
  };

  const applySuggestion = () => {
    if (suggestion) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('search', suggestion);
      setSearchParams(newParams);
      setSearchTerm(suggestion);
    }
  };

  // --- HELPER COMPONENT ---
  const FilterSection = ({ title, children, defaultOpen = true }: any) => {
      const [isOpen, setIsOpen] = useState(defaultOpen);
      return (
          <div className="border-b border-gray-100 py-4">
              <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full mb-2 group">
                  <span className="font-bold text-sm text-gray-900 uppercase tracking-wide group-hover:text-blue-600 transition-colors">{title}</span>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
              </button>
              {isOpen && <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">{children}</div>}
          </div>
      );
  };

  // --- RENDER SIDEBAR ---
  const FilterContent = () => (
    <div className="space-y-1 pr-2">
      
      {/* 1. DRILL-DOWN CATEGORY LOGIC */}
      <div className="pb-6 border-b border-gray-100 mb-4">
        <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">Department</h3>
        
        {selectedCategory === 'All' ? (
            /* MODE A: Show All Categories */
            <div className="space-y-1">
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => handleCategoryChange(cat)}
                        className="flex items-center justify-between w-full text-left py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 rounded-lg transition-colors"
                    >
                        {cat} <ChevronRight size={14} className="text-gray-300"/>
                    </button>
                ))}
            </div>
        ) : (
            /* MODE B: Selected Category (Drill Down View) */
            <div className="animate-in slide-in-from-left-2 duration-300">
                <button 
                    onClick={() => handleCategoryChange('All')}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 mb-3 transition-colors font-medium"
                >
                    <ChevronLeft size={14} /> All Departments
                </button>
                
                <div className="font-bold text-lg text-gray-900 px-3 border-l-4 border-blue-600 bg-blue-50/50 py-2 rounded-r-lg">
                    {selectedCategory}
                </div>
            </div>
        )}
      </div>

      {/* 2. DYNAMIC FILTERS (Only visible when a category is selected) */}
      {selectedCategory !== 'All' && (
          <>
            <div className="pb-4 border-b border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer group p-1.5 rounded hover:bg-gray-50">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${fastDeliveryOnly ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                        {fastDeliveryOnly && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={fastDeliveryOnly} onChange={() => setFastDeliveryOnly(!fastDeliveryOnly)} />
                    <div className="text-sm text-gray-700">
                        <span className="font-bold text-blue-600 italic">Fast</span> Delivery
                    </div>
                </label>
            </div>

            {/* Subcategories */}
            {availableSubcats.length > 0 && (
                <FilterSection title="Subcategory">
                    {availableSubcats.map((sub: any) => (
                        <label key={sub} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSubcats.includes(sub) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                                {selectedSubcats.includes(sub) && <Check size={10} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={selectedSubcats.includes(sub)} onChange={() => toggleFilter(sub, selectedSubcats, setSelectedSubcats)} />
                            <span className={`text-sm ${selectedSubcats.includes(sub) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{sub}</span>
                        </label>
                    ))}
                </FilterSection>
            )}

            {/* Brands */}
            {availableBrands.length > 0 && (
                <FilterSection title="Brands">
                    {availableBrands.map((brand: any) => (
                        <label key={brand} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(brand) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                                {selectedBrands.includes(brand) && <Check size={10} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={selectedBrands.includes(brand)} onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)} />
                            <span className={`text-sm ${selectedBrands.includes(brand) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{brand}</span>
                        </label>
                    ))}
                </FilterSection>
            )}

            {/* Dynamic Specs */}
            {availableSpecs.map((specGroup: any) => (
                <FilterSection key={specGroup.key} title={specGroup.key} defaultOpen={false}>
                    {specGroup.values.map((val: string) => {
                        const isChecked = selectedSpecs[specGroup.key]?.includes(val);
                        return (
                            <label key={val} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                                    {isChecked && <Check size={10} className="text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={isChecked || false} onChange={() => toggleSpec(specGroup.key, val)} />
                                <span className={`text-sm ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{val}</span>
                            </label>
                        );
                    })}
                </FilterSection>
            ))}
          </>
      )}
      
      {/* 3. PRICE (Always visible) */}
      <FilterSection title="Price">
        <div className="space-y-1">
          <div className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setSelectedPrice(null)}>
             <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedPrice === null ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  {selectedPrice === null && <div className="w-2 h-2 rounded-full bg-blue-600" />}
             </div>
             <span className={`text-sm ${selectedPrice === null ? 'font-bold text-blue-600' : 'text-gray-600'}`}>Any Price</span>
          </div>

          {PRICE_RANGES.map((range, index) => (
            <div key={index} className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setSelectedPrice(range)}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedPrice?.label === range.label ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                    {selectedPrice?.label === range.label && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <span className={`text-sm ${selectedPrice?.label === range.label ? 'font-bold text-blue-600' : 'text-gray-600'}`}>{range.label}</span>
            </div>
          ))}
        </div>
      </FilterSection>

    </div>
  );

  return (
    <div className="container mx-auto px-4 pt-8 pb-24 min-h-screen">
      
      {/* MOBILE FILTER TOGGLE */}
      <div className="lg:hidden mb-6 flex gap-3 sticky top-[72px] z-30 bg-white/80 backdrop-blur-md py-3 border-b border-gray-100">
        <button 
          onClick={() => setShowMobileFilters(true)}
          className="flex-1 bg-gray-900 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md active:scale-95 transition-transform"
        >
          <SlidersHorizontal size={18} /> Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* SIDEBAR */}
        <aside className="hidden lg:block w-64 space-y-8 h-fit sticky top-24 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-xl font-bold">Filters</h2>
             {(selectedCategory !== 'All' || selectedSubcats.length > 0 || selectedBrands.length > 0 || selectedPrice || Object.keys(selectedSpecs).length > 0 || fastDeliveryOnly) && (
                 <button onClick={resetAllFilters} className="text-xs text-red-500 font-bold hover:underline">Clear All</button>
             )}
          </div>
          <div className="h-px bg-gray-200 w-full mb-6" />
          <FilterContent />
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
                    {selectedCategory === 'All' ? 'All Products' : selectedCategory}
                </h1>
                <p className="text-gray-500 text-sm">
                    {filteredProducts.length} results found
                </p>
            </div>
            
            {searchTerm && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 self-start md:self-auto">
                    <span>Search: "{searchTerm}"</span>
                    <button onClick={clearSearch} className="hover:text-blue-900"><X size={14}/></button>
                </div>
            )}
          </div>

          {loading ? (
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
               {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>)}
             </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
              <p className="text-gray-500 mt-2">Try clearing filters or changing your search.</p>
              
              {suggestion && (
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

      {/* MOBILE DRAWER */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-safe h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 border-b pb-4">
              <h2 className="text-2xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <FilterContent />
            </div>

            <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t border-gray-100 flex gap-3">
              <button onClick={resetAllFilters} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Reset</button>
              <button onClick={() => setShowMobileFilters(false)} className="flex-[2] bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                View {filteredProducts.length} Items
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Shop;