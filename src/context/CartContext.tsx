// src/context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderItem, OrderItemAddon } from '../services/api.service';

const CART_STORAGE_KEY = '@tiffsy_cart';
const CART_CONTEXT_STORAGE_KEY = '@tiffsy_cart_context';

// Addon item in cart
export interface CartItemAddon {
  addonId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

// Cart item interface
export interface CartItem {
  id: string;                    // menuItemId
  name: string;
  image: any;
  subtitle: string;
  price: number;                 // Unit price
  quantity: number;
  hasVoucher?: boolean;          // Can use voucher for this item
  addons?: CartItemAddon[];      // Nested addons
}

// Menu type for order
export type MenuType = 'MEAL_MENU' | 'ON_DEMAND_MENU';

// Meal window for MEAL_MENU orders
export type MealWindow = 'LUNCH' | 'DINNER';

interface CartContextType {
  // Cart items
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  replaceCart: (item: CartItem) => void;  // Atomic clear + add (avoids race condition)
  updateQuantity: (id: string, quantity: number) => void;
  updateAddonQuantity: (itemId: string, addonIndex: number, quantity: number) => void;
  addAddonToItem: (itemId: string, addon: CartItemAddon) => void;
  removeAddon: (itemId: string, addonIndex: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;

  // Order context
  kitchenId: string | null;
  menuType: MenuType | null;
  mealWindow: MealWindow | null;
  deliveryAddressId: string | null;
  voucherCount: number;
  couponCode: string | null;
  specialInstructions: string;
  deliveryNotes: string;

  // Setters for order context
  setKitchenId: (id: string | null) => void;
  setMenuType: (type: MenuType | null) => void;
  setMealWindow: (window: MealWindow | null) => void;
  setDeliveryAddressId: (id: string | null) => void;
  setVoucherCount: (count: number) => void;
  setCouponCode: (code: string | null) => void;
  setSpecialInstructions: (instructions: string) => void;
  setDeliveryNotes: (notes: string) => void;

  // Helper to build order items for API
  getOrderItems: () => OrderItem[];

  // Reset order context (after successful order)
  resetOrderContext: () => void;

  // Check if cart is ready for checkout
  isReadyForCheckout: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Cart items state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Order context state
  const [kitchenId, setKitchenId] = useState<string | null>(null);
  const [menuType, setMenuType] = useState<MenuType | null>(null);
  const [mealWindow, setMealWindow] = useState<MealWindow | null>(null);
  const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
  const [voucherCount, setVoucherCount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const [cartData, contextData] = await Promise.all([
          AsyncStorage.getItem(CART_STORAGE_KEY),
          AsyncStorage.getItem(CART_CONTEXT_STORAGE_KEY),
        ]);

        let savedMealWindow: MealWindow | null = null;

        // Load context first to get meal window
        if (contextData) {
          const context = JSON.parse(contextData);
          savedMealWindow = context.mealWindow;
          if (context.kitchenId) setKitchenId(context.kitchenId);
          if (context.menuType) setMenuType(context.menuType);
          if (context.mealWindow) setMealWindow(context.mealWindow);
          if (context.deliveryAddressId) setDeliveryAddressId(context.deliveryAddressId);
          if (context.voucherCount) setVoucherCount(context.voucherCount);
          if (context.couponCode) setCouponCode(context.couponCode);
          if (context.specialInstructions) setSpecialInstructions(context.specialInstructions);
          if (context.deliveryNotes) setDeliveryNotes(context.deliveryNotes);
          console.log('[CartContext] Loaded cart context from storage');
        }

        // Load cart and reconstruct images based on saved meal window
        if (cartData) {
          const parsedCart = JSON.parse(cartData);

          // Reconstruct image objects based on saved meal window
          const cartWithImages = parsedCart.map((item: any) => ({
            ...item,
            image: savedMealWindow === 'LUNCH'
              ? require('../assets/images/homepage/lunch2.png')
              : require('../assets/images/homepage/dinneritem.png'),
          }));

          setCartItems(cartWithImages);
          console.log('[CartContext] Loaded cart from storage:', parsedCart.length, 'items');
        }
      } catch (error) {
        console.error('[CartContext] Error loading cart from storage:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save on initial load

    const saveCart = async () => {
      try {
        // Remove image objects before saving (they can't be serialized)
        const cartToSave = cartItems.map(({ image, ...item }) => item);
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartToSave));
        console.log('[CartContext] Saved cart to storage:', cartItems.length, 'items');
      } catch (error) {
        console.error('[CartContext] Error saving cart:', error);
      }
    };

    saveCart();
  }, [cartItems, isLoaded]);

  // Save cart context to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save on initial load

    const saveContext = async () => {
      try {
        const context = {
          kitchenId,
          menuType,
          mealWindow,
          deliveryAddressId,
          voucherCount,
          couponCode,
          specialInstructions,
          deliveryNotes,
        };
        await AsyncStorage.setItem(CART_CONTEXT_STORAGE_KEY, JSON.stringify(context));
        console.log('[CartContext] Saved cart context to storage');
      } catch (error) {
        console.error('[CartContext] Error saving cart context:', error);
      }
    };

    saveContext();
  }, [kitchenId, menuType, mealWindow, deliveryAddressId, voucherCount, couponCode, specialInstructions, deliveryNotes, isLoaded]);

  const addToCart = useCallback((item: CartItem) => {
    console.log('[CartContext] addToCart called with item:', JSON.stringify({
      id: item.id,
      name: item.name,
      addons: item.addons,
    }));
    setCartItems(prevItems => {
      console.log('[CartContext] addToCart - prevItems count:', prevItems.length);
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        console.log('[CartContext] addToCart - Found existing item, updating with addons');
        // Update quantity AND addons for existing item
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity, addons: item.addons } : i
        );
      }
      console.log('[CartContext] addToCart - Adding new item with addons:', item.addons?.length || 0);
      return [...prevItems, item];
    });
  }, []);

  // Replace cart with a single item (atomic clear + add to avoid race conditions)
  const replaceCart = useCallback((item: CartItem) => {
    console.log('[CartContext] replaceCart called with item:', JSON.stringify({
      id: item.id,
      name: item.name,
      addons: item.addons,
    }));
    // Single atomic operation - clear and set new item
    setCartItems([item]);
    // Also reset voucher and coupon when replacing cart
    setVoucherCount(0);
    setCouponCode(null);
    setSpecialInstructions('');
    setDeliveryNotes('');
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  // Update addon quantity for a specific item
  const updateAddonQuantity = useCallback((itemId: string, addonIndex: number, quantity: number) => {
    // If quantity is 0 or less, remove the addon
    if (quantity <= 0) {
      removeAddon(itemId, addonIndex);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId && item.addons) {
          const updatedAddons = item.addons.map((addon, idx) =>
            idx === addonIndex ? { ...addon, quantity } : addon
          );
          return { ...item, addons: updatedAddons };
        }
        return item;
      })
    );
  }, [removeAddon]);

  // Remove an addon from a specific item
  const removeAddon = useCallback((itemId: string, addonIndex: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId && item.addons) {
          const updatedAddons = item.addons.filter((_, idx) => idx !== addonIndex);
          return { ...item, addons: updatedAddons.length > 0 ? updatedAddons : undefined };
        }
        return item;
      })
    );
  }, []);

  // Add an addon to an existing cart item (or increment quantity if already present)
  const addAddonToItem = useCallback((itemId: string, addon: CartItemAddon) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const existingAddons = item.addons || [];
          const existingIndex = existingAddons.findIndex(a => a.addonId === addon.addonId);
          if (existingIndex >= 0) {
            const updatedAddons = existingAddons.map((a, idx) =>
              idx === existingIndex ? { ...a, quantity: a.quantity + addon.quantity } : a
            );
            return { ...item, addons: updatedAddons };
          }
          return { ...item, addons: [...existingAddons, addon] };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    // Also reset voucher and coupon when clearing cart
    setVoucherCount(0);
    setCouponCode(null);
    setSpecialInstructions('');
    setDeliveryNotes('');

    // Clear from AsyncStorage
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      await AsyncStorage.removeItem(CART_CONTEXT_STORAGE_KEY);
      console.log('[CartContext] Cleared cart from storage');
    } catch (error) {
      console.error('[CartContext] Error clearing cart from storage:', error);
    }
  }, []);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const getSubtotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      // Item total
      let itemTotal = item.price * item.quantity;

      // Add addon totals
      if (item.addons && item.addons.length > 0) {
        const addonTotal = item.addons.reduce(
          (sum, addon) => sum + addon.unitPrice * addon.quantity,
          0
        );
        itemTotal += addonTotal * item.quantity; // Addons per item quantity
      }

      return total + itemTotal;
    }, 0);
  }, [cartItems]);

  // Helper to check if ID is a valid MongoDB ObjectId (24-character hex string)
  const isValidObjectId = (id: string): boolean => {
    return /^[a-fA-F0-9]{24}$/.test(id);
  };

  // Build order items for API call
  const getOrderItems = useCallback((): OrderItem[] => {
    return cartItems.map(item => {
      // Validate menuItemId
      if (!isValidObjectId(item.id)) {
        console.warn('[CartContext] Invalid menuItemId:', item.id, '- this may cause API errors');
      }

      const orderItem: OrderItem = {
        menuItemId: item.id,
        quantity: item.quantity,
      };

      // Add addons if present - only include addons with valid ObjectIds
      if (item.addons && item.addons.length > 0) {
        const validAddons = item.addons.filter(addon => {
          const isValid = isValidObjectId(addon.addonId);
          if (!isValid) {
            console.warn('[CartContext] Excluding addon with invalid ID:', addon.addonId, addon.name);
          }
          return isValid;
        });

        if (validAddons.length > 0) {
          orderItem.addons = validAddons.map(addon => ({
            addonId: addon.addonId,
            quantity: addon.quantity,
          }));
        }
      }

      return orderItem;
    });
  }, [cartItems]);

  // Reset order context after successful order
  const resetOrderContext = useCallback(async () => {
    setCartItems([]);
    setKitchenId(null);
    setMenuType(null);
    setMealWindow(null);
    // Keep delivery address selected
    setVoucherCount(0);
    setCouponCode(null);
    setSpecialInstructions('');
    setDeliveryNotes('');

    // Clear from AsyncStorage
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      await AsyncStorage.removeItem(CART_CONTEXT_STORAGE_KEY);
      console.log('[CartContext] Reset cart context and cleared storage');
    } catch (error) {
      console.error('[CartContext] Error clearing cart from storage:', error);
    }
  }, []);

  // Check if cart is ready for checkout
  const isReadyForCheckout = useCallback(() => {
    return (
      cartItems.length > 0 &&
      kitchenId !== null &&
      menuType !== null &&
      deliveryAddressId !== null &&
      (menuType === 'ON_DEMAND_MENU' || mealWindow !== null)
    );
  }, [cartItems, kitchenId, menuType, mealWindow, deliveryAddressId]);

  return (
    <CartContext.Provider
      value={{
        // Cart items
        cartItems,
        addToCart,
        replaceCart,
        updateQuantity,
        updateAddonQuantity,
        addAddonToItem,
        removeAddon,
        removeItem,
        clearCart,
        getTotalItems,
        getSubtotal,

        // Order context
        kitchenId,
        menuType,
        mealWindow,
        deliveryAddressId,
        voucherCount,
        couponCode,
        specialInstructions,
        deliveryNotes,

        // Setters
        setKitchenId,
        setMenuType,
        setMealWindow,
        setDeliveryAddressId,
        setVoucherCount,
        setCouponCode,
        setSpecialInstructions,
        setDeliveryNotes,

        // Helpers
        getOrderItems,
        resetOrderContext,
        isReadyForCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
