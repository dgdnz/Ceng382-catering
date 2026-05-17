"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SelectedOption {
  groupName: string;
  optionName: string;
  priceChange: number;
}

export interface CartItem {
  id: string; // Composite key: menuItemId + serialized selectedOptions
  menuItemId: string;
  name: string;
  basePrice: number;
  imageUrl: string;
  selectedOptions: SelectedOption[];
  quantity: number;
  catererId: string;
  catererName: string;
}

interface CartContextType {
  cart: CartItem[];
  catererId: string | null;
  catererName: string | null;
  addToCart: (
    item: { id: string; name: string; price: number; imageUrl: string },
    selectedOptions: SelectedOption[],
    caterer: { id: string; name: string }
  ) => boolean | string; // Returns true on success, or string prompt
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catererId, setCatererId] = useState<string | null>(null);
  const [catererName, setCatererName] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("pink_dessert_cart");
    const savedCatererId = localStorage.getItem("pink_dessert_caterer_id");
    const savedCatererName = localStorage.getItem("pink_dessert_caterer_name");

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedCatererId) setCatererId(savedCatererId);
    if (savedCatererName) setCatererName(savedCatererName);
  }, []);

  // Save cart to localStorage on modification
  const saveCartToStorage = (
    newCart: CartItem[],
    newCatId: string | null,
    newCatName: string | null
  ) => {
    setCart(newCart);
    setCatererId(newCatId);
    setCatererName(newCatName);

    if (newCart.length > 0) {
      localStorage.setItem("pink_dessert_cart", JSON.stringify(newCart));
      localStorage.setItem("pink_dessert_caterer_id", newCatId || "");
      localStorage.setItem("pink_dessert_caterer_name", newCatName || "");
    } else {
      localStorage.removeItem("pink_dessert_cart");
      localStorage.removeItem("pink_dessert_caterer_id");
      localStorage.removeItem("pink_dessert_caterer_name");
    }
  };

  const addToCart = (
    item: { id: string; name: string; price: number; imageUrl: string },
    selectedOptions: SelectedOption[],
    caterer: { id: string; name: string }
  ): boolean | string => {
    // Single Caterer Cart Constraint
    if (catererId && catererId !== caterer.id) {
      return `Your cart contains sweet treats from "${catererName}". Would you like to clear your cart to add pastries from "${caterer.name}" instead?`;
    }

    // Generate unique composite ID for this item + customization combo
    const serializedOptions = [...selectedOptions]
      .sort((a, b) => a.optionName.localeCompare(b.optionName))
      .map((o) => `${o.groupName}:${o.optionName}`)
      .join("|");
    const cartItemId = `${item.id}-${serializedOptions}`;

    const existingIndex = cart.findIndex((i) => i.id === cartItemId);
    let newCart = [...cart];

    if (existingIndex > -1) {
      // Increment quantity
      newCart[existingIndex].quantity += 1;
    } else {
      // Add new item
      newCart.push({
        id: cartItemId,
        menuItemId: item.id,
        name: item.name,
        basePrice: item.price,
        imageUrl: item.imageUrl,
        selectedOptions,
        quantity: 1,
        catererId: caterer.id,
        catererName: caterer.name,
      });
    }

    saveCartToStorage(newCart, caterer.id, caterer.name);
    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    const newCart = cart.filter((i) => i.id !== cartItemId);
    const newCatId = newCart.length > 0 ? catererId : null;
    const newCatName = newCart.length > 0 ? catererName : null;
    saveCartToStorage(newCart, newCatId, newCatName);
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    const newCart = cart.map((i) => (i.id === cartItemId ? { ...i, quantity } : i));
    saveCartToStorage(newCart, catererId, catererName);
  };

  const clearCart = () => {
    saveCartToStorage([], null, null);
  };

  // Dynamically calculate cart total (base price + customization priceChanges) * quantity
  const cartTotal = cart.reduce((sum, item) => {
    const customizationSum = item.selectedOptions.reduce(
      (s, opt) => s + opt.priceChange,
      0
    );
    return sum + (item.basePrice + customizationSum) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        catererId,
        catererName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
