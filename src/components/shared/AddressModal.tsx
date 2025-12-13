import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: any) => Promise<void>;
  initialData?: any;
}

const AddressModal = ({ isOpen, onClose, onSave, initialData }: AddressModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    postcode: '',
    is_default: false,
  });

  // Load initial data when editing
  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: initialData?.full_name || '',
        phone: initialData?.phone || '',
        address_line1: initialData?.address_line1 || '',
        city: initialData?.city || '',
        postcode: initialData?.postcode || '',
        is_default: initialData?.is_default || false,
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            {initialData ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Full Name</label>
              <input 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Phone Number</label>
              <input 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">Address Line 1</label>
            <input 
              required
              placeholder="Street address, P.O. Box, Company name"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={formData.address_line1}
              onChange={e => setFormData({...formData, address_line1: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">City</label>
              <input 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Post Code</label>
              <input 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.postcode}
                onChange={e => setFormData({...formData, postcode: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="default"
              checked={formData.is_default}
              onChange={e => setFormData({...formData, is_default: e.target.checked})}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="default" className="text-sm text-gray-700">Make this my default address</label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;