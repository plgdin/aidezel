import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'info';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: StatusType;
  actionText?: string;
  onAction?: () => void;
}

const StatusModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  actionText = 'Okay',
  onAction
}: StatusModalProps) => {
  if (!isOpen) return null;

  // Determine styles/icons based on type
  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
      btn: 'bg-green-600 hover:bg-green-700 shadow-green-200'
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
      btn: 'bg-red-600 hover:bg-red-700 shadow-red-200'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
    }
  }[type];

  const Icon = config.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`px-6 py-6 flex flex-col items-center justify-center border-b border-gray-100 ${config.bg}`}>
          <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm ${config.iconColor}`}>
            <Icon size={28} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-lg text-gray-900 text-center">{title}</h3>
          
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:bg-white/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={() => {
              if (onAction) onAction();
              onClose();
            }}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all ${config.btn}`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StatusModal;