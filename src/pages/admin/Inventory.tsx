import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCcw, Search, Edit, Trash2, Star, Save, X, Sparkles } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';

// --- AI Generator Helper ---
const generateAIDescription = (name: string, category: string, subcategory: string) => {
  return `Upgrade your lifestyle with the premium ${name}.
\n\nPerfect for ${category} enthusiasts looking for ${subcategory}, this product combines industrial-grade durability with a sleek, modern aesthetic.\n\nKey Features:\n• Premium Build Quality\n• Easy to Install & Use\n• Designed for longevity\n• 1-Year Official Warranty`;
};

const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Fetch Products & Categories
  const fetchData = async () => {
    setLoading(true);
    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: catData } = await supabase.from('categories').select('*');
    if (prodData) setProducts(prodData);
    if (catData) setCategories(catData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- TOGGLE HERO ---
  const toggleHero = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from('products').update({ is_hero: !currentStatus }).eq('id', id);
    if (!error) fetchData(); 
  };

  const updateStock = async (id: number, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    const status = newStock > 0 ? 'In Stock' : 'Out of Stock';
    setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: newStock, status } : p));
    await supabase.from('products').update({ stock_quantity: newStock, status }).eq('id', id);
  };

  // --- DELETE HANDLERS ---
  const confirmDelete = (id: number) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    
    await supabase.from('products').delete().eq('id', productToDelete);
    setProducts(products.filter(p => p.id !== productToDelete));
    
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleSaveChanges = async () => {
     if (!editingProduct) return;
     const { error } = await supabase.from('products').update({
       name: editingProduct.name,
       price: parseFloat(editingProduct.price),
       stock_quantity: parseInt(editingProduct.stock_quantity),
       description: editingProduct.description,
       category: editingProduct.category,
       subcategory: editingProduct.subcategory
     }).eq('id', editingProduct.id);

     if (!error) {
        setEditingProduct(null);
        fetchData();
     } else {
        alert(error.message);
     }
  };

  const currentSubcategories = editingProduct 
    ? categories.find(c => c.name === editingProduct.category)?.subcategories || [] 
    : [];

  return (
    <div className="max-w-7xl mx-auto pb-24">
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
         <h1 className="text-3xl font-bold text-gray-900">Current Inventory</h1>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search by name or category..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    value={searchTerm}
                    onChange={handleSearch}
                 />
             </div>
             <button onClick={fetchData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCcw size={20}/></button>
         </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
               <tr>
                 <th className="px-6 py-4">Hero</th>
                 <th className="px-6 py-4">Product</th>
                 <th className="px-6 py-4 text-center">Stock</th>
                 <th className="px-6 py-4">Price</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filteredProducts.map((p) => (
                 <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                   <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleHero(p.id, p.is_hero)}
                        className={`p-2 rounded-full transition-colors ${p.is_hero ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300 hover:text-yellow-400'}`}
                        title="Toggle Hero Slider"
                      >
                          <Star size={20} fill={p.is_hero ? "currentColor" : "none"} />
                      </button>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover mix-blend-multiply" />
                        </div>
                       <div>
                         <span className="font-bold text-gray-900 block line-clamp-1">{p.name}</span>
                         <span className="text-xs text-gray-400">{p.category}</span>
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
                       <button onClick={() => setEditingProduct(p)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                       <button onClick={() => confirmDelete(p.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>

       {/* --- EDIT MODAL --- */}
       {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="hover:bg-gray-200 p-1 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
               <div>
                 <label className="text-xs font-bold uppercase text-gray-500">Name</label>
                 <input className="w-full p-2 border rounded-lg" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}/>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold uppercase text-gray-500">Price</label>
                     <input type="number" className="w-full p-2 border rounded-lg" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}/>
                   </div>
                   <div>
                     <label className="text-xs font-bold uppercase text-gray-500">Stock</label>
                     <input type="number" className="w-full p-2 border rounded-lg" value={editingProduct.stock_quantity} onChange={e => setEditingProduct({...editingProduct, stock_quantity: e.target.value})}/>
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold uppercase text-gray-500">Category</label>
                     <select 
                       className="w-full p-2 border rounded-lg bg-white"
                       value={editingProduct.category} 
                       onChange={e => setEditingProduct({...editingProduct, category: e.target.value, subcategory: ''})}
                     >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-bold uppercase text-gray-500">Subcategory</label>
                     <select 
                       className="w-full p-2 border rounded-lg bg-white"
                       value={editingProduct.subcategory} 
                       onChange={e => setEditingProduct({...editingProduct, subcategory: e.target.value})}
                     >
                        <option value="">Select...</option>
                        {/* ✅ FIX APPLIED HERE: Handle objects correctly */}
                        {currentSubcategories.map((sub: any, idx: number) => {
                            const subName = typeof sub === 'string' ? sub : sub.name;
                            return (
                                <option key={idx} value={subName}>{subName}</option>
                            );
                        })}
                     </select>
                   </div>
               </div>

               <div className="relative">
                 <label className="text-xs font-bold uppercase text-gray-500">Description</label>
                 <textarea 
                   className="w-full p-2 border rounded-lg h-32 text-sm" 
                   value={editingProduct.description} 
                   onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                 />
                 
                 <button 
                   type="button" 
                   onClick={() => setEditingProduct({
                       ...editingProduct, 
                       description: generateAIDescription(editingProduct.name, editingProduct.category, editingProduct.subcategory || '')
                   })} 
                   className="absolute top-0 right-0 text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 font-bold transition-colors cursor-pointer"
                 >
                    <Sparkles size={12} /> Auto-Gen
                  </button>
               </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                <button onClick={() => setEditingProduct(null)} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
                <button onClick={handleSaveChanges} className="px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 flex items-center gap-2">
                    <Save size={16} /> Save Changes
                </button>
            </div>
          </div>
        </div>
       )}

       {/* --- CONFIRM DELETE MODAL --- */}
       <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Product?"
          message="This will permanently remove this item from your inventory. This action cannot be undone."
          confirmText="Delete Product"
          cancelText="Cancel"
          isDanger={true}
          onConfirm={executeDelete}
          onCancel={() => setShowDeleteModal(false)}
        />

    </div>
  );
};

export default Inventory;