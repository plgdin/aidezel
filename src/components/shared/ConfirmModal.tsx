import React from 'react';
import { createPortal } from 'react-dom'; // <--- IMPORT THIS
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false
}: ConfirmModalProps) => {
  // Prevent rendering if not open
  if (!isOpen) return null;

  // Use createPortal to render this component directly into the document body
  // This bypasses all z-index/overflow issues in your AdminLayout
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      
      {/* The Backdrop (Blur Effect) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel} // Close if clicking outside
      />

      {/* The Modal Content */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            {isDanger && (
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <AlertTriangle size={20}/>
              </div>
            )}
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
          <button 
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-black hover:bg-gray-800 shadow-gray-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body // <--- Renders at the very end of the <body> tag
  );
};

export default ConfirmModal;