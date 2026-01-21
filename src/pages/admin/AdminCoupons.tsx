import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Plus, Tag, Percent, PoundSterling, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

// --- TYPES ---
interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  is_active: boolean;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent', // Default to percentage
    value: '',
  });

  // --- 1. FETCH COUPONS ---
  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('is_active', { ascending: false }); // Active first

    if (error) {
      console.error(error);
      // FIX: Correct syntax toast(message, options)
      toast('Error fetching coupons', { className: 'bg-red-900 text-white' });
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // --- 2. CREATE COUPON ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.value) return;

    setSubmitting(true);

    const { error } = await supabase.from('coupons').insert([
      {
        code: formData.code.toUpperCase(), // Always uppercase
        discount_type: formData.discount_type,
        value: parseFloat(formData.value),
        is_active: true,
      },
    ]);

    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        // FIX: Correct syntax toast(message, options)
        toast('Coupon Exists', { description: 'This code is already in use.', className: 'bg-red-900 text-white' });
      } else {
        // FIX: Correct syntax toast(message, options)
        toast('Error creating coupon', { className: 'bg-red-900 text-white' });
      }
    } else {
      // FIX: Correct syntax toast(message, options)
      toast('Coupon Created', { className: 'bg-green-600 text-white' });
      setFormData({ code: '', discount_type: 'percent', value: '' }); 
      fetchCoupons(); 
    }
  };

  // --- 3. DELETE COUPON ---
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      // FIX: Correct syntax toast(message, options)
      toast('Delete Failed', { className: 'bg-red-900 text-white' });
    } else {
      // FIX: Correct syntax toast(message, options)
      toast('Coupon Deleted');
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
  };

  // --- 4. TOGGLE STATUS ---
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));

    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      // FIX: Correct syntax toast(message, options)
      toast('Update Failed', { className: 'bg-red-900 text-white' });
      fetchCoupons(); 
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Coupons</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: CREATE FORM --- */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="bg-black text-white p-1 rounded-full w-6 h-6" /> 
            Create New Coupon
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  className="w-full pl-10 p-3 border rounded-lg uppercase font-bold"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* GRID LAYOUT: 5 Columns Total (3 for Type, 2 for Value) */}
            <div className="grid grid-cols-5 gap-4">
              
              {/* TYPE SELECTOR: 60% Width */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full p-4 text-lg border rounded-lg bg-white cursor-pointer"
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (£)</option>
                </select>
              </div>

              {/* VALUE INPUT: 40% Width */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <div className="relative">
                  {formData.discount_type === 'percent' ? (
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  ) : (
                    <PoundSterling className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  )}
                  
                  <input
                    type="number"
                    placeholder="10"
                    // PADDING FIX: pl-10 to show numbers clearly
                    className="w-full pl-10 p-4 text-lg border rounded-lg font-bold"
                    value={formData.value}
                    onChange={(e) => {
                      // LIMIT FIX: Only allow 2 digits
                      if (e.target.value.length <= 2) {
                        setFormData({ ...formData, value: e.target.value });
                      }
                    }}
                    required
                    min="0"
                    max="99"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" /> : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* --- RIGHT: COUPONS LIST --- */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-100 bg-gray-50">
             <h2 className="text-lg font-bold">Existing Coupons</h2>
           </div>
           
           {loading ? (
             <div className="p-8 text-center text-gray-500">Loading...</div>
           ) : coupons.length === 0 ? (
             <div className="p-12 text-center text-gray-400">
                <Tag className="mx-auto w-12 h-12 mb-4 opacity-20" />
                <p>No coupons found. Create your first one!</p>
             </div>
           ) : (
             <table className="w-full text-left">
               <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                 <tr>
                   <th className="p-4">Code</th>
                   <th className="p-4">Discount</th>
                   <th className="p-4 text-center">Status</th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {coupons.map((coupon) => (
                   <tr key={coupon.id} className="hover:bg-gray-50 transition-colors group">
                     <td className="p-4">
                       <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm tracking-wide">
                         {coupon.code}
                       </span>
                     </td>
                     <td className="p-4 font-medium text-gray-700">
                       {coupon.discount_type === 'percent' 
                         ? <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">{coupon.value}% OFF</span>
                         : <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">£{coupon.value} OFF</span>
                       }
                     </td>
                     <td className="p-4 text-center">
                       <button onClick={() => toggleStatus(coupon.id, coupon.is_active)} className="transition-colors hover:text-blue-600">
                         {coupon.is_active 
                            ? <ToggleRight size={28} className="text-green-500 mx-auto" />
                            : <ToggleLeft size={28} className="text-gray-300 mx-auto" />
                         }
                       </button>
                     </td>
                     <td className="p-4 text-right">
                       <button 
                         onClick={() => handleDelete(coupon.id)}
                         className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                         title="Delete Coupon"
                       >
                         <Trash2 size={18} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>

      </div>
    </div>
  );
};

export default AdminCoupons;