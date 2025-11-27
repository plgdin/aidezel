import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { cartItems, removeFromCart, addToCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pb-24">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-md">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
          Start Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-12 pb-32 lg:pb-12">
      <div className="flex items-center gap-2 mb-6 lg:mb-8">
        <button onClick={() => navigate(-1)} className="lg:hidden p-2 -ml-2"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">Shopping Cart <span className="text-gray-400 text-base lg:text-lg font-normal">({cartItems.length})</span></h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* ITEMS LIST */}
        <div className="flex-1 space-y-4 lg:space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm relative">
              {/* Image */}
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 p-2">
                 {item.image ? <img src={item.image} className="w-full h-full object-contain mix-blend-multiply"/> : <span className="text-xs text-gray-400">Img</span>}
              </div>

              {/* Info (Desktop & Mobile Shared Logic) */}
              <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="mb-2 lg:mb-0">
                  <h3 className="font-bold text-base lg:text-lg text-gray-900 line-clamp-2">{item.name}</h3>
                  <p className="text-blue-600 font-bold text-sm lg:text-base mt-1">{item.price}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between lg:gap-6">
                  <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    <button className="p-1 hover:text-red-500 text-gray-400 cursor-not-allowed" disabled><Minus size={14} /></button>
                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="p-1 hover:text-green-500 transition-colors"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 lg:p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Link to="/shop" className="hidden lg:inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mt-4">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>

        {/* SUMMARY */}
        <div className="w-full lg:w-96">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 sticky top-24">
            <h3 className="text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-3 text-sm text-gray-600 mb-6 border-b border-gray-200 pb-6 lg:border-0 lg:pb-0">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">£{cartTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">Free</span></div>
              <div className="flex justify-between"><span>Tax (Est.)</span><span>£{(cartTotal * 0.2).toLocaleString()}</span></div>
            </div>
            <div className="flex justify-between items-center mb-6 lg:border-t lg:border-gray-200 lg:pt-4">
              <span className="font-bold text-lg">Total</span><span className="font-bold text-2xl">£{(cartTotal * 1.2).toLocaleString()}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2">
              Checkout Now <ArrowRight size={18} className="hidden lg:block"/>
            </button>
            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span> Secure Encrypted Payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;