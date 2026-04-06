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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { OrdersSkeleton } from '../../components/Skeleton';

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

type OrderRow = {
  id: string;
  order_type: 'pickup' | 'delivery';
  status: string;
  payment_status: string;
  total: string;
  pickup_code: string | null;
  delivery_address: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  placed: { label: 'Order Placed', color: '#6B7280', icon: 'receipt-outline' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparing', color: '#F59E0B', icon: 'restaurant-outline' },
  ready: { label: 'Ready for Pickup', color: '#10B981', icon: 'bag-check-outline' },
  out_for_delivery: { label: 'Out for Delivery', color: '#8B5CF6', icon: 'bicycle-outline' },
  delivered: { label: 'Delivered', color: '#059669', icon: 'checkmark-done-outline' },
  picked_up: { label: 'Picked Up', color: '#059669', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export default function OrdersScreen() {
  const { session, loading: authLoading } = useAuth();
  const user = session?.user;
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_type, status, payment_status, total, pickup_code, delivery_address, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch orders error:', error);
      return;
    }
    setOrders((data || []) as OrderRow[]);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    })();
  }, [user, authLoading, fetchOrders]);

  // Realtime subscription to order status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

 if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <OrdersSkeleton />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <Ionicons name="person-circle-outline" size={70} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Log in to see your orders</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.primaryBtnText}>Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.centerWrap}>
          <Ionicons name="receipt-outline" size={70} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.primaryBtnText}>Browse Menu</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerCount}>{orders.length}</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.placed;
          return (
         <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
              ]}
              onPress={() => router.push(`/order/${item.id}`)}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
                  <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>

              <View style={styles.cardMiddleRow}>
                <View style={styles.typeWrap}>
                  <Ionicons
                    name={item.order_type === 'pickup' ? 'bag-handle-outline' : 'bicycle-outline'}
                    size={18}
                    color={COLORS.green}
                  />
                  <Text style={styles.typeText}>
                    {item.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
                  </Text>
                </View>
                <Text style={styles.totalText}>${parseFloat(item.total).toFixed(2)}</Text>
              </View>

              {item.pickup_code ? (
                <View style={styles.codeRow}>
                  <Text style={styles.codeLabel}>Pickup Code:</Text>
                  <Text style={styles.codeValue}>{item.pickup_code}</Text>
                </View>
              ) : null}

              <View style={styles.cardBottom}>
                <Text style={styles.orderIdText}>#{item.id.substring(0, 8)}</Text>
                <View style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.green} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.green },
  headerCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    backgroundColor: COLORS.green,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.green, marginTop: 14 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  dateText: { fontSize: 12, color: COLORS.gray },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  totalText: { fontSize: 17, fontWeight: '800', color: COLORS.green },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  codeLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  codeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green,
    letterSpacing: 3,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 8,
    marginTop: 4,
  },
  orderIdText: { fontSize: 11, color: COLORS.gray, fontFamily: 'monospace' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.green },
});