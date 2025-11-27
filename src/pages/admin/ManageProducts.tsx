import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Loader2, Image as ImageIcon, Sparkles, RefreshCcw, Edit, X, Save } from 'lucide-react';

// --- Configuration ---
const CATEGORIES: Record<string, string[]> = {
  "Lighting": ["Indoor Lights", "Outdoor Lights", "Ceiling Lights", "Smart Lights", "Decorative Lights"],
  "Jewellery": ["Necklaces", "Bracelets", "Earrings", "Rings", "Pendants"],
  "Home & Kitchen": ["Kitchen Taps", "Home Decor", "Bathroom Fixtures", "Storage", "Cookware"]
};

// Mock AI Generator
const generateAIDescription = (name: string, category: string, subcategory: string) => {
  return `Upgrade your lifestyle with the premium ${name}. \n\nPerfect for ${category} enthusiasts looking for ${subcategory}, this product combines industrial-grade durability with a sleek, modern aesthetic.\n\nKey Features:\n• Premium Build Quality\n• Easy to Install & Use\n• Designed for longevity\n• 1-Year Official Warranty`;
};

const ManageProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Edit Mode State
  const [editingProduct, setEditingProduct] = useState<any>(null); 

  // Form State (Add New)
  const [newItem, setNewItem] = useState({
    name: '', price: '', category: 'Lighting', subcategory: 'Indoor Lights', stock: '10', brand: 'Generic', description: '', image: null as File | null
  });

  // 1. Fetch Products
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching:', error);
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  // 2. Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.image || !newItem.name || !newItem.price) return alert("Please fill all required fields");
    setIsUploading(true);

    try {
      const fileExt = newItem.image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, newItem.image);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);

      const initialStock = parseInt(newItem.stock);
      const status = initialStock > 0 ? 'In Stock' : 'Out of Stock';

      const { error: dbError } = await supabase.from('products').insert([{
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        subcategory: newItem.subcategory,
        stock_quantity: initialStock,
        brand: newItem.brand,
        description: newItem.description,
        image_url: publicUrl,
        status: status
      }]);

      if (dbError) throw dbError;
      
      alert("Product Added Successfully!");
      setNewItem({ name: '', price: '', category: 'Lighting', subcategory: 'Indoor Lights', stock: '10', brand: 'Generic', description: '', image: null });
      fetchProducts(); 
    } catch (error: any) {
      alert("Error: " + error.message);
    }
    setIsUploading(false);
  };

  // 3. Smart Stock Update (+ / - buttons)
  const updateStock = async (id: number, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    const status = newStock > 0 ? 'In Stock' : 'Out of Stock';
    
    const originalProducts = [...products];
    setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: newStock, status } : p));
    
    try {
      const { error } = await supabase.from('products').update({ stock_quantity: newStock, status }).eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      alert("Update Failed: " + error.message + "\nCheck database permissions.");
      setProducts(originalProducts);
    }
  };

  // 4. Save Edited Product
  const handleSaveChanges = async () => {
    if (!editingProduct) return;
    
    try {
      const newStock = parseInt(editingProduct.stock_quantity);
      const status = newStock > 0 ? 'In Stock' : 'Out of Stock';

      const { error } = await supabase.from('products').update({
        name: editingProduct.name,
        price: parseFloat(editingProduct.price),
        brand: editingProduct.brand,
        stock_quantity: newStock,
        status: status,
        description: editingProduct.description
      }).eq('id', editingProduct.id);

      if (error) throw error;
      
      alert("Product Updated Successfully!");
      setEditingProduct(null); 
      fetchProducts(); 
    } catch (error: any) {
      alert("Error updating: " + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this product permanently?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Inventory</h1>
        <button onClick={fetchProducts} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><RefreshCcw size={20}/></button>
      </div>

      {/* --- ADD PRODUCT FORM --- */}
      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">1</span>
          Add New Product
        </h2>
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
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value, subcategory: CATEGORIES[e.target.value][0] })}>
                  {Object.keys(CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sub-Category</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={newItem.subcategory} onChange={e => setNewItem({...newItem, subcategory: e.target.value})}>
                  {CATEGORIES[newItem.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Brand</label><input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Brand" value={newItem.brand} onChange={e => setNewItem({...newItem, brand: e.target.value})} /></div>
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

      {/* --- INVENTORY TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold flex items-center gap-2"><span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm">2</span>Current Inventory</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-lg bg-gray-100 border border-gray-200" />
                      <div>
                        <span className="font-bold text-gray-900 block line-clamp-1">{p.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${p.stock_quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {p.stock_quantity === 0 ? 'Out of Stock' : 'In Stock'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3 bg-gray-100 w-fit mx-auto px-2 py-1 rounded-lg">
                      <button onClick={() => updateStock(p.id, p.stock_quantity, -1)} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center hover:text-red-600 font-bold">-</button>
                      <span className={`font-mono font-bold w-8 text-center ${p.stock_quantity === 0 ? 'text-red-600' : 'text-gray-800'}`}>{p.stock_quantity}</span>
                      <button onClick={() => updateStock(p.id, p.stock_quantity, 1)} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center hover:text-green-600 font-bold">+</button>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">£{p.price}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingProduct(p)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg" title="Edit Details"><Edit size={18}/></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- EDIT MODAL (POPUP) --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Edit Product Details</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Editable Fields */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Price (£)</label>
                  <input type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Stock</label>
                  <input type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={editingProduct.stock_quantity} onChange={e => setEditingProduct({...editingProduct, stock_quantity: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Brand</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" value={editingProduct.brand} onChange={e => setEditingProduct({...editingProduct, brand: e.target.value})} />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                <textarea className="w-full p-3 border border-gray-300 rounded-lg h-32" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                {/* AI AUTO-GEN BUTTON FOR EDIT MODE */}
                <button 
                  type="button" 
                  onClick={() => setEditingProduct({
                    ...editingProduct,
                    description: generateAIDescription(editingProduct.name, editingProduct.category, editingProduct.subcategory)
                  })} 
                  className="absolute top-0 right-0 mt-1 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 font-bold"
                >
                  <Sparkles size={12} /> Auto-Gen
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-600 font-medium hover:text-black">Cancel</button>
              
              {/* SAVE BUTTON */}
              <button onClick={handleSaveChanges} className="px-6 py-2 bg-black text-white rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageProducts;