import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  Search,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Lightbulb,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';
// SEO: Import Helmet
import { Helmet } from 'react-helmet-async';

// FIX: Cast Helmet to 'any' to resolve the TypeScript error
const SeoHelmet = Helmet as any;

// --- CONFIGURATION ---

const ALLOWED_FILTERS = [
  // --- General (Applies to almost everything) ---
  'Brand', 
  'Color', 
  'Material', 
  'Style', 
  'Type', 
  
  // --- Furniture & Hardware ---
  'Finish',          // e.g., Matte, Gloss, Oak
  'Shape',           // e.g., Round, Rectangular
  'Assembly',        // e.g., Pre-assembled, DIY
  'Seating Capacity',// e.g., 2 Seater, 4 Seater
  'Room',            // e.g., Living Room, Bedroom
  'Dimensions',      // e.g., Large, Compact
  
  // --- Lighting Specific ---
  'Light Source',    // e.g., LED, Bulb
  'Power Source',    // e.g., Battery, Plug-in
  
  // --- Dressing / Clothing / Fabrics ---
  'Size',            // e.g., S, M, L, XL, UK 10
  'Gender',          // e.g., Men, Women, Unisex
  'Pattern',         // e.g., Solid, Striped, Floral
  'Fit',             // e.g., Slim, Regular, Oversized
  'Fabric',          // e.g., Cotton, Silk (Sometimes separate from Material)
  'Sleeve Length',   // e.g., Long Sleeve, Short Sleeve
  'Neckline',        // e.g., V-Neck, Round
  'Occasion'         // e.g., Casual, Formal, Party
];

const SUBCAT_IMAGES: Record<string, string> = {
  'Indoor Lights': 'https://images.unsplash.com/photo-1513506003013-194a5d68d878?q=80&w=300&auto=format&fit=crop',
  'Smart Lights': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=300&auto=format&fit=crop',
  'Decoration Lights': 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop',
  'Outdoor Lights': 'https://images.unsplash.com/photo-1517850541248-3482597402dc?q=80&w=300&auto=format&fit=crop',
  'Ceiling Lights': 'https://images.unsplash.com/photo-1513506003013-194a5d68d878?q=80&w=300&auto=format&fit=crop',
  'Rings': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=300&auto=format&fit=crop',
  'Necklaces': 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=300&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=300&auto=format&fit=crop'
};

interface CategoryData {
  id: number;
  name: string;
  is_illuminated: boolean;
  subcategories: any[];
}

// ✅ HELPER: Robust Standardization
const standardizeValue = (val: string): string => {
  if (!val || typeof val !== 'string') return '';
  const parts = val.split(/[\+\/&,]+/).map(p => p.trim());
  const formattedParts = parts.map(p => {
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }).sort();
  return formattedParts.join(' + ');
};

// ✅ HELPER: Fuzzy Key Matcher
const findMatchingKey = (obj: any, targetKey: string) => {
  if (!obj) return null;
  return Object.keys(obj).find(k => {
    const cleanK = k.toLowerCase().trim().replace(/s$/, ''); 
    const cleanTarget = targetKey.toLowerCase().trim().replace(/s$/, '');
    return cleanK === cleanTarget;
  });
};

const FilterSection = ({ title, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
      <div className="border-b border-gray-100 py-5">
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full mb-3 group">
              <span className="font-bold text-sm text-gray-900 uppercase tracking-wide group-hover:text-blue-600 transition-colors">{title}</span>
              {isOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
          </button>
          {isOpen && <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">{children}</div>}
      </div>
  );
};

const Shop = () => {
  const [allProducts, setAllProducts] = useState<(Product & { options: any[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]); 

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      if (cats) setCategories(cats as CategoryData[]);

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
          options: item.options || [],
          tag: item.status === 'Out of Stock' ? 'Sold Out' : item.is_hero ? 'Featured' : 'New',
          stock_quantity: item.stock_quantity,
        }));
        setAllProducts(formatted);
      }
      setLoading(false);
    };
    initData();
  }, []);

  useEffect(() => {
    const catUrl = searchParams.get('category');
    const searchUrl = searchParams.get('search');
    if (catUrl) setSelectedCategory(decodeURIComponent(catUrl));
    else setSelectedCategory('All');
    if (searchUrl) setSearchTerm(searchUrl);
    else setSearchTerm('');
  }, [searchParams]);

  const isHeroMode = useMemo(() => {
    const currentCat = categories.find((c) => c.name === selectedCategory);
    return currentCat?.is_illuminated || false;
  }, [categories, selectedCategory]);

  const { availableSubcats, availableBrands, availableSpecs } = useMemo(() => {
    let relevantProducts = allProducts;
    if (selectedCategory !== 'All') {
      relevantProducts = allProducts.filter((p) => p.category === selectedCategory);
    }

    const productSubcats = Array.from(new Set(relevantProducts.map((p) => p.subcategory).filter(Boolean)));
    const catObj = categories.find((c) => c.name === selectedCategory);
    const dbSubcats = Array.isArray(catObj?.subcategories)
      ? catObj?.subcategories.map((s: any) => typeof s === 'string' ? s : s.name)
      : [];
    const subcats = Array.from(new Set([...productSubcats, ...dbSubcats]));

    const brands = Array.from(new Set(relevantProducts.map((p) => p.brand).filter(Boolean)));

    const specsMap: Record<string, Set<string>> = {};
    
    relevantProducts.forEach((p: any) => {
      ALLOWED_FILTERS.forEach((allowedKey) => {
        let valuesFound: string[] = [];

        if (Array.isArray(p.options)) {
          const variantGroup = p.options.find((o: any) => o.name.toLowerCase() === allowedKey.toLowerCase());
          if (variantGroup && Array.isArray(variantGroup.values)) {
             valuesFound = variantGroup.values;
          }
        }

        if (valuesFound.length === 0 && p.specs) {
           const specKey = findMatchingKey(p.specs, allowedKey);
           if (specKey && p.specs[specKey]) {
             valuesFound = [String(p.specs[specKey])];
           }
        }

        if (valuesFound.length > 0) {
           if (!specsMap[allowedKey]) specsMap[allowedKey] = new Set();
           valuesFound.forEach(v => specsMap[allowedKey].add(standardizeValue(v)));
        }
      });
    });

    const specsArray = Object.entries(specsMap)
      .map(([key, values]) => ({
        key,
        values: Array.from(values).sort(),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    return {
      availableSubcats: subcats.sort(),
      availableBrands: brands.sort(),
      availableSpecs: specsArray,
    };
  }, [selectedCategory, allProducts, categories]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) => {
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
      if (selectedSubcats.length > 0 && (!product.subcategory || !selectedSubcats.includes(product.subcategory))) return false;
      if (selectedBrands.length > 0 && (!product.brand || !selectedBrands.includes(product.brand))) return false;

      const matchesSpecs = Object.entries(selectedSpecs).every(([filterKey, selectedValues]) => {
        if (selectedValues.length === 0) return true;
        
        let productValues: string[] = [];

        if (Array.isArray(product.options)) {
            const variantGroup = product.options.find((o: any) => o.name.toLowerCase() === filterKey.toLowerCase());
            if (variantGroup && Array.isArray(variantGroup.values)) {
                productValues = variantGroup.values.map((v: string) => standardizeValue(v));
            }
        }

        if (productValues.length === 0 && product.specs) {
            const specKey = findMatchingKey(product.specs, filterKey);
            if (specKey && product.specs[specKey]) {
                productValues = [standardizeValue(String(product.specs[specKey]))];
            }
        }

        let hasMatch = productValues.some(val => selectedValues.includes(val));

        if (!hasMatch) {
            const titleLower = product.name.toLowerCase();
            const descriptionLower = (product.description || "").toLowerCase();
            
            hasMatch = selectedValues.some(sv => {
                const parts = sv.toLowerCase().split(' + ');
                return parts.every(part => titleLower.includes(part) || descriptionLower.includes(part));
            });
        }

        return hasMatch;
      });

      if (!matchesSpecs) return false;
      if (fastDeliveryOnly && product.tag === 'Sold Out') return false;

      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(lowerTerm);
        const matchesCat = product.category?.toLowerCase().includes(lowerTerm);
        const matchesBrand = product.brand?.toLowerCase().includes(lowerTerm);
        if (!matchesName && !matchesCat && !matchesBrand) return false;
      }

      return true;
    });
  }, [allProducts, selectedCategory, selectedSubcats, selectedBrands, selectedSpecs, fastDeliveryOnly, searchTerm]);

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

  const toggleSubcat = (sub: string) => {
    if (selectedSubcats.includes(sub)) setSelectedSubcats((prev) => prev.filter((s) => s !== sub));
    else setSelectedSubcats((prev) => [...prev, sub]);
  };

  const toggleFilter = (item: string, list: string[], setList: Function) => {
    if (list.includes(item)) setList(list.filter((i: string) => i !== item));
    else setList([...list, item]);
  };

  const toggleSpec = (key: string, value: string) => {
    setSelectedSpecs((prev) => {
      const currentValues = prev[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
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

  // --- SEO DYNAMIC LOGIC ---
  const pageTitle = useMemo(() => {
    if (searchTerm) return `Search Results for "${searchTerm}" | Aidezel UK`;
    if (selectedCategory && selectedCategory !== 'All') return `Shop ${selectedCategory} | Aidezel UK`;
    return 'Shop Premium Lighting, Fashion & Home | Aidezel UK';
  }, [selectedCategory, searchTerm]);

  const metaDescription = useMemo(() => {
    if (searchTerm) return `Explore search results for ${searchTerm} at Aidezel. Find the best deals on lighting, fashion, and home decor.`;
    if (selectedCategory && selectedCategory !== 'All') return `Discover our exclusive collection of ${selectedCategory} at Aidezel UK. High quality, fast delivery, and great prices.`;
    return 'Browse our full catalog of premium lighting, fashion, furniture, and home appliances. Shop online at Aidezel UK for fast delivery.';
  }, [selectedCategory, searchTerm]);

  const currentUrl = useMemo(() => {
    const baseUrl = 'https://aidezel.com/shop';
    if (selectedCategory !== 'All') return `${baseUrl}?category=${encodeURIComponent(selectedCategory)}`;
    return baseUrl;
  }, [selectedCategory]);

  const renderSubcategoryScroller = () => {
    if (selectedCategory === 'All' || availableSubcats.length === 0 || !isHeroMode) return null;
    const getSubImage = (subName: string) => {
      const catObj = categories.find((c) => c.name === selectedCategory);
      const subObj = Array.isArray(catObj?.subcategories)
        ? catObj?.subcategories.find((s: any) => s.name === subName || s === subName)
        : null;
      if (subObj && typeof subObj === 'object' && subObj.image_url) return subObj.image_url;
      return SUBCAT_IMAGES[subName] || SUBCAT_IMAGES['default'];
    };

    return (
      <div className="mb-10 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-lg text-gray-900">Explore {selectedCategory}</h3>
          {selectedSubcats.length > 0 && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full cursor-pointer" onClick={() => setSelectedSubcats([])}>Clear</span>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-4 scrollbar-hide snap-x">
          {availableSubcats.map((sub: any) => {
            const isSelected = selectedSubcats.includes(sub);
            return (
              <button key={sub} onClick={() => toggleSubcat(sub)} className={`relative min-w-[160px] h-[220px] rounded-3xl overflow-hidden group transition-all duration-300 snap-center ${isSelected ? 'ring-4 ring-offset-2 ring-[#fbbf24] ring-offset-black' : 'hover:-translate-y-2'} hover:shadow-[0_0_25px_rgba(251,191,36,0.6)]`}>
                <img src={getSubImage(sub)} alt={sub} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity ${isSelected ? 'opacity-90' : 'opacity-70 group-hover:opacity-60'}`} />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                  <Lightbulb size={24} className={`mb-2 ${isSelected || 'group-hover:text-[#fbbf24]'} text-white/80 transition-colors`} />
                  <span className={`block font-bold text-xl leading-tight text-white`}>{sub}</span>
                  {isSelected && <div className="mt-2 h-1 w-8 rounded-full bg-[#fbbf24]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFilterContent = () => (
    <div className="space-y-1 pr-2">
      <div className="pb-6 border-b border-gray-100 mb-4">
        <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">Department</h3>
        {selectedCategory === 'All' ? (
          <div className="space-y-1">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => handleCategoryChange(cat.name)} className="flex items-center justify-between w-full text-left py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                {cat.name} <ChevronRight size={14} className="text-gray-300" />
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => handleCategoryChange('All')} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 mb-3 transition-colors font-medium">
              <ChevronLeft size={14} /> All Departments
            </button>
            <div className="font-bold text-lg text-gray-900 px-3 border-l-4 border-blue-600 bg-blue-50/50 py-2 rounded-r-lg">{selectedCategory}</div>
          </div>
        )}
      </div>

      {selectedCategory !== 'All' && (
        <>
          <div className="pb-4 border-b border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-blue-50/50 transition-colors">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${fastDeliveryOnly ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                {fastDeliveryOnly && <Check size={12} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={fastDeliveryOnly} onChange={() => setFastDeliveryOnly(!fastDeliveryOnly)} />
              <div className="text-sm text-gray-700">
                <span className="font-bold text-blue-600 italic flex items-center gap-1"><Zap size={12} fill="currentColor" /> Fast</span> Delivery
              </div>
            </label>
          </div>

          {!isHeroMode && availableSubcats.length > 0 && (
            <FilterSection title="Subcategory">
              {availableSubcats.map((sub: any) => (
                <label key={sub} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSubcats.includes(sub) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}>
                    {selectedSubcats.includes(sub) && <Check size={10} className="text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={selectedSubcats.includes(sub)} onChange={() => toggleSubcat(sub)} />
                  <span className={`text-sm ${selectedSubcats.includes(sub) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{sub}</span>
                </label>
              ))}
            </FilterSection>
          )}

          {availableBrands.length > 0 && (
            <FilterSection title="Brands">
              {availableBrands.map((brand: any) => (
                <label key={brand} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedBrands.includes(brand) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white group-hover:border-gray-500'}`}>
                    {selectedBrands.includes(brand) && <Check size={10} className="text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={selectedBrands.includes(brand)} onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)} />
                  <span className={`text-sm ${selectedBrands.includes(brand) ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{brand}</span>
                </label>
              ))}
            </FilterSection>
          )}

          {availableSpecs.map((specGroup: any) => (
            <FilterSection key={specGroup.key} title={specGroup.key} defaultOpen={false}>
              {specGroup.values.map((val: string) => {
                const isChecked = selectedSpecs[specGroup.key]?.includes(val);
                return (
                  <label key={val} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white group-hover:border-gray-500'}`}>
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
    </div>
  );

  return (
    // FIX: Changed pt-8 to pt-0 lg:pt-8 to remove top gap on mobile
    <div className="container mx-auto px-4 pt-0 lg:pt-8 pb-24 min-h-screen">
      
      {/* --- SEO METADATA START --- */}
      <SeoHelmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={currentUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={currentUrl} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </SeoHelmet>
      {/* --- SEO METADATA END --- */}

      <div className="lg:hidden mb-6 flex gap-3 sticky top-[72px] z-30 bg-white/80 backdrop-blur-md py-3 border-b border-gray-100">
        <button onClick={() => setShowMobileFilters(true)} className="flex-1 bg-gray-900 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md active:scale-95 transition-transform">
          <SlidersHorizontal size={18} /> Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="hidden lg:block w-64 space-y-8 h-fit sticky top-24 flex-shrink-0 animate-in fade-in-0 slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Filters</h2>
            {(selectedCategory !== 'All' || selectedSubcats.length > 0 || selectedBrands.length > 0 || Object.keys(selectedSpecs).length > 0 || fastDeliveryOnly) && (
              <button onClick={resetAllFilters} className="text-xs text-red-500 font-bold hover:underline">Clear All</button>
            )}
          </div>
          <div className="h-px bg-gray-200 w-full mb-6" />
          {renderFilterContent()}
        </aside>

        <div className="flex-1">
          {renderSubcategoryScroller()}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">{selectedCategory === 'All' ? 'All Products' : selectedCategory}</h1>
              <p className="text-gray-500 text-sm">{filteredProducts.length} results found</p>
            </div>
            {searchTerm && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 self-start md:self-auto">
                <span>Search: "{searchTerm}"</span>
                <button onClick={clearSearch} className="hover:text-blue-900"><X size={14} /></button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="bg-gray-50 p-12 rounded-xl text-center border border-dashed border-gray-300 mt-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><Search size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800">No products found</h3>
              <p className="text-gray-500 mt-2">Try clearing filters or changing your search.</p>
              {suggestion && (
                <div className="mt-6 bg-gray-100 border border-gray-200 p-4 rounded-lg inline-block">
                  <p className="text-gray-600 text-sm mb-1">Did you mean?</p>
                  <button onClick={applySuggestion} className="text-lg font-bold text-blue-600 flex items-center gap-2 mx-auto hover:underline">{suggestion} <ArrowRight size={16} /></button>
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
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-safe h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 border-b pb-4">
              <h2 className="text-2xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderFilterContent()}</div>
            <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t border-gray-100 flex gap-3">
              <button onClick={resetAllFilters} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Reset</button>
              <button onClick={() => setShowMobileFilters(false)} className="flex-[2] bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg">View {filteredProducts.length} Items</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;