import React, { useState } from 'react';
import { 
  MessageSquare, 
  Package, 
  RefreshCcw, 
  CreditCard, 
  User, 
  CheckCircle, 
  ArrowRight,
  Send,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Types ---
type Topic = 'order' | 'return' | 'payment' | 'account' | 'other' | null;

interface ContactFormData {
  name: string;
  email: string;
  orderId: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [activeTopic, setActiveTopic] = useState<Topic>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    orderId: '',
    subject: '',
    message: ''
  });

  // --- Helpers ---
  const generateTicketId = () => {
    return `ADZ-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleTopicSelect = (topic: Topic) => {
    setActiveTopic(topic);
    const subjectMap: Record<string, string> = {
      order: "Inquiry regarding my order",
      return: "I need to return an item",
      payment: "Payment or Billing issue",
      account: "Help with my account",
      other: "General Inquiry"
    };
    if (topic) {
      setFormData(prev => ({ ...prev, subject: subjectMap[topic] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // SIMULATE API CALL
    setTimeout(() => {
      const newTicket = generateTicketId();
      setTicketId(newTicket);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  };

  // --- Sub-Components ---
  
  // 1. The Success View (After submission)
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

  // 2. The Main View
  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Header Section */}
      <div className="bg-blue-50 text-slate-900 py-12 pb-36 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">How can we help you?</h1>
          <p className="text-slate-600 max-w-xl mx-auto text-lg">
            Select a topic below to get started. We're here to solve your issues quickly.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 pb-20 relative z-20">
        
        {/* TOPIC GRID */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <TopicCard 
            icon={Package} 
            label="My Order" 
            active={activeTopic === 'order'} 
            onClick={() => handleTopicSelect('order')} 
          />
          <TopicCard 
            icon={RefreshCcw} 
            label="Returns" 
            active={activeTopic === 'return'} 
            onClick={() => handleTopicSelect('return')} 
          />
          <TopicCard 
            icon={CreditCard} 
            label="Payments" 
            active={activeTopic === 'payment'} 
            onClick={() => handleTopicSelect('payment')} 
          />
          <TopicCard 
            icon={User} 
            label="Account" 
            active={activeTopic === 'account'} 
            onClick={() => handleTopicSelect('account')} 
          />
          <TopicCard 
            icon={MessageSquare} 
            label="Other" 
            active={activeTopic === 'other'} 
            onClick={() => handleTopicSelect('other')} 
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: The Dynamic Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  {activeTopic ? <CheckCircle size={20} /> : <HelpCircle size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {activeTopic ? 'Tell us more' : 'Start by selecting a topic above'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {activeTopic 
                      ? 'Please provide details so we can assist you faster.' 
                      : 'This helps us route your ticket to the right team.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
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

                {/* Conditional Field: Order ID */}
                {(activeTopic === 'order' || activeTopic === 'return') && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Order ID (Optional)</label>
                    <div className="relative">
                      <Package className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                        placeholder="e.g. ADZ-8821"
                        value={formData.orderId}
                        onChange={e => setFormData({...formData, orderId: e.target.value})}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-1">Found in your order confirmation email.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea 
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition outline-none resize-none"
                    placeholder="Describe your issue clearly..."
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
                      <>Processing...</>
                    ) : (
                      <>Create Ticket <Send size={18} /></>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: Sidebar Info */}
          <div className="md:col-span-1 space-y-6">
            
            {/* FAQ Mini Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Common Questions</h3>
              <ul className="space-y-3">
                <li className="text-sm text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                  <ArrowRight size={14} /> How do I track my order?
                </li>
                <li className="text-sm text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                  <ArrowRight size={14} /> What is your return policy?
                </li>
                <li className="text-sm text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                  <ArrowRight size={14} /> Can I change my delivery address?
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Helper Component: Topic Card ---
// FIXED: Replaced 'bg-brand-primary' with 'bg-blue-600' to ensure icons are visible.
const TopicCard = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300
      ${active 
        ? 'bg-white shadow-lg ring-2 ring-blue-600 scale-105 z-10' 
        : 'bg-white shadow-sm hover:shadow-md hover:-translate-y-1 border border-slate-100'
      }
    `}
  >
    <div className={`
      mb-3 p-3 rounded-full 
      ${active ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}
    `}>
      <Icon size={24} />
    </div>
    <span className={`font-semibold text-sm ${active ? 'text-blue-600' : 'text-slate-600'}`}>
      {label}
    </span>
  </button>
);

export default Contact;