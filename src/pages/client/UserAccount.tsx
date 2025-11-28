import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Heart, LogOut, MapPin, Save, Loader2, Settings } from 'lucide-react';

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
    address: '',
    city: ''
  });

  useEffect(() => {
    const getProfile = async () => {
      // 1. Check Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // --- THE FIX IS HERE ---
        // { replace: true } replaces the current history entry.
        // This prevents the "Back Button Loop".
        navigate('/login', { replace: true }); 
        return;
      }

      setSession(session);

      // 2. Fetch Profile Data from DB
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile({
            full_name: data.full_name || '',
            email: session.user.email || '', 
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || ''
        });
      } else if (!data) {
        // If profile doesn't exist yet, just use auth email
        setProfile(prev => ({ ...prev, email: session.user.email || '' }));
      }
      
      setLoading(false);
    };

    getProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    const updates = {
      id: session.user.id,
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
    }
    setUpdating(false);
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
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* --- HEADER SECTION --- */}
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
            
            {/* --- LEFT COLUMN: NAVIGATION --- */}
            <div className="space-y-6">
                {/* Quick Stats / Navigation Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 overflow-hidden">
                    <Link to="/orders" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Package size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">My Orders</h3>
                            <p className="text-xs text-gray-500">Track & return</p>
                        </div>
                    </Link>
                    
                    <Link to="/wishlist" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                        <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                            <Heart size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Wishlist</h3>
                            <p className="text-xs text-gray-500">Saved items</p>
                        </div>
                    </Link>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-colors group text-left">
                        <div className="w-10 h-10 bg-gray-50 text-gray-500 rounded-lg flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <LogOut size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-red-600">Sign Out</h3>
                            <p className="text-xs text-gray-500 group-hover:text-red-400">Securely logout</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* --- RIGHT COLUMN: PROFILE FORM --- */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-2 mb-6 text-gray-900">
                        <Settings size={20} className="text-blue-600" />
                        <h2 className="text-xl font-bold">Profile Settings</h2>
                    </div>

                    <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    value={profile.full_name}
                                    onChange={e => setProfile({...profile, full_name: e.target.value})}
                                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Phone Number</label>
                            <input 
                                type="tel" 
                                value={profile.phone}
                                onChange={e => setProfile({...profile, phone: e.target.value})}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                placeholder="+44 7700 900000"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-gray-700">Shipping Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    value={profile.address}
                                    onChange={e => setProfile({...profile, address: e.target.value})}
                                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    placeholder="123 High Street, Apartment 4B"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">City</label>
                            <input 
                                type="text" 
                                value={profile.city}
                                onChange={e => setProfile({...profile, city: e.target.value})}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                placeholder="London"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Email Address</label>
                            <input 
                                type="email" 
                                value={profile.email} 
                                disabled 
                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-gray-400">Email cannot be changed manually.</p>
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button 
                                type="submit" 
                                disabled={updating}
                                className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {updating ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </div>

                    </form>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default UserAccount;