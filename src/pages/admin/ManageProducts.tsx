import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Loader2, ImageIcon, Sparkles, Edit, Trash2, X, Save, ListPlus, TableProperties, MinusCircle } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';

const generateAIDescription = (name: string, category: string, subcategory: string) => {
  return `Upgrade your lifestyle with the premium ${name}. \n\nPerfect for ${category} enthusiasts looking for ${subcategory}, this product combines industrial-grade durability with a sleek, modern aesthetic.\n\nKey Features:\n• Premium Build Quality\n• Easy to Install & Use\n• Designed for longevity\n• 1-Year Official Warranty`;
};

const ManageProducts = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Form State
  const [newItem, setNewItem] = useState({
    name: '', price: '', category: '', subcategory: '', stock: '10', brand: 'Aidezel', description: '', 
    imageFile: null as File | null, 
    imageUrl: '', 
    is_hero: false
  });

  // Dynamic Lists State
  const [features, setFeatures] = useState<string[]>(['']);
  const [specs, setSpecs] = useState<{key: string, value: string}[]>([{key: '', value: ''}]);

  // 1. Fetch Categories & Products
  const fetchData = async () => {
    const { data: cats } = await supabase.from('categories').select('*');
    if (cats) setCategories(cats);

    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prods) setProducts(prods);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handle Edit Click
  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setNewItem({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        subcategory: product.subcategory || '',
        stock: product.stock_quantity.toString(),
        brand: product.brand || 'Aidezel',
        description: product.description || '',
        imageFile: null,
        imageUrl: product.image_url,
        is_hero: product.is_hero || false
    });

    setFeatures(product.features && product.features.length > 0 ? product.features : ['']);
    
    if (product.specs && Object.keys(product.specs).length > 0) {
        const specArray = Object.entries(product.specs).map(([key, value]) => ({ key, value: String(value) }));
        setSpecs(specArray);
    } else {
        setSpecs([{key: '', value: ''}]);
    }

    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 3. Reset Form
  const resetForm = () => {
    setEditingId(null);
    setNewItem({ name: '', price: '', category: categories[0]?.name || '', subcategory: '', stock: '10', brand: 'Aidezel', description: '', imageFile: null, imageUrl: '', is_hero: false });
    setFeatures(['']);
    setSpecs([{key: '', value: ''}]);
  };

  // --- NEW DELETE HANDLERS ---
  const confirmDelete = (id: number) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', productToDelete);
    
    if (error) {
        alert(error.message);
    } else {
        fetchData();
    }
    
    setIsDeleting(false);
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  // --- FEATURE & SPEC HANDLERS ---
  const updateFeature = (idx: number, val: string) => {
    const newFeatures = [...features];
    newFeatures[idx] = val;
    setFeatures(newFeatures);
  };
  const addFeature = () => setFeatures([...features, '']);
  const removeFeature = (idx: number) => setFeatures(features.filter((_, i) => i !== idx));

  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...specs];
    newSpecs[idx][field] = val;
    setSpecs(newSpecs);
  };
  const addSpec = () => setSpecs([...specs, {key: '', value: ''}]);
  const removeSpec = (idx: number) => setSpecs(specs.filter((_, i) => i !== idx));


  // 5. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return alert("Please fill name and price");
    
    setIsUploading(true);

    try {
      let finalImageUrl = newItem.imageUrl;

      if (newItem.imageFile) {
        const fileExt = newItem.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, newItem.imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      const specsObject = specs.reduce((acc, curr) => {
        if (curr.key.trim() && curr.value.trim()) acc[curr.key] = curr.value;
        return acc;
      }, {} as any);

      const cleanFeatures = features.filter(f => f.trim() !== '');

      const productData = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        subcategory: newItem.subcategory,
        stock_quantity: parseInt(newItem.stock),
        brand: newItem.brand,
        description: newItem.description,
        image_url: finalImageUrl,
        status: parseInt(newItem.stock) > 0 ? 'In Stock' : 'Out of Stock',
        is_hero: newItem.is_hero,
        features: cleanFeatures, 
        specs: specsObject       
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
        alert("Product Updated!");
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        alert("Product Added!");
      }

      resetForm();
      fetchData();

    } catch (error: any) {
      alert("Error: " + error.message);
    }
    setIsUploading(false);
  };

  // --- FIXED: Safe Subcategory Logic ---
  const getSubcategories = () => {
    const categoryObj = categories.find(c => c.name === newItem.category);
    // Ensure it's an array before returning, otherwise return empty array
    if (categoryObj && Array.isArray(categoryObj.subcategories)) {
        return categoryObj.subcategories;
    }
    return [];
  };

  const currentSubcategories = getSubcategories();

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4" ref={formRef}>
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
            {editingId ? 'Edit Product' : 'Add New Product'}
        </h1>
        {editingId && (
            <button onClick={resetForm} className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                <X size={20} /> Cancel Edit
            </button>
        )}
      </div>

      <div className={`p-6 lg:p-8 rounded-2xl shadow-sm border mb-12 transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: MAIN INFO */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                    <input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="e.g. Backline Brass Mixer Tap" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                </div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Price (£)</label><input type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Stock</label><input type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} required /></div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value, subcategory: '' })}>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sub-Category</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={newItem.subcategory} onChange={e => setNewItem({...newItem, subcategory: e.target.value})}>
                  <option value="">Select...</option>
                  {/* Safely map subcategories to handle both strings and objects */}
                  {currentSubcategories.map((sub: any, index: number) => {
                      const subName = typeof sub === 'object' && sub !== null ? sub.name : sub;
                      return (
                          <option key={index} value={subName}>
                              {subName}
                          </option>
                      );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Brand Name</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Aidezel" value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})} />
              </div>
            </div>

            {/* FEATURES BUILDER */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><ListPlus size={18}/> About this item (Bullet Points)</label>
                    <button type="button" onClick={addFeature} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold hover:bg-blue-200">+ Add Line</button>
                </div>
                <div className="space-y-2">
                    {features.map((feat, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                className="flex-1 p-2 border border-gray-300 rounded text-sm" 
                                placeholder="e.g. Premium Build Quality"
                                value={feat}
                                onChange={(e) => updateFeature(idx, e.target.value)}
                            />
                            <button type="button" onClick={() => removeFeature(idx)} className="text-red-400 hover:text-red-600"><MinusCircle size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SPECS BUILDER */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><TableProperties size={18}/> Technical Details</label>
                    <button type="button" onClick={addSpec} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold hover:bg-blue-200">+ Add Spec</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {specs.map((spec, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input 
                                className="w-1/3 p-2 border border-gray-300 rounded text-sm font-bold bg-white" 
                                placeholder="Label (e.g. Color)"
                                value={spec.key}
                                onChange={(e) => updateSpec(idx, 'key', e.target.value)}
                            />
                            <input 
                                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white" 
                                placeholder="Value (e.g. Black)"
                                value={spec.value}
                                onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                            />
                            <button type="button" onClick={() => removeSpec(idx)} className="text-red-400 hover:text-red-600"><MinusCircle size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Description</label>
              <textarea className="w-full p-3 border border-gray-300 rounded-lg h-32" placeholder="Write a detailed description..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
              <button type="button" onClick={() => { if (!newItem.name) return alert("Enter name first"); setNewItem({ ...newItem, description: generateAIDescription(newItem.name, newItem.category, newItem.subcategory) }) }} className="absolute top-8 right-2 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-purple-200 font-bold"><Sparkles size={14} /> Auto-Gen</button>
            </div>
          </div>

          {/* RIGHT: IMAGE & SUBMIT */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>
                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-6 bg-gray-50 relative hover:bg-gray-100 transition-colors overflow-hidden">
                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => setNewItem({...newItem, imageFile: e.target.files ? e.target.files[0] : null})} />
                
                {newItem.imageFile ? (
                    <div className="text-center relative z-0">
                        <span className="text-green-700 font-bold text-sm block break-all mb-2">Selected:</span>
                        <p className="text-xs text-gray-500">{newItem.imageFile.name}</p>
                    </div>
                ) : newItem.imageUrl ? (
                    <div className="w-full h-full relative z-0">
                        <img src={newItem.imageUrl} alt="Current" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold opacity-0 hover:opacity-100 transition-opacity pointer-events-none">Click to Change</div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 relative z-0">
                        <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="font-bold text-gray-500">Click to Upload</p>
                    </div>
                )}
                </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <input type="checkbox" id="hero-check" className="w-5 h-5 accent-blue-600" checked={newItem.is_hero} onChange={e => setNewItem({...newItem, is_hero: e.target.checked})}/>
                <label htmlFor="hero-check" className="text-sm font-bold text-gray-800 cursor-pointer select-none">Feature on Home Page</label>
            </div>
            
            <button disabled={isUploading} className={`w-full text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-colors ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}>
              {isUploading ? <Loader2 className="animate-spin" /> : editingId ? <Save size={20}/> : <Plus size={20} />} 
              {isUploading ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
            </button>
          </div>

        </form>
      </div>

      {/* --- PRODUCT LIST --- */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Inventory</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Image</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Brand</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(prod => (
                            <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={prod.image_url} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-900">{prod.name}</td>
                                <td className="px-6 py-3 font-bold">£{prod.price}</td>
                                <td className="px-6 py-3">{prod.stock_quantity}</td>
                                <td className="px-6 py-3">{prod.brand}</td>
                                <td className="px-6 py-3 text-right space-x-2">
                                    <button onClick={() => handleEditClick(prod)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="Edit"><Edit size={18} /></button>
                                    <button onClick={() => confirmDelete(prod.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg" title="Delete"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- CONFIRM DELETE MODAL --- */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Product?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Keep it"
        isDanger={true}
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

    </div>
  );
};

export default ManageProducts;