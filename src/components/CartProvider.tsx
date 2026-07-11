"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  productName: string;
  productPrice: string;
  productImage: string;
  inStock: boolean;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addToCart: (productId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
  showNotification: boolean;
  notificationMessage: string;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  totalPrice: 0,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  refreshCart: async () => {},
  isLoading: false,
  showNotification: false,
  notificationMessage: "",
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const showToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2800);
  };

  const addToCart = async (productId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        await refreshCart();
        showToast("Added to cart! 🛒");
      }
    } catch {
      showToast("Failed to add to cart ❌");
    }
    setIsLoading(false);
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      await refreshCart();
    } catch {
      // silently fail
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId }),
      });
      await refreshCart();
      showToast("Removed from cart 🗑️");
    } catch {
      // silently fail
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + parseFloat(item.productPrice) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice,
        addToCart,
        updateQuantity,
        removeItem,
        refreshCart,
        isLoading,
        showNotification,
        notificationMessage,
      }}
    >
      {children}

      {/* Animated Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 ${
          showNotification
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-20 opacity-0 scale-90 pointer-events-none"
        }`}
      >
        <div className="glass-heavy rounded-2xl px-6 py-4 text-white font-medium shadow-2xl flex items-center gap-3 glow-amber">
          <span className="text-xl scale-in">✓</span>
          <span>{notificationMessage}</span>
          <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-amber-400 to-orange-500 rounded-b-2xl"
               style={{
                 animation: showNotification ? "shrinkBar 2.8s linear forwards" : "none",
                 width: "100%",
               }}
          />
        </div>
        <style>{`
          @keyframes shrinkBar {
            from { width: 100%; }
            to   { width: 0%; }
          }
        `}</style>
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
