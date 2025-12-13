import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Heart, LogOut, MapPin, Save, Loader2, Settings, Lock, Eye, EyeOff, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import StatusModal, { StatusType } from '../../components/shared/StatusModal';
import AddressModal from '../../components/shared/AddressModal';

const UserAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Profile State
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  // Address Book State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // Password State
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [updatingPass, setUpdatingPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false, title: '', message: '', type: 'success' as StatusType
  });

  const showPopup = (title: string, message: string, type: StatusType = 'success') => {
    setModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) { navigate('/login', { replace: true }); return; }
      setSession(session);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
         setProfile({
            full_name: profileData.full_name || '',
            email: session.user.email || '', 
            phone: profileData.phone || '',
        });
      } else {
        setProfile(prev => ({ ...prev, email: session.user.email || '' }));
      }

      fetchAddresses(session.user.id);
      
      setLoading(false);
    };

    getData();
  }, [navigate]);

  const fetchAddresses = async (userId: string) => {
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false }); 
    
    setAddresses(data || []);
  };

  const handleSaveAddress = async (addressData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (addressData.is_default) {
        await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', session.user.id);
    }

    let error;
    if (editingAddress) {
        const { error: updateError } = await supabase
            .from('user_addresses')
            .update({ ...addressData, user_id: session.user.id })
            .eq('id', editingAddress.id);
        error = updateError;
    } else {
        const isFirst = addresses.length === 0;
        const { error: insertError } = await supabase
            .from('user_addresses')
            .insert([{ ...addressData, is_default: addressData.is_default || isFirst, user_id: session.user.id }]);
        error = insertError;
    }

    if (error) {
        showPopup('Error', error.message, 'error');
    } else {
        showPopup('Success', 'Address saved successfully.', 'success');
        fetchAddresses(session.user.id);
        // --- TRIGGER NAVBAR UPDATE ---
        if (addressData.is_default || addresses.length === 0) {
            window.dispatchEvent(new Event('address-updated'));
        }
    }
    setEditingAddress(null);
  };

  const handleSetDefault = async (addressId: string) => {
    if (!session) return;

    // 1. Set all to false
    await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id);

    // 2. Set selected to true
    const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

    if (error) {
        showPopup('Error', error.message, 'error');
    } else {
        fetchAddresses(session.user.id); 
        showPopup('Success', 'Default address updated.', 'success');
        // --- TRIGGER NAVBAR UPDATE ---
        window.dispatchEvent(new Event('address-updated'));
    }
  };

  const handleDeleteAddress = async (id: string, isDefault: boolean) => {
      if(!window.confirm("Are you sure you want to delete this address?")) return;
      
      const { error } = await supabase.from('user_addresses').delete().eq('id', id);
      if (error) {
          showPopup('Error', error.message, 'error');
      } else {
          fetchAddresses(session.user.id);
          // If default was deleted, update navbar to fallback state
          if (isDefault) {
              window.dispatchEvent(new Event('address-updated'));
          }
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const updates = {
      id: session.user.id,
      full_name: profile.full_name,
      phone: profile.phone,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      showPopup('Update Failed', error.message, 'error');
    } else {
      showPopup('Success', 'Profile details updated.', 'success');
    }
    setUpdating(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 6) return showPopup('Weak Password', 'Password must be at least 6 characters.', 'error');
    if (passwords.new !== passwords.confirm) return showPopup('Mismatch', 'Passwords do not match.', 'error');

    setUpdatingPass(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });

    if (error) showPopup('Error', error.message, 'error');
    else {
        showPopup('Password Updated', 'Your password has been changed successfully.', 'success');
        setPasswords({ new: '', confirm: '' });
    }
    setUpdatingPass(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
    </div>
  );

  return (
    <div className="bg-transparent min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="bg-[#0f172a] text-white pt-12 pb-24">
        <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                     {profile.full_name ? profile.full_name[0].toUpperCase() : <User />}
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Welcome, {profile.full_name || 'User'}</h1>
                    <p className="text-blue-200">{profile.email}</p>
                 </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 overflow-hidden">
                    <Link to="/orders" className="flex items-center gap-4 p-4 hover:bg-transparent rounded-xl transition-colors group">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Package size={20} />
                        </div>
                        <div><h3 className="font-bold text-gray-900">My Orders</h3><p className="text-xs text-gray-500">Track & return</p></div>
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-4 p-4 hover:bg-transparent rounded-xl transition-colors group">
                        <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                             <Heart size={20} />
                        </div>
                        <div><h3 className="font-bold text-gray-900">Wishlist</h3><p className="text-xs text-gray-500">Saved items</p></div>
                    </Link>
                    <div className="h-px bg-gray-100 my-2"></div>
                     <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-colors group text-left">
                        <div className="w-10 h-10 bg-transparent text-gray-500 rounded-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <LogOut size={20} />
                         </div>
                        <div><h3 className="font-bold text-gray-900 group-hover:text-red-600">Sign Out</h3><p className="text-xs text-gray-500 group-hover:text-red-400">Securely logout</p></div>
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
                 
                 {/* PROFILE SETTINGS */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-2 mb-6 text-gray-900">
                        <Settings size={20} className="text-blue-600" />
                        <h2 className="text-xl font-bold">Profile Info</h2>
                     </div>
                    <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700">Full Name</label>
                             <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" placeholder="John Doe" />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Phone Number</label>
                            <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" placeholder="+44 7700 900000" />
                         </div>
                        <div className="md:col-span-2 space-y-2">
                             <label className="text-sm font-bold text-gray-700">Email Address</label>
                            <input type="email" value={profile.email} disabled className="w-full p-3 border border-gray-200 rounded-xl bg-transparent text-gray-500 cursor-not-allowed" />
                        </div>
                        <div className="md:col-span-2 pt-2">
                             <button type="submit" disabled={updating} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50">
                                {updating ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Info
                            </button>
                        </div>
                    </form>
                </div>

                {/* ADDRESS BOOK */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <MapPin size={20} className="text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-900">Your Addresses</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ADD NEW BUTTON */}
                        <button 
                            onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}
                            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group h-full min-h-[180px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Plus size={24} className="text-gray-400 group-hover:text-blue-600" />
                            </div>
                            <span className="font-bold text-gray-500 group-hover:text-blue-700">Add New Address</span>
                        </button>

                        {/* ADDRESS CARDS */}
                        {addresses.map((addr) => (
                            <div 
                                key={addr.id} 
                                className={`relative border rounded-xl p-5 hover:shadow-md transition-all bg-white flex flex-col ${
                                    addr.is_default ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">{addr.full_name}</h3>
                                    {addr.is_default && (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                            <CheckCircle size={10} /> DEFAULT
                                        </span>
                                    )}
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-1 line-clamp-1">{addr.address_line1}</p>
                                <p className="text-sm text-gray-600 mb-3">{addr.city}, {addr.postcode}</p>
                                <p className="text-xs text-gray-500 mb-4">Phone: {addr.phone}</p>
                                
                                <div className="flex flex-col gap-2 mt-auto">
                                    {/* Set as Default Button */}
                                    {!addr.is_default && (
                                        <button 
                                            onClick={() => handleSetDefault(addr.id)}
                                            className="text-xs font-semibold text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg py-1.5 px-3 transition-colors w-full text-center"
                                        >
                                            Set as Default
                                        </button>
                                    )}

                                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                                        <button 
                                            onClick={() => { setEditingAddress(addr); setIsAddressModalOpen(true); }}
                                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAddress(addr.id, addr.is_default)}
                                            className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                                        >
                                            <Trash2 size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECURITY SECTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-2 mb-6 text-gray-900">
                        <Lock size={20} className="text-blue-600" />
                        <h2 className="text-xl font-bold">Security</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 relative">
                            <label className="text-sm font-bold text-gray-700">New Password</label>
                            <input 
                                type={showNewPass ? "text" : "password"} 
                                value={passwords.new}
                                onChange={e => setPasswords({...passwords, new: e.target.value})}
                                className="w-full p-3 pr-10 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                                {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-bold text-gray-700">Confirm Password</label>
                            <input 
                                type={showConfirmPass ? "text" : "password"} 
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                className="w-full p-3 pr-10 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="md:col-span-2 pt-2">
                             <button type="submit" disabled={updatingPass || !passwords.new} className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50">
                                {updatingPass ? <Loader2 className="animate-spin" /> : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
      </div>

      <AddressModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />

      <StatusModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

    </div>
  );
};

export default UserAccount;