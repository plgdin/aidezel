import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Loader2, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Package,
  User,
  ShieldAlert
} from 'lucide-react';
import { toast } from '../../components/ui/toaster';
import TicketChat from '../../components/tickets/TicketChat'; // Import the Chat Component

interface Ticket {
  id: string;
  ticket_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  order_id?: string;
}

const ManageTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  
  // Store the current user's role to pass to the chat
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'staff' | null>(null);

  useEffect(() => {
    fetchTickets();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (data) {
        // We cast this because we know the db only has these roles + client
        setCurrentUserRole(data.role as 'admin' | 'staff');
      }
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error("Error", "Could not fetch tickets");
    else setTickets(data || []);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error("Update Failed", error.message);
    } else {
      toast.success("Status Updated", `Ticket marked as ${newStatus}`);
      fetchTickets();
    }
  };

  const filteredTickets = tickets.filter(t => filter === 'all' ? true : t.status === filter);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Manage customer inquiries and support requests</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
          {['all', 'open', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No tickets found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="group hover:bg-slate-50 transition-colors">
                {/* Row Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(ticket.status)}`}>
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ticket.subject}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {ticket.ticket_id}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 flex gap-2 mt-0.5">
                        <span className="font-medium text-slate-700">{ticket.name}</span>
                        <span>•</span>
                        <span>{ticket.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-slate-400 w-24 text-right">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <div className="text-slate-300">
                      {expandedId === ticket.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === ticket.id && (
                  <div className="px-4 pb-4 pt-0 ml-14 border-l-2 border-slate-100 pl-6 mb-4">
                    
                    {/* ORIGINAL REQUEST BOX */}
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed border border-slate-200 mb-6">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                         <MessageSquare size={12} /> Original Request
                      </div>
                      <p className="font-medium text-slate-900">{ticket.message}</p>
                      {ticket.order_id && (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-blue-600 font-medium">
                          <Package size={16} /> Related Order: {ticket.order_id}
                        </div>
                      )}
                    </div>

                    {/* --- CHAT INTERFACE --- */}
                    <div className="mb-6">
                         <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-blue-600"/> 
                            Reply & History
                         </h3>
                         
                         {currentUserRole ? (
                            <TicketChat ticketId={ticket.id} userRole={currentUserRole} />
                         ) : (
                            <div className="p-4 bg-slate-100 text-center rounded-lg text-sm text-slate-500">
                                <Loader2 className="animate-spin inline mr-2" /> Loading chat...
                            </div>
                         )}
                    </div>
                    
                    {/* ACTION BUTTONS */}
                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                      {ticket.status !== 'resolved' && (
                        <button 
                          onClick={() => handleStatusUpdate(ticket.id, 'resolved')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm"
                        >
                          <CheckCircle size={16} /> Mark Resolved
                        </button>
                      )}
                      {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                        <button 
                          onClick={() => handleStatusUpdate(ticket.id, 'in_progress')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                        >
                          <Clock size={16} /> Mark In Progress
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTickets;