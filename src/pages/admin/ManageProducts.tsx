import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, ImageIcon, Sparkles } from 'lucide-react';

// Generator function
const generateAIDescription = (name: string, category: string, subcategory: string) => {
  return `Upgrade your lifestyle with the premium ${name}. \n\nPerfect for ${category} enthusiasts looking for ${subcategory}, this product combines industrial-grade durability with a sleek, modern aesthetic.\n\nKey Features:\n• Premium Build Quality\n• Easy to Install & Use\n• Designed for longevity\n• 1-Year Official Warranty`;
};

const ManageProducts = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form State
  const [newItem, setNewItem] = useState({
    name: '', price: '', category: '', subcategory: '', stock: '10', brand: 'Generic', description: '', image: null as File | null, is_hero: false
  });

  // Fetch Categories on Mount
  useEffect(() => {
    const fetchCats = async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data && data.length > 0) {
            setCategories(data);
            // Set default selections
            setNewItem(prev => ({ 
                ...prev, 
                category: data[0].name, 
                subcategory: data[0].subcategories[0] || '' 
            }));
        }
    };
    fetchCats();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.image || !newItem.name || !newItem.price) return alert("Please fill all required fields");
    setIsUploading(true);

    try {
      // 1. Upload Image
      const fileExt = newItem.image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, newItem.image);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);

      // 2. Insert Product
      const initialStock = parseInt(newItem.stock);
      const { error: dbError } = await supabase.from('products').insert([{
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        subcategory: newItem.subcategory,
        stock_quantity: initialStock,
        brand: newItem.brand,
        description: newItem.description,
        image_url: publicUrl,
        status: initialStock > 0 ? 'In Stock' : 'Out of Stock',
        is_hero: newItem.is_hero
      }]);

      if (dbError) throw dbError;
      
      alert("Product Added Successfully!");
      // Reset form
      setNewItem(prev => ({ ...prev, name: '', price: '', stock: '10', description: '', image: null }));

    } catch (error: any) {
      alert("Error: " + error.message);
    }
    setIsUploading(false);
  };

  // Helper to get subcategories for currently selected category
  const currentSubcategories = categories.find(c => c.name === newItem.category)?.subcategories || [];

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Product</h1>

      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200">
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
              <input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Product Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Price (£)</label><input type="number" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="0.00" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Initial Stock</label><input type="number" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Qty" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} required /></div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value, subcategory: '' })}>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sub-Category</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={newItem.subcategory} onChange={e => setNewItem({...newItem, subcategory: e.target.value})}>
                  <option value="">Select...</option>
                  {currentSubcategories.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>

            {/* Hero Toggle */}
            <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <input 
                    type="checkbox" 
                    id="hero-check" 
                    className="w-5 h-5 accent-yellow-500"
                    checked={newItem.is_hero}
                    onChange={e => setNewItem({...newItem, is_hero: e.target.checked})}
                />
                <label htmlFor="hero-check" className="text-sm font-bold text-yellow-800 cursor-pointer select-none">
                    Feature this product on Home Page (Hero Section)
                </label>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
              <textarea className="w-full p-3 border border-gray-300 rounded-lg h-32" placeholder="Description..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
              <button type="button" onClick={() => { if (!newItem.name) return alert("Enter name first"); setNewItem({ ...newItem, description: generateAIDescription(newItem.name, newItem.category, newItem.subcategory) }) }} className="absolute top-8 right-2 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-purple-200 font-bold"><Sparkles size={14} /> Auto-Gen</button>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            <label className="block text-sm font-bold text-gray-700">Product Image</label>
            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-6 bg-gray-50 relative hover:bg-gray-100 transition-colors">
              <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setNewItem({...newItem, image: e.target.files ? e.target.files[0] : null})} />
              {newItem.image ? <div className="text-center"><span className="text-green-700 font-bold text-sm block break-all">{newItem.image.name}</span></div> : <div className="text-center text-gray-400"><ImageIcon size={48} className="mx-auto mb-3 text-gray-300" /><p className="font-bold text-gray-500">Click to Upload</p></div>}
            </div>
            <button disabled={isUploading} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 shadow-lg active:scale-95">
              {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={20} />} {isUploading ? "Uploading..." : "Add Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ManageProducts;