// src/components/ui/toaster.tsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

// --- EVENT BUS FOR TOASTS ---
type ToastType = 'success' | 'error' | 'loading' | 'info';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

// Simple event emitter state
const listeners: Set<(toasts: Toast[]) => void> = new Set();
let memoryToasts: Toast[] = [];

const emitChange = () => {
  listeners.forEach((listener) => listener([...memoryToasts]));
};

// --- PUBLIC API ---
// Import this 'toast' object in your pages to trigger notifications
export const toast = {
  success: (message: string, description?: string) => addToast(message, 'success', description),
  error: (message: string, description?: string) => addToast(message, 'error', description),
  info: (message: string, description?: string) => addToast(message, 'info', description),
  loading: (message: string, description?: string) => addToast(message, 'loading', description),
  dismiss: (id: string) => removeToast(id),
};

const addToast = (message: string, type: ToastType, description?: string) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: Toast = { id, message, description, type, duration: 4000 };
  
  // Add to start of array (stacking context)
  memoryToasts = [newToast, ...memoryToasts].slice(0, 5); // Limit to 5 visible
  emitChange();

  if (type !== 'loading') {
    setTimeout(() => removeToast(id), 4000);
  }
  return id;
};

const removeToast = (id: string) => {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  emitChange();
};

// --- UI COMPONENT ---
// Place this <Toaster /> in your App.tsx or Layout
export const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-[380px] pointer-events-none px-4 md:px-0">
      {toasts.map((t, i) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto relative overflow-hidden
            bg-white/95 backdrop-blur-sm border shadow-xl rounded-2xl p-4
            transform transition-all duration-500 ease-in-out
            ${i === 0 ? 'scale-100 opacity-100 translate-y-0' : ''}
            ${i > 0 ? 'scale-95 opacity-80 -translate-y-2 absolute bottom-0 w-full z-[-1]' : ''}
            ${i > 1 ? 'scale-90 opacity-0 -translate-y-4' : ''}
            animate-in slide-in-from-bottom-8 fade-in
            flex items-start gap-4
          `}
          style={{ 
            zIndex: 100 - i,
          }}
        >
          {/* Status Indicator Bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
             t.type === 'success' ? 'bg-green-500' : 
             t.type === 'error' ? 'bg-red-500' : 
             t.type === 'loading' ? 'bg-blue-500' : 'bg-gray-500'
          }`} />

          {/* Icon Section */}
          <div className={`mt-0.5 shrink-0 ${
             t.type === 'success' ? 'text-green-600' : 
             t.type === 'error' ? 'text-red-600' : 
             t.type === 'loading' ? 'text-blue-600' : 'text-gray-600'
          }`}>
            {t.type === 'success' && <CheckCircle2 size={22} strokeWidth={2.5} />}
            {t.type === 'error' && <AlertCircle size={22} strokeWidth={2.5} />}
            {t.type === 'info' && <Info size={22} strokeWidth={2.5} />}
            {t.type === 'loading' && <Loader2 size={22} className="animate-spin" />}
          </div>

          {/* Text Section */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 leading-snug">
              {t.message}
            </h3>
            {t.description && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                {t.description}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button 
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-gray-800 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;