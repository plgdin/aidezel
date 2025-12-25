import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

const Privacy = () => {
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrivacy = async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('title, content')
        .eq('key', 'privacy')
        .single();

      if (data) setContent(data);
      setLoading(false);
    };
    fetchPrivacy();
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="container mx-auto px-4 py-12 pb-24 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">{content?.title || 'Privacy Policy'}</h1>
      <div 
        className="prose prose-slate max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: content?.content || 'Content not available.' }} 
      />
    </div>
  );
};

export default Privacy;