import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { logAction } from '../../lib/logger'; // <--- IMPORTED LOGGER

const ManageLegal = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  // State for content
  const [data, setData] = useState({
    privacy: { title: '', content: '' },
    terms: { title: '', content: '' }
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('site_content').select('*');
    
    if (error) {
      toast.error('Failed to load content');
    } else if (rows) {
      const newData = { ...data };
      rows.forEach((row: any) => {
        if (row.key === 'privacy') newData.privacy = { title: row.title, content: row.content };
        if (row.key === 'terms') newData.terms = { title: row.title, content: row.content };
      });
      setData(newData);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const currentData = data[activeTab];
    
    const { error } = await supabase
      .from('site_content')
      .upsert({ 
        key: activeTab, 
        title: currentData.title, 
        content: currentData.content,
        updated_at: new Date()
      });

    if (error) {
      toast.error('Error saving content');
    } else {
      // --- LOGGING ADDED HERE ---
      const docName = activeTab === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
      await logAction('Legal Content Update', `Updated content for: "${docName}"`);

      toast.success(`${activeTab === 'privacy' ? 'Privacy Policy' : 'Terms'} updated successfully!`);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manage Legal Content</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'privacy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'terms' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Terms & Conditions
        </button>
      </div>

      {/* Editor Area */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
          <input
            type="text"
            value={data[activeTab].title}
            onChange={(e) => setData({
              ...data,
              [activeTab]: { ...data[activeTab], title: e.target.value }
            })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <p className="text-xs text-gray-500 mb-2">You can use basic HTML tags (like &lt;br&gt;, &lt;b&gt;, &lt;p&gt;) for formatting.</p>
          <textarea
            rows={20}
            value={data[activeTab].content}
            onChange={(e) => setData({
              ...data,
              [activeTab]: { ...data[activeTab], content: e.target.value }
            })}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default ManageLegal;