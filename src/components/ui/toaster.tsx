// src/components/ui/toaster.tsx
import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Info, Loader2, Ban } from 'lucide-react';

// --- TYPES ---
type ToastType = 'success' | 'error' | 'loading' | 'info';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

// --- EVENT BUS ---
const listeners: Set<(toasts: Toast[]) => void> = new Set();
let memoryToasts: Toast[] = [];

const emitChange = () => {
  listeners.forEach((listener) => listener([...memoryToasts]));
};

// --- PUBLIC API ---
export const toast = {
  success: (message: string, description?: string) => addToast(message, 'success', description),
  error: (message: string, description?: string) => addToast(message, 'error', description),
  info: (message: string, description?: string) => addToast(message, 'info', description),
  loading: (message: string, description?: string) => addToast(message, 'loading', description),
  dismiss: (id: string) => removeToast(id),
};

const addToast = (message: string, type: ToastType, description?: string) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, message, description, type };
  
  // Stack: Newest on top
  memoryToasts = [newToast, ...memoryToasts].slice(0, 3); // Keep max 3 visible
  emitChange();

  // Auto-dismiss (except loading)
  if (type !== 'loading') {
    setTimeout(() => removeToast(id), 5000);
  }
  return id;
};

const removeToast = (id: string) => {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  emitChange();
};

// --- UI COMPONENT ---
export const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    // ✅ FIX: Wrapped in curly braces to return 'void' instead of 'boolean'
    return () => {
        listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none p-4 md:p-0">
      {toasts.map((t, i) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto relative overflow-hidden
            bg-white/95 backdrop-blur-md 
            border border-white/20 shadow-2xl rounded-2xl p-4
            flex items-start gap-4
            transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${i === 0 ? 'opacity-100 translate-y-0 scale-100' : ''}
            ${i === 1 ? 'opacity-90 translate-y-2 scale-[0.98] absolute bottom-0 w-full -z-10' : ''}
            ${i === 2 ? 'opacity-0 translate-y-4 scale-[0.95] absolute bottom-0 w-full -z-20' : ''}
            animate-in slide-in-from-bottom-full fade-in zoom-in-95
          `}
        >
          {/* Progress Bar Animation */}
          {t.type !== 'loading' && (
            <div className={`absolute bottom-0 left-0 h-1 w-full origin-left animate-shrink-width ${
                t.type === 'success' ? 'bg-green-500' :
                t.type === 'error' ? 'bg-red-500' :
                'bg-blue-500'
            }`} style={{ animationDuration: '5s', animationTimingFunction: 'linear' }} />
          )}

          {/* Icon Bubble */}
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            t.type === 'success' ? 'bg-green-100 text-green-600' :
            t.type === 'error' ? 'bg-red-100 text-red-600' :
            t.type === 'loading' ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {t.type === 'success' && <Check size={20} strokeWidth={3} />}
            {t.type === 'error' && <Ban size={20} strokeWidth={3} />}
            {t.type === 'info' && <Info size={20} strokeWidth={3} />}
            {t.type === 'loading' && <Loader2 size={20} className="animate-spin" />}
          </div>

          {/* Content */}
          <div className="flex-1 pt-0.5">
            <h3 className="font-bold text-gray-900 text-[15px] leading-tight">
              {t.message}
            </h3>
            {t.description && (
              <p className="text-sm text-gray-500 mt-1 leading-snug">
                {t.description}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button 
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-colors -mt-1 -mr-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      
      {/* Inline styles for the progress bar animation */}
      <style>{`
        @keyframes shrink-width {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .animate-shrink-width {
          animation-name: shrink-width;
        }
      `}</style>
    </div>
  );
};

export default Toaster;