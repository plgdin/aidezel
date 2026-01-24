import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Send,
  MessageSquare,
  Package
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; 
import { toast } from '../../components/ui/toaster'; 

interface ContactFormData {
  name: string;
  email: string;
  orderId: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    orderId: '',
    subject: '',
    message: ''
  });

  // --- 1. PREFILL DATA (User Profile + URL Params) ---
  useEffect(() => {
    const urlOrderId = searchParams.get('orderId');
    const urlSubject = searchParams.get('subject');

    const fetchUserAndProfile = async () => {
        // 1. Get Auth User
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // 2. Get Profile Data (for Full Name)
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                // Try profile name first, fallback to metadata, then empty
                name: profile?.full_name || user.user_metadata?.full_name || ''
            }));
        }
    };

    fetchUserAndProfile();

    if (urlOrderId || urlSubject) {
        setFormData(prev => ({
            ...prev,
            orderId: urlOrderId || '',
            subject: urlSubject || `Inquiry about Order #${urlOrderId}`
        }));
    }
  }, [searchParams]);

  // --- Helpers ---
  const generateTicketId = () => {
    return `ADZ-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newTicketId = generateTicketId();

    try {
      // --- INSERT INTO DATABASE ---
      const { error } = await supabase.from('support_tickets').insert({
        ticket_id: newTicketId,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        topic: 'General Support', 
        message: formData.message,
        order_id: formData.orderId ? formData.orderId : null, 
        status: 'open'
      });

      if (error) throw error;

      // Success
      setTicketId(newTicketId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success("Ticket Created", "We have received your request.");

    } catch (err: any) {
      console.error(err);
      toast.error("Error", err.message || "Failed to submit ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Success View ---
  if (ticketId) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Request Received!</h2>
          <p className="text-slate-500 mb-6">
            We have created a support ticket for you. An agent will review your case and reply via email within 24 hours.
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-8 inline-block border border-slate-200">
            <span className="text-sm text-slate-500 block">Ticket Reference ID</span>
            <span className="text-2xl font-mono font-bold text-blue-600">{ticketId}</span>
          </div>

          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
            >
              Submit Another
            </button>
            <Link 
              to="/" 
              className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Form View ---
  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Header Section */}
      <div className="bg-blue-900 text-white py-12 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Customer Support</h1>
          <p className="text-blue-200 max-w-xl mx-auto text-lg">
            Need help with an order or have a question? Fill out the form below.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 pb-20 relative z-20">
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-10">
              
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    How can we help?
                  </h2>
                  <p className="text-sm text-slate-500">
                    Please provide detailed information so we can assist you faster.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none bg-slate-50 focus:bg-white"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input 
                      required
                      type="email" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none bg-slate-50 focus:bg-white"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Order ID Field */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Order ID (Optional)</label>
                    <div className="relative">
                      <Package className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                        placeholder="e.g. 123"
                        value={formData.orderId}
                        onChange={e => setFormData({...formData, orderId: e.target.value})}
                      />
                    </div>
                    {formData.orderId && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={12}/> Linked to Order #{formData.orderId}
                        </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                    placeholder="Briefly describe the issue..."
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                  <textarea 
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none resize-none"
                    placeholder="Describe your issue or question clearly..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>Sending Ticket...</>
                    ) : (
                      <>Create Ticket <Send size={18} /></>
                    )}
                  </button>
                </div>

              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;