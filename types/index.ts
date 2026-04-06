// ─── Enums ─────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'staff' | 'admin';

export type OrderType = 'pickup' | 'delivery';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// ─── Core DB Models ────────────────────────────────────────────────────
export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  default_address: string | null;
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type CustomizationOption = {
  group_name: string;
  required: boolean;
  multi_select: boolean;
  options: { name: string; price_delta: number }[];
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  customization_options: CustomizationOption[] | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  customizations: Record<string, string[]> | null;
  special_instructions: string | null;
};

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  order_type: OrderType;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  pickup_code: string | null;
  delivery_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  tax_rate: number;
  delivery_fee: number;
  delivery_radius_miles: number;
  store_lat: number | null;
  store_lng: number | null;
  is_open: boolean;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  updated_at: string;
};

// ─── Client-Side Cart ──────────────────────────────────────────────────
// Lives only in the app (AsyncStorage) — not a DB table.
// `cart_item_id` is a local unique ID so the same menu item with different
// customizations can appear as separate cart lines.
// `price` is a snapshot at add-to-cart time.
export type CartItem = {
  cart_item_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  customizations: Record<string, string[]>;
  special_instructions: string;
  image_url: string | null;
};