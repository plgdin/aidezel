import React, { createContext, useContext, useState, useEffect } from 'react';
import StockLimitModal from '../components/shared/StockLimitModal';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock_quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [stockModal, setStockModal] = useState({
    isOpen: false,
    limit: 0,
    name: ''
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('aidezel-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aidezel-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: any) => {
    let cleanPrice = product.price;
    if (typeof product.price === 'string') {
      cleanPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    }

    // Default to 100 ONLY if undefined. 
    // Ideally, all pages should now pass the correct stock.
    const stockLimit = product.stock_quantity !== undefined ? product.stock_quantity : 100;
    const quantityToAdd = product.quantity || 1;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      
      // Use the NEW stock limit if available, otherwise use the existing one
      const currentLimit = stockLimit !== undefined ? stockLimit : (existing ? existing.stock_quantity : 100);
      const currentQty = existing ? existing.quantity : 0;
      
      if (currentQty + quantityToAdd > currentLimit) {
        setStockModal({
            isOpen: true,
            limit: currentLimit,
            name: product.name
        });
        return prev;
      }

      if (existing) {
        return prev.map((item) =>
          item.id === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + quantityToAdd,
                // IMPORTANT: Update the limit in case the previous add didn't have it
                stock_quantity: currentLimit 
              } 
            : item
        );
      }

      return [...prev, { 
        id: product.id,
        name: product.name,
        image: product.image || product.image_url, 
        price: cleanPrice, 
        quantity: quantityToAdd,
        stock_quantity: currentLimit
      }];
    });
  };

  const removeFromCart = (id: string | number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const cartTotal = cartItems.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, cartCount, cartTotal }}>
      {children}
      <StockLimitModal 
        isOpen={stockModal.isOpen}
        stockLimit={stockModal.limit}
        productName={stockModal.name}
        onClose={() => setStockModal({ ...stockModal, isOpen: false })}
      />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};