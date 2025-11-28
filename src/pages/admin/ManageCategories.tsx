import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Save, Loader2, Tag } from 'lucide-react';

const ManageCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newSubMap, setNewSubMap] = useState<Record<number, string>>({}); // Track input for each category

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id');
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  // Add Main Category
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const { error } = await supabase.from('categories').insert({ name: newCatName, subcategories: [] });
    if (error) alert(error.message);
    else {
        setNewCatName('');
        fetchCategories();
    }
  };

  // Delete Main Category
  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  // Add Subcategory
  const addSubcategory = async (catId: number, currentSubs: string[]) => {
    const val = newSubMap[catId];
    if (!val || !val.trim()) return;

    const updatedSubs = [...currentSubs, val.trim()];
    const { error } = await supabase.from('categories').update({ subcategories: updatedSubs }).eq('id', catId);
    
    if (error) alert(error.message);
    else {
        setNewSubMap({ ...newSubMap, [catId]: '' }); // Clear input
        fetchCategories();
    }
  };

  // Remove Subcategory
  const removeSubcategory = async (catId: number, currentSubs: string[], subToRemove: string) => {
    const updatedSubs = currentSubs.filter(s => s !== subToRemove);
    await supabase.from('categories').update({ subcategories: updatedSubs }).eq('id', catId);
    fetchCategories();
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Tag /> Category Management
      </h1>

      {/* Add New Category Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-end">
        <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">New Main Category Name</label>
            <input 
                className="w-full p-3 border border-gray-300 rounded-lg" 
                placeholder="e.g. Gaming, Furniture..." 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
            />
        </div>
        <button onClick={addCategory} className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 flex items-center gap-2 h-[50px]">
            <Plus size={18} /> Add
        </button>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{cat.name}</h3>
                    <button onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                </div>
                <div className="p-4 space-y-4">
                    {/* Subcategories List */}
                    <div className="flex flex-wrap gap-2">
                        {cat.subcategories && cat.subcategories.length > 0 ? (
                            cat.subcategories.map((sub: string, idx: number) => (
                                <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    {sub}
                                    <button onClick={() => removeSubcategory(cat.id, cat.subcategories, sub)} className="hover:text-blue-900"><Trash2 size={10}/></button>
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-gray-400 italic">No subcategories yet.</span>
                        )}
                    </div>

                    {/* Add Subcategory Input */}
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 p-2 text-sm border border-gray-200 rounded-lg"
                            placeholder="New Subcategory..."
                            value={newSubMap[cat.id] || ''}
                            onChange={e => setNewSubMap({...newSubMap, [cat.id]: e.target.value})}
                        />
                        <button onClick={() => addSubcategory(cat.id, cat.subcategories || [])} className="bg-gray-100 text-gray-700 px-3 rounded-lg hover:bg-gray-200">
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ManageCategories;