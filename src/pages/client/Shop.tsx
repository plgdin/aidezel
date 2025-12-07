import React, { useState, useEffect, useMemo } from 'react';
import {
  Filter,
  X,
  SlidersHorizontal,
  Search,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ProductCard, { Product } from '../../components/shared/ProductCard';
import FilterSection from '../../components/filters/FilterSection'; // <-- correct path

// Define strict type for Category to include the toggle
interface CategoryData {
  id: number;
  name: string;
  is_illuminated: boolean; // The toggle from Admin
  subcategories: any[];
}

const Shop = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]); // Store full category data

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // --- FILTER STATE ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>(
    {}
  );
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);

      // Fetch Categories with the new flag
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (cats) setCategories(cats as CategoryData[]);

      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

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
          tag:
            item.status === 'Out of Stock'
              ? 'Sold Out'
              : item.is_hero
              ? 'Featured'
              : 'New',
          stock_quantity: item.stock_quantity,
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

    if (catUrl) setSelectedCategory(decodeURIComponent(catUrl));
    else setSelectedCategory('All');

    if (searchUrl) setSearchTerm(searchUrl);
    else setSearchTerm('');
  }, [searchParams]);

  // --- CHECK IF CURRENT CATEGORY IS "HERO MODE" ---
  const isHeroMode = useMemo(() => {
    const currentCat = categories.find((c) => c.name === selectedCategory);
    return currentCat?.is_illuminated || false;
  }, [categories, selectedCategory]);

  // --- 3. DYNAMIC METADATA ---
  const { availableSubcats, availableBrands, availableSpecs } = useMemo(() => {
    let relevantProducts = allProducts;
    if (selectedCategory !== 'All') {
      relevantProducts = allProducts.filter(
        (p) => p.category === selectedCategory
      );
    }

    const productSubcats = Array.from(
      new Set(relevantProducts.map((p) => p.subcategory).filter(Boolean))
    );
    const catObj = categories.find((c) => c.name === selectedCategory);
    const dbSubcats = Array.isArray(catObj?.subcategories)
      ? catObj?.subcategories.map((s: any) =>
          typeof s === 'string' ? s : s.name
        )
      : [];

    const subcats = Array.from(new Set([...productSubcats, ...dbSubcats]));
    const brands = Array.from(
      new Set(relevantProducts.map((p) => p.brand).filter(Boolean))
    );

    const specsMap: Record<string, Set<string>> = {};
    relevantProducts.forEach((p: any) => {
      if (p.specs) {
        Object.entries(p.specs).forEach(([key, val]) => {
          if (!specsMap[key]) specsMap[key] = new Set();
          specsMap[key].add(String(val));
        });
      }
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

  // --- 4. MASTER FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSubcat =
        selectedSubcats.length === 0 ||
        (product.subcategory && selectedSubcats.includes(product.subcategory));
      const matchesBrand =
        selectedBrands.length === 0 ||
        (product.brand && selectedBrands.includes(product.brand));

      const matchesSpecs = Object.entries(selectedSpecs).every(
        ([key, values]) => {
          if (values.length === 0) return true;
          return (
            product.specs &&
            product.specs[key] &&
            values.includes(product.specs[key])
          );
        }
      );

      const matchesDelivery = fastDeliveryOnly
        ? product.tag !== 'Sold Out'
        : true;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        (product.category &&
          product.category.toLowerCase().includes(searchLower)) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower));

      return (
        matchesCategory &&
        matchesSubcat &&
        matchesBrand &&
        matchesSpecs &&
        matchesDelivery &&
        matchesSearch
      );
    });
  }, [
    allProducts,
    selectedCategory,
    selectedSubcats,
    selectedBrands,
    selectedSpecs,
    fastDeliveryOnly,
    searchTerm,
  ]);

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

  const toggleSubcat = (sub: string) => {
    if (selectedSubcats.includes(sub))
      setSelectedSubcats((prev) => prev.filter((s) => s !== sub));
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

  // --- RENDER HELPERS (no hooks inside, just functions) ---

  const renderSubcategoryScroller = () => {
    if (
      selectedCategory === 'All' ||
      availableSubcats.length === 0 ||
      !isHeroMode
    )
      return null;

    const getSubImage = (subName: string) => {
      const catObj = categories.find((c) => c.name === selectedCategory);
      const subObj = Array.isArray(catObj?.subcategories)
        ? catObj?.subcategories.find(
            (s: any) => s.name === subName || s === subName
          )
        : null;

      if (subObj && typeof subObj === 'object' && subObj.image_url)
        return subObj.image_url;
      return 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=300&auto=format&fit=crop';
    };

    return (
      <div className="mb-10 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-lg text-gray-900">
            Explore {selectedCategory}
          </h3>
          {selectedSubcats.length > 0 && (
            <span
              className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full cursor-pointer"
              onClick={() => setSelectedSubcats([])}
            >
              Clear
            </span>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
          {availableSubcats.map((sub: any) => {
            const isSelected = selectedSubcats.includes(sub);
            return (
              <button
                key={sub}
                onClick={() => toggleSubcat(sub)}
                className={`relative min-w-[160px] h-[220px] rounded-3xl overflow-hidden group transition-all duration-300 snap-center ${
                  isSelected
                    ? 'ring-4 ring-offset-2 ring-[#fbbf24] ring-offset-black'
                    : 'hover:-translate-y-2'
                } hover:shadow-[0_0_25px_rgba(251,191,36,0.6)]`}
              >
                <img
                  src={getSubImage(sub)}
                  alt={sub}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity ${
                    isSelected
                      ? 'opacity-90'
                      : 'opacity-70 group-hover:opacity-60'
                  }`}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#fbbf24]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />

                <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                  <Lightbulb
                    size={24}
                    className={`mb-2 ${
                      isSelected || 'group-hover:text-[#fbbf24]'
                    } text-white/80 transition-colors`}
                  />
                  <span
                    className={`block font-bold text-xl leading-tight ${
                      isSelected || 'group-hover:text-[#fbbf24]'
                        ? 'text-white'
                        : 'text-white'
                    }`}
                  >
                    {sub}
                  </span>
                  {isSelected && (
                    <div className="mt-2 h-1 w-8 rounded-full bg-[#fbbf24]" />
                  )}
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
      {/* 1. CATEGORY LIST */}
      <div className="pb-6 border-b border-gray-100 mb-4">
        <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
          Department
        </h3>

        {selectedCategory === 'All' ? (
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.name)}
                className="flex items-center justify-between w-full text-left py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 rounded-lg transition-colors"
              >
                {cat.name}
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            ))}
          </div>
        ) : (
          // no horizontal slide here to avoid flicker
          <div>
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

      {/* 2. DYNAMIC FILTERS */}
      {selectedCategory !== 'All' && (
        <>
          <div className="pb-4 border-b border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-blue-50/50 transition-colors">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  fastDeliveryOnly
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 bg-white group-hover:border-blue-400'
                }`}
              >
                {fastDeliveryOnly && <Check size={12} className="text-white" />}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={fastDeliveryOnly}
                onChange={() => setFastDeliveryOnly(!fastDeliveryOnly)}
              />
              <div className="text-sm text-gray-700">
                <span className="font-bold text-blue-600 italic flex items-center gap-1">
                  <Zap size={12} fill="currentColor" /> Fast
                </span>{' '}
                Delivery
              </div>
            </label>
          </div>

          {/* ONLY SHOW SIDEBAR SUBCATS IF *NOT* HERO MODE */}
          {!isHeroMode && availableSubcats.length > 0 && (
            <FilterSection title="Subcategory">
              {availableSubcats.map((sub: any) => (
                <label
                  key={sub}
                  className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selectedSubcats.includes(sub)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 bg-white group-hover:border-blue-400'
                    }`}
                  >
                    {selectedSubcats.includes(sub) && (
                      <Check size={10} className="text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedSubcats.includes(sub)}
                    onChange={() => toggleSubcat(sub)}
                  />
                  <span
                    className={`text-sm ${
                      selectedSubcats.includes(sub)
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {sub}
                  </span>
                </label>
              ))}
            </FilterSection>
          )}

          {/* Brands */}
          {availableBrands.length > 0 && (
            <FilterSection title="Brands">
              {availableBrands.map((brand: any) => (
                <label
                  key={brand}
                  className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selectedBrands.includes(brand)
                        ? 'bg-gray-900 border-gray-900'
                        : 'border-gray-300 bg-white group-hover:border-gray-500'
                    }`}
                  >
                    {selectedBrands.includes(brand) && (
                      <Check size={10} className="text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedBrands.includes(brand)}
                    onChange={() =>
                      toggleFilter(brand, selectedBrands, setSelectedBrands)
                    }
                  />
                  <span
                    className={`text-sm ${
                      selectedBrands.includes(brand)
                        ? 'text-gray-900 font-bold'
                        : 'text-gray-600'
                    }`}
                  >
                    {brand}
                  </span>
                </label>
              ))}
            </FilterSection>
          )}

          {/* Dynamic Specs */}
          {availableSpecs.map((specGroup: any) => (
            <FilterSection
              key={specGroup.key}
              title={specGroup.key}
              defaultOpen={false}
            >
              {specGroup.values.map((val: string) => {
                const isChecked = selectedSpecs[specGroup.key]?.includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-gray-900 border-gray-900'
                          : 'border-gray-300 bg-white group-hover:border-gray-500'
                      }`}
                    >
                      {isChecked && (
                        <Check size={10} className="text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isChecked || false}
                      onChange={() => toggleSpec(specGroup.key, val)}
                    />
                    <span
                      className={`text-sm ${
                        isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}
                    >
                      {val}
                    </span>
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
    <div className="container mx-auto px-4 pt-8 pb-24 min-h-screen">
      {/* MOBILE TOGGLE */}
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
        <aside className="hidden lg:block w-64 space-y-8 h-fit sticky top-24 flex-shrink-0 animate-in fade-in-0 slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Filters</h2>
            {(selectedCategory !== 'All' ||
              selectedSubcats.length > 0 ||
              selectedBrands.length > 0 ||
              Object.keys(selectedSpecs).length > 0 ||
              fastDeliveryOnly) && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-red-500 font-bold hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="h-px bg-gray-200 w-full mb-6" />
          {renderFilterContent()}
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          {/* SUBCATEGORY HORIZONTAL HERO */}
          {renderSubcategoryScroller()}

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
                <button onClick={clearSearch} className="hover:text-blue-900">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 bg-gray-100 rounded-2xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-12 rounded-xl text-center border border-dashed border-gray-300 mt-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                No products found
              </h3>
              <p className="text-gray-500 mt-2">
                Try clearing filters or changing your search.
              </p>

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
                <button
                  onClick={resetAllFilters}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-safe h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 border-b pb-4">
              <h2 className="text-2xl font-bold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">{renderFilterContent()}</div>

            <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={resetAllFilters}
                className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-[2] bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg"
              >
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
