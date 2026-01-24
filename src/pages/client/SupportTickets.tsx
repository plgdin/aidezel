import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, MessageSquare, ArrowLeft, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import TicketChat from '../../components/tickets/TicketChat';

const ClientSupportTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('email', user.email) // Match by email
      .order('created_at', { ascending: false });

    setTickets(data || []);
    setLoading(false);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/account" className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">My Support Tickets</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* LEFT: Ticket List */}
          <div className="md:col-span-1 space-y-3 h-[600px] overflow-y-auto pr-2">
            {tickets.length === 0 && <p className="text-slate-500">No tickets found.</p>}
            
            {tickets.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedTicket(t.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTicket === t.id 
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-400">{t.ticket_id}</span>
                       
                       {/* --- NEW: ORDER ID DISPLAY --- */}
                       {t.order_id && (
                           <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded mt-1 w-fit">
                               <Package size={10} /> Order #{t.order_id}
                           </span>
                       )}
                   </div>

                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      t.status === 'open' ? 'bg-red-100 text-red-700' : 
                      t.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-600'
                   }`}>
                      {t.status.replace('_', ' ')}
                   </span>
                </div>
                
                <h3 className="font-bold text-slate-800 text-sm line-clamp-1 mt-2">{t.subject}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.message}</p>
                <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">
                  {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Chat Area */}
          <div className="md:col-span-2">
            {selectedTicket ? (
              <div>
                <TicketChat ticketId={selectedTicket} userRole="client" />
              </div>
            ) : (
              <div className="h-[500px] bg-slate-50 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p>Select a ticket to view the conversation</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientSupportTickets;