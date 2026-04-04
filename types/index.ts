// User roles
export type UserRole = 'customer' | 'staff' | 'admin';

// Order types
export type OrderType = 'pickup' | 'delivery';

// Order status flow
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'picked_up'
  | 'cancelled';

// Payment status
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

// User profile (extends Supabase auth)
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  default_address: string | null;
  created_at: string;
  updated_at: string;
}

// Menu category
export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Menu item
export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  customization_options: CustomizationOption[] | null;
  created_at: string;
  updated_at: string;
}

// Customization options (stored as JSONB)
export interface CustomizationOption {
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  choices: {
    label: string;
    price_modifier: number;
  }[];
}

// Order
export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  order_type: OrderType;
  total: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  pickup_code: string | null;
  delivery_address: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

// Order item
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  customizations: Record<string, string | string[]> | null;
  item_price: number;
  item_name: string;
}

// Cart item (client-side only)
export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  customizations: Record<string, string | string[]> | null;
  subtotal: number;
}

// Store settings
export interface StoreSettings {
  id: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_lat: number;
  store_lng: number;
  tax_rate: number;
  delivery_fee: number;
  max_delivery_radius_miles: number;
  operating_hours: Record<string, { open: string; close: string }>;
  delivery_hours: Record<string, { open: string; close: string }>;
  is_open: boolean;
}