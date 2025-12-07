import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Loader2, Tag, ImageIcon, X, Edit, Save, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';

// Interface for stricter typing
interface Subcategory {
  name: string;
  image_url?: string;
}

interface Category {
  id: number;
  name: string;
  image_url?: string;
  subcategories: Subcategory[];
  is_illuminated?: boolean; // NEW: The toggle field
}

const ManageCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Create State
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newIsIlluminated, setNewIsIlluminated] = useState(false); // NEW STATE
  
  // Subcategory Input State
  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubImage, setNewSubImage] = useState<File | null>(null);

  // Edit State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editIsIlluminated, setEditIsIlluminated] = useState(false); // NEW STATE

  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id');
    if (data) {
        const formatted = data.map((cat: any) => ({
            ...cat,
            subcategories: Array.isArray(cat.subcategories) 
                ? cat.subcategories.map((sub: any) => typeof sub === 'string' ? { name: sub, image_url: '' } : sub)
                : [],
            is_illuminated: cat.is_illuminated || false // Load from DB
        }));
        setCategories(formatted);
    }
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
            image_url: publicUrl,
            is_illuminated: newIsIlluminated // Save the toggle
        });

        if (dbError) throw dbError;

        setNewCatName('');
        setNewCatImage(null);
        setNewIsIlluminated(false); // Reset toggle
        fetchCategories();

    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setUploading(false);
    }
  };

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

  // --- NEW FUNCTION: Toggle Hero Mode directly ---
  const toggleHeroMode = async (cat: Category) => {
      const newValue = !cat.is_illuminated;
      
      // Optimistic Update (Update UI instantly)
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_illuminated: newValue } : c));

      // Update Database
      const { error } = await supabase.from('categories').update({ is_illuminated: newValue }).eq('id', cat.id);
      
      if (error) {
          console.error("Error updating hero mode:", error);
          fetchCategories(); // Revert on error
      }
  };

  // --- SUBCATEGORY LOGIC ---
  
  const addSubcategory = async (catId: number, currentSubs: Subcategory[]) => {
    if (!newSubName.trim()) return alert("Subcategory name required");
    setUploading(true);

    try {
        let subImageUrl = '';
        if (newSubImage) {
            const fileExt = newSubImage.name.split('.').pop();
            const fileName = `sub_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('category-images').upload(fileName, newSubImage);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('category-images').getPublicUrl(fileName);
            subImageUrl = data.publicUrl;
        }

        const newSub: Subcategory = { name: newSubName.trim(), image_url: subImageUrl };
        const updatedSubs = [...currentSubs, newSub];

        const { error } = await supabase.from('categories').update({ subcategories: updatedSubs }).eq('id', catId);
        if (error) throw error;

        setNewSubName('');
        setNewSubImage(null);
        fetchCategories();
    } catch (error: any) {
        alert("Error adding subcategory: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  const removeSubcategory = async (catId: number, currentSubs: Subcategory[], subName: string) => {
    const updatedSubs = currentSubs.filter(s => s.name !== subName);
    await supabase.from('categories').update({ subcategories: updatedSubs }).eq('id', catId);
    fetchCategories();
  };

  // --- EDIT LOGIC ---
  const startEditing = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditImage(null);
    setEditIsIlluminated(cat.is_illuminated || false); // Load current setting
  };

  const saveCategoryChanges = async () => {
    if (!editingCategory) return;
    setUploading(true);

    try {
        let imageUrl = editingCategory.image_url;

        if (editImage) {
            const fileExt = editImage.name.split('.').pop();
            const fileName = `updated_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('category-images').upload(fileName, editImage);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('category-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        const { error } = await supabase.from('categories')
            .update({ 
                name: editName, 
                image_url: imageUrl,
                is_illuminated: editIsIlluminated // Update toggle
            })
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
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start">
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
        </div>

        {/* HERO MODE TOGGLE (ADD) */}
        <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={newIsIlluminated} onChange={e => setNewIsIlluminated(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                    Enable Hero Mode (Illuminated Cards) <Zap size={14} className={newIsIlluminated ? "text-yellow-500 fill-yellow-500" : "text-gray-400"} />
                </span>
            </label>
        </div>

        <button 
            onClick={addCategory} 
            disabled={uploading}
            className="w-full bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 flex items-center justify-center gap-2"
        >
            {uploading ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Add Category
        </button>
      </div>

      {/* --- CATEGORIES LIST --- */}
      <div className="grid grid-cols-1 gap-6">
        {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => setActiveCatId(activeCatId === cat.id ? null : cat.id)}>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden p-1">
                            {cat.image_url ? (
                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-contain" />
                            ) : (
                                <Tag size={20} className="text-gray-400"/>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {cat.name}
                                {/* VISUAL BADGE */}
                                {cat.is_illuminated && (
                                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1 font-bold">
                                        <Zap size={10} fill="currentColor"/> HERO
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-gray-500">{cat.subcategories.length} Subcategories</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                        {/* --- INDIVIDUAL TOGGLE BUTTON --- */}
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 mr-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Hero</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={cat.is_illuminated || false} 
                                    onChange={() => toggleHeroMode(cat)} 
                                />
                                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); startEditing(cat); }} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full">
                            <Edit size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); confirmDelete(cat.id); }} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full">
                            <Trash2 size={18} />
                        </button>
                        {activeCatId === cat.id ? <ChevronUp size={20} className="text-gray-400 ml-2"/> : <ChevronDown size={20} className="text-gray-400 ml-2"/>}
                    </div>
                </div>
                
                {/* SUBCATEGORY PANEL */}
                {activeCatId === cat.id && (
                    <div className="p-6 bg-white animate-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Manage Subcategories</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {cat.subcategories.map((sub, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg bg-gray-50 group hover:border-blue-200 transition-colors">
                                    <div className="w-10 h-10 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                                        {sub.image_url ? <img src={sub.image_url} className="w-full h-full object-cover"/> : <Tag size={14} className="text-gray-300"/>}
                                    </div>
                                    <span className="font-medium text-sm flex-1">{sub.name}</span>
                                    <button onClick={() => removeSubcategory(cat.id, cat.subcategories, sub.name)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ADD SUBCATEGORY FORM */}
                        <div className="flex gap-3 items-end bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Subcategory Name</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="e.g. Wireless Headsets"
                                    value={newSubName}
                                    onChange={e => setNewSubName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Image</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden" 
                                        id={`sub-img-${cat.id}`}
                                        onChange={e => setNewSubImage(e.target.files ? e.target.files[0] : null)}
                                    />
                                    <label htmlFor={`sub-img-${cat.id}`} className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-md cursor-pointer hover:border-blue-500">
                                        {newSubImage ? <span className="w-2 h-2 bg-green-500 rounded-full"></span> : <ImageIcon size={16} className="text-gray-400"/>}
                                    </label>
                                </div>
                            </div>
                            <button 
                                onClick={() => addSubcategory(cat.id, cat.subcategories)}
                                disabled={uploading}
                                className="bg-blue-600 text-white px-4 py-2.5 rounded-md font-bold text-sm hover:bg-blue-700 flex items-center gap-2"
                            >
                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
                            </button>
                        </div>
                    </div>
                )}
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

                    {/* HERO MODE TOGGLE (EDIT) */}
                    <div className="flex items-center gap-3 pt-2 border-t mt-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={editIsIlluminated} onChange={e => setEditIsIlluminated(e.target.checked)} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                                Enable Hero Mode <Zap size={14} className={editIsIlluminated ? "text-yellow-500 fill-yellow-500" : "text-gray-400"} />
                            </span>
                        </label>
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
        message="Are you sure? This will remove all subcategories inside it."
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