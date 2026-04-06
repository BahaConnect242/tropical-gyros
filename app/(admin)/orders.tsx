import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const COLORS = {
  bg: '#F0EAD8',
  green: '#163D26',
  gold: '#F2B234',
  red: '#E63946',
  white: '#FFFFFF',
  gray: '#8A8A8A',
  lightGray: '#E5E5E5',
  dark: '#1A1A1A',
};

type AdminOrder = {
  id: string;
  order_type: 'pickup' | 'delivery';
  status: string;
  payment_status: string;
  total: string;
  pickup_code: string | null;
  delivery_address: string | null;
  special_instructions: string | null;
  created_at: string;
};

type OrderItemRow = {
  item_name: string;
  quantity: number;
  item_price: string;
  customizations: Record<string, string[]> | null;
};

const STATUS_FLOW_PICKUP = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up'];
const STATUS_FLOW_DELIVERY = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  placed: { label: 'Placed', color: '#6B7280', icon: 'receipt-outline' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparing', color: '#F59E0B', icon: 'restaurant-outline' },
  ready: { label: 'Ready', color: '#10B981', icon: 'bag-check-outline' },
  out_for_delivery: { label: 'Out for Delivery', color: '#8B5CF6', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', color: '#059669', icon: 'checkmark-done-outline' },
  picked_up: { label: 'Picked Up', color: '#059669', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
};

function getNextStatus(orderType: 'pickup' | 'delivery', current: string): string | null {
  const flow = orderType === 'pickup' ? STATUS_FLOW_PICKUP : STATUS_FLOW_DELIVERY;
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function getNextLabel(orderType: 'pickup' | 'delivery', current: string): string | null {
  const next = getNextStatus(orderType, current);
  if (!next) return null;
  const labels: Record<string, string> = {
    confirmed: 'Confirm Order',
    preparing: 'Start Preparing',
    ready: 'Mark Ready',
    out_for_delivery: 'Send for Delivery',
    delivered: 'Mark Delivered',
    picked_up: 'Mark Picked Up',
  };
  return labels[next] || next;
}

function timeSince(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function parseContactFromNotes(notes: string | null): { name: string; phone: string } {
  if (!notes) return { name: '', phone: '' };
  const match = notes.match(/Contact:\s*([^|]+)\|\s*([^|]+)/);
  if (match) return { name: match[1].trim(), phone: match[2].trim() };
  return { name: '', phone: '' };
}

export default function AdminOrdersScreen() {
  const { session, loading: authLoading } = useAuth();
  const user = session?.user;
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItemRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('id, order_type, status, payment_status, total, pickup_code, delivery_address, special_instructions, created_at')
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery']);
    } else if (filter === 'completed') {
      query = query.in('status', ['delivered', 'picked_up', 'cancelled']);
    }

    const { data, error } = await query;
    if (error) { console.error(error); return; }
    const orderList = (data || []) as AdminOrder[];
    setOrders(orderList);

    // Fetch items for all orders
    const ids = orderList.map((o) => o.id);
    if (ids.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('order_id, item_name, quantity, item_price, customizations')
        .in('order_id', ids);

      const grouped: Record<string, OrderItemRow[]> = {};
      (itemsData || []).forEach((item: any) => {
        if (!grouped[item.order_id]) grouped[item.order_id] = [];
        grouped[item.order_id].push(item);
      });
      setOrderItems(grouped);
    }
  }, [filter]);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    })();
  }, [authLoading, fetchOrders]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
}, [fetchOrders]);

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const advanceStatus = async (order: AdminOrder) => {
    const next = getNextStatus(order.order_type, order.status);
    if (!next) return;
    setUpdating(order.id);
    const { error } = await supabase
      .from('orders')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', order.id);
if (error) {
      console.error(error);
      if (Platform.OS === 'web') window.alert('Failed to update status');
    }
    await fetchOrders();
    setUpdating(null);
  };

  const cancelOrder = async (orderId: string) => {
    const proceed = Platform.OS === 'web'
      ? window.confirm('Cancel this order?')
      : true;
    if (!proceed) return;
    setUpdating(orderId);
await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    await fetchOrders();
    setUpdating(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Staff Orders', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: COLORS.gold, headerTitleStyle: { fontWeight: '700' } }} />
        <View style={styles.centerWrap}><ActivityIndicator size="large" color={COLORS.green} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Staff Orders', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: COLORS.gold, headerTitleStyle: { fontWeight: '700' } }} />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['active', 'completed', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {orders.length === 0 ? (
        <View style={styles.centerWrap}>
          <Ionicons name="checkmark-done-circle-outline" size={60} color={COLORS.gray} />
          <Text style={styles.emptyText}>No {filter} orders</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.placed;
            const nextLabel = getNextLabel(item.order_type, item.status);
            const contact = parseContactFromNotes(item.special_instructions);
            const items = orderItems[item.id] || [];
            const isFinal = ['delivered', 'picked_up', 'cancelled'].includes(item.status);
            const isUpdating = updating === item.id;

            return (
              <View style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
                    <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.timeText}>{timeSince(item.created_at)}</Text>
                </View>

                {/* Type + Total */}
                <View style={styles.row}>
                  <View style={styles.typeWrap}>
                    <Ionicons
                      name={item.order_type === 'pickup' ? 'bag-handle' : 'bicycle'}
                      size={18}
                      color={COLORS.green}
                    />
                    <Text style={styles.typeText}>
                      {item.order_type === 'pickup' ? 'PICKUP' : 'DELIVERY'}
                    </Text>
                    {item.pickup_code && (
                      <Text style={styles.pickupCode}>#{item.pickup_code}</Text>
                    )}
                  </View>
                  <Text style={styles.totalText}>${parseFloat(item.total).toFixed(2)}</Text>
                </View>

                {/* Customer */}
                {contact.name ? (
                  <View style={styles.contactRow}>
                    <Ionicons name="person-outline" size={14} color={COLORS.gray} />
                    <Text style={styles.contactText}>{contact.name}</Text>
                    <Ionicons name="call-outline" size={14} color={COLORS.gray} style={{ marginLeft: 10 }} />
                    <Text style={styles.contactText}>{contact.phone}</Text>
                  </View>
                ) : null}

                {/* Delivery address */}
                {item.delivery_address && (
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                    <Text style={styles.addressText}>{item.delivery_address}</Text>
                  </View>
                )}

                {/* Items */}
                <View style={styles.itemsBox}>
                  {items.map((it, idx) => (
                    <Text key={idx} style={styles.itemLine}>
                      {it.quantity}× {it.item_name}
                    </Text>
                  ))}
                </View>

                {/* Action buttons */}
                {!isFinal && (
                  <View style={styles.actionRow}>
                    {nextLabel && (
                      <Pressable
                        style={[styles.advanceBtn, isUpdating && { opacity: 0.5 }]}
                        onPress={() => advanceStatus(item)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <>
                            <Ionicons name="arrow-forward-circle" size={18} color={COLORS.white} />
                            <Text style={styles.advanceBtnText}>{nextLabel}</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => cancelOrder(item.id)}
                      disabled={isUpdating}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={COLORS.red} />
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                )}

                <Text style={styles.orderId}>#{item.id.substring(0, 8)}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginTop: 12 },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  filterTabActive: { backgroundColor: COLORS.green },
  filterTabText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  filterTabTextActive: { color: COLORS.white },
  listContent: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  timeText: { fontSize: 12, color: COLORS.gray },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontSize: 13, fontWeight: '800', color: COLORS.green, letterSpacing: 0.5 },
  pickupCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gold,
    marginLeft: 4,
  },
  totalText: { fontSize: 18, fontWeight: '800', color: COLORS.green },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  contactText: { fontSize: 12, color: COLORS.dark },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  addressText: { fontSize: 12, color: COLORS.dark },
  itemsBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  itemLine: { fontSize: 13, color: COLORS.dark, paddingVertical: 2 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  advanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    borderRadius: 10,
  },
  advanceBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  cancelBtnText: { color: COLORS.red, fontWeight: '700', fontSize: 13 },
  orderId: { fontSize: 10, color: COLORS.gray, fontFamily: 'monospace', textAlign: 'right' },
});