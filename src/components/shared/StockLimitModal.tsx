import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface StockLimitModalProps {
  isOpen: boolean;
  stockLimit: number;
  productName: string;
  onClose: () => void;
}

const StockLimitModal = ({ isOpen, stockLimit, productName, onClose }: StockLimitModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        
        {/* Header with Icon */}
        <div className="bg-orange-50 p-6 flex flex-col items-center justify-center border-b border-orange-100">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Stock Limit Reached</h3>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            We're sorry, but we only have <span className="font-bold text-gray-900">{stockLimit}</span> units of <span className="font-bold text-gray-900">{productName}</span> available in stock right now.
          </p>
          <p className="text-xs text-gray-400">
            You already have the maximum available quantity in your cart.
          </p>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
          >
            Understood
          </button>
        </div>

        {/* Close X (Top Right) */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

      </div>
    </div>,
    document.body
  );
};

export default StockLimitModal;