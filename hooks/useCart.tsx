import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, MenuItem } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────
type CartState = {
  items: CartItem[];
  is_loaded: boolean;
};

type CartAction =
  | { type: 'HYDRATE'; items: CartItem[] }
  | { type: 'ADD'; item: CartItem }
  | { type: 'UPDATE_QTY'; cart_item_id: string; quantity: number }
  | { type: 'REMOVE'; cart_item_id: string }
  | { type: 'CLEAR' };

type CartContextValue = {
  items: CartItem[];
  item_count: number;
  subtotal: number;
  is_loaded: boolean;
  addItem: (
    menuItem: MenuItem,
    quantity: number,
    customizations?: Record<string, string[]>,
    special_instructions?: string
  ) => void;
  updateQuantity: (cart_item_id: string, quantity: number) => void;
  removeItem: (cart_item_id: string) => void;
  clearCart: () => void;
};

// ─── Constants ─────────────────────────────────────────────────────────
const STORAGE_KEY = '@tropical_gyros_cart';

// ─── Reducer ───────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items, is_loaded: true };

    case 'ADD': {
      // Same menu item + same customizations + same notes = merge quantities
      const existingIndex = state.items.findIndex(
        (i) =>
          i.menu_item_id === action.item.menu_item_id &&
          JSON.stringify(i.customizations) ===
            JSON.stringify(action.item.customizations) &&
          i.special_instructions === action.item.special_instructions
      );

      if (existingIndex >= 0) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + action.item.quantity,
        };
        return { ...state, items: updated };
      }

      return { ...state, items: [...state.items, action.item] };
    }

    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.cart_item_id === action.cart_item_id
              ? { ...i, quantity: action.quantity }
              : i
          )
          .filter((i) => i.quantity > 0),
      };

    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter(
          (i) => i.cart_item_id !== action.cart_item_id
        ),
      };

    case 'CLEAR':
      return { ...state, items: [] };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    is_loaded: false,
  });

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const items: CartItem[] = raw ? JSON.parse(raw) : [];
        dispatch({ type: 'HYDRATE', items });
      } catch (err) {
        console.error('Failed to hydrate cart:', err);
        dispatch({ type: 'HYDRATE', items: [] });
      }
    })();
  }, []);

  // Persist to AsyncStorage whenever items change (after hydrate)
  useEffect(() => {
    if (!state.is_loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(
      (err) => console.error('Failed to persist cart:', err)
    );
  }, [state.items, state.is_loaded]);

  // ─── Actions ─────────────────────────────────────────────────────────
  const addItem: CartContextValue['addItem'] = (
    menuItem,
    quantity,
    customizations = {},
    special_instructions = ''
  ) => {
    const cartItem: CartItem = {
      cart_item_id: `${menuItem.id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      customizations,
      special_instructions,
      image_url: menuItem.image_url,
    };
    dispatch({ type: 'ADD', item: cartItem });
  };

  const updateQuantity = (cart_item_id: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QTY', cart_item_id, quantity });

  const removeItem = (cart_item_id: string) =>
    dispatch({ type: 'REMOVE', cart_item_id });

  const clearCart = () => dispatch({ type: 'CLEAR' });

  // ─── Derived values ──────────────────────────────────────────────────
  const item_count = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        item_count,
        subtotal,
        is_loaded: state.is_loaded,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}