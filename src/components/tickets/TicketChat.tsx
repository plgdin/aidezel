import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Paperclip, Loader2, User, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { toast } from '../ui/toaster'; // This path is now correct relative to src/components/tickets/

interface Message {
  id: string;
  sender_role: 'admin' | 'staff' | 'client';
  message: string;
  attachment_url?: string;
  created_at: string;
}

interface TicketChatProps {
  ticketId: string;
  userRole: 'admin' | 'staff' | 'client';
}

const TicketChat: React.FC<TicketChatProps> = ({ ticketId, userRole }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Messages on Load
  useEffect(() => {
    fetchMessages();
    
    // Realtime Subscription
    const subscription = supabase
      .channel('chat_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ticket_messages', 
        filter: `ticket_id=eq.${ticketId}` 
      }, (payload: any) => { // <--- FIXED: Added ': any' type here
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [ticketId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data as Message[]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    let attachmentUrl = null;

    // 1. Handle File Upload
    if (file) {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${ticketId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Upload Failed", uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(filePath);
      
      attachmentUrl = publicUrl;
      setUploading(false);
    }

    // 2. Insert Message
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_role: userRole,
      message: newMessage,
      attachment_url: attachmentUrl
    });

    if (error) {
      toast.error("Failed to send", error.message);
    } else {
      setNewMessage('');
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      
      {/* MESSAGES AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-10 text-sm">
            No replies yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_role === userRole;
            const isSupport = msg.sender_role === 'admin' || msg.sender_role === 'staff';
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] rounded-2xl p-3 text-sm shadow-sm
                  ${isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : isSupport && userRole === 'client'
                      ? 'bg-purple-100 text-purple-900 rounded-bl-none border border-purple-200' 
                      : 'bg-white text-slate-700 rounded-bl-none border border-slate-200'
                  }
                `}>
                  {!isMe && (
                    <div className="text-xs font-bold mb-1 opacity-70 flex items-center gap-1">
                      {isSupport ? <ShieldAlert size={10} /> : <User size={10} />}
                      {msg.sender_role.toUpperCase()}
                    </div>
                  )}

                  {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                  {msg.attachment_url && (
                    <div className="mt-2">
                      <a href={msg.attachment_url} target="_blank" rel="noreferrer">
                        <img 
                          src={msg.attachment_url} 
                          alt="attachment" 
                          className="max-h-40 rounded-lg border border-white/20 hover:opacity-90 transition"
                        />
                      </a>
                    </div>
                  )}

                  <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT AREA */}
      <div className="bg-white p-3 border-t border-slate-200">
        {file && (
          <div className="flex items-center gap-2 mb-2 bg-slate-100 p-2 rounded-lg text-xs">
            <ImageIcon size={14} className="text-slate-500" />
            <span className="truncate max-w-[200px]">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 font-bold ml-auto">×</button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <label className="cursor-pointer p-3 hover:bg-slate-100 rounded-lg text-slate-500 transition">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if(e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />
            <Paperclip size={20} />
          </label>

          <textarea
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            rows={1}
            placeholder="Type a reply..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />

          <button 
            type="submit" 
            disabled={uploading || (!newMessage && !file)}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketChat;