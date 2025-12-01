import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Loader2, Tag, ImageIcon, X, Edit, Save } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';

const ManageCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Create State
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newSubMap, setNewSubMap] = useState<Record<number, string>>({});

  // Edit State
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);

  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id');
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  // --- ACTIONS ---

  const addCategory = async () => {
    if (!newCatName.trim()) return alert("Category name is required");
    
    setUploading(true);
    try {
        let publicUrl = null;
        if (newCatImage) {
            const fileExt = newCatImage.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('category-images').upload(fileName, newCatImage);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('category-images').getPublicUrl(fileName);
            publicUrl = data.publicUrl;
        }

        const { error: dbError } = await supabase.from('categories').insert({ 
            name: newCatName, 
            subcategories: [],
            image_url: publicUrl 
        });

        if (dbError) throw dbError;

        setNewCatName('');
        setNewCatImage(null);
        fetchCategories();

    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  // --- NEW DELETE LOGIC ---
  const confirmDelete = (id: number) => {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;
    await supabase.from('categories').delete().eq('id', categoryToDelete);
    fetchCategories();
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const addSubcategory = async (catId: number, currentSubs: string[]) => {
    const val = newSubMap[catId];
    if (!val || !val.trim()) return;
    const updatedSubs = [...currentSubs, val.trim()];
    await supabase.from('categories').update({ subcategories: updatedSubs }).eq('id', catId);
    setNewSubMap({ ...newSubMap, [catId]: '' });
    fetchCategories();
  };

  const removeSubcategory = async (catId: number, currentSubs: string[], subToRemove: string) => {
    const updatedSubs = currentSubs.filter(s => s !== subToRemove);
    await supabase.from('categories').update({ subcategories: updatedSubs }).eq('id', catId);
    fetchCategories();
  };

  // --- EDIT LOGIC ---
  const startEditing = (cat: any) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditImage(null); 
  };

  const saveCategoryChanges = async () => {
    if (!editingCategory) return;
    setUploading(true);

    try {
        let imageUrl = editingCategory.image_url;

        // 1. Upload NEW image if selected
        if (editImage) {
            const fileExt = editImage.name.split('.').pop();
            const fileName = `updated_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('category-images').upload(fileName, editImage);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('category-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        // 2. Update Database
        const { error } = await supabase.from('categories')
            .update({ name: editName, image_url: imageUrl })
            .eq('id', editingCategory.id);

        if (error) throw error;

        setEditingCategory(null);
        fetchCategories();

    } catch (error: any) {
        alert("Error updating: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Tag /> Category Management
      </h1>

      {/* --- ADD NEW CATEGORY CARD --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-1">New Category Name</label>
            <input 
                className="w-full p-3 border border-gray-300 rounded-lg" 
                placeholder="e.g. Gaming" 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
            />
        </div>
        <div className="w-full md:w-auto">
            <label className="block text-sm font-bold text-gray-700 mb-1">Icon/Image</label>
            <div className="relative">
                <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    id="cat-img-upload"
                    onChange={e => setNewCatImage(e.target.files ? e.target.files[0] : null)}
                />
                <label 
                    htmlFor="cat-img-upload" 
                    className={`flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${newCatImage ? 'text-green-600 border-green-500 bg-green-50' : 'text-gray-500'}`}
                >
                    <ImageIcon size={20} />
                    <span className="text-sm font-medium max-w-[100px] truncate">
                        {newCatImage ? newCatImage.name : "Upload Image"}
                    </span>
                </label>
            </div>
        </div>
        <button 
            onClick={addCategory} 
            disabled={uploading}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 flex items-center gap-2 h-[50px]"
        >
            {uploading ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Add
        </button>
      </div>

      {/* --- CATEGORIES LIST --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center overflow-hidden p-2">
                            {cat.image_url ? (
                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-contain" />
                            ) : (
                                <Tag size={16} className="text-gray-400"/>
                            )}
                        </div>
                        <h3 className="font-bold text-lg">{cat.name}</h3>
                    </div>
                    
                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2">
                        <button onClick={() => startEditing(cat)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors">
                            <Edit size={18} />
                        </button>
                        <button onClick={() => confirmDelete(cat.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="p-4 space-y-4 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-auto">
                        {cat.subcategories && cat.subcategories.length > 0 ? (
                            cat.subcategories.map((sub: string, idx: number) => (
                                <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 group">
                                    {sub}
                                    <button onClick={() => removeSubcategory(cat.id, cat.subcategories, sub)} className="hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-gray-400 italic">No subcategories.</span>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4">
                        <input 
                            className="flex-1 p-2 text-sm border border-gray-200 rounded-lg"
                            placeholder="Add Subcategory..."
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

      {/* --- EDIT MODAL --- */}
      {editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">Edit Category</h3>
                    <button onClick={() => setEditingCategory(null)} className="hover:bg-gray-200 p-1 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category Name</label>
                        <input 
                            className="w-full p-3 border border-gray-300 rounded-lg" 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Change Image (Optional)</label>
                        <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                                {editImage ? (
                                    <span className="text-xs text-green-600 font-bold">New</span>
                                ) : (
                                    <img src={editingCategory.image_url} className="w-full h-full object-contain" alt="Current" />
                                )}
                            </div>
                            <input 
                                type="file" 
                                accept="image/*"
                                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={e => setEditImage(e.target.files ? e.target.files[0] : null)}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                    <button onClick={() => setEditingCategory(null)} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
                    <button 
                        onClick={saveCategoryChanges} 
                        disabled={uploading}
                        className="px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 flex items-center gap-2"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Category?"
        message="Are you sure? Removing a category might leave products without a category."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

    </div>
  );
};

export default ManageCategories;