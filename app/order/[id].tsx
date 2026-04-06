import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

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

const STATUS_STEPS = ['placed', 'confirmed', 'preparing', 'ready'];
const DELIVERY_STEPS = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

type OrderDetail = {
  id: string;
  order_type: 'pickup' | 'delivery';
  status: string;
  payment_status: string;
  payment_method: string | null;
  total: string;
  pickup_code: string | null;
  delivery_address: string | null;
  special_instructions: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  item_name: string;
  quantity: number;
  item_price: string;
  customizations: Record<string, string[]> | null;
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (orderData) setOrder(orderData as OrderDetail);
    if (itemsData) setItems(itemsData as OrderItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => fetchOrder()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Order Details',
            headerStyle: { backgroundColor: COLORS.green },
            headerTintColor: COLORS.gold,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Order Details',
            headerStyle: { backgroundColor: COLORS.green },
            headerTintColor: COLORS.gold,
          }}
        />
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
  const steps = order.order_type === 'delivery' ? DELIVERY_STEPS : STATUS_STEPS;
  const currentIdx = steps.indexOf(order.status);
  const isFinal = ['delivered', 'picked_up', 'cancelled'].includes(order.status);
  const createdDate = new Date(order.created_at);

  const formatCustomizations = (customizations: Record<string, string[]> | null) => {
    if (!customizations) return '';
    const parts: string[] = [];
    Object.values(customizations).forEach((vals) => vals.forEach((v) => parts.push(v)));
    return parts.join(', ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: `Order #${order.id.substring(0, 8)}`,
          headerStyle: { backgroundColor: COLORS.green },
          headerTintColor: COLORS.gold,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: cfg.color + '18' }]}>
          <Ionicons name={cfg.icon} size={32} color={cfg.color} />
          <Text style={[styles.statusTitle, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Progress Tracker */}
        {!isFinal && (
          <View style={styles.progressWrap}>
            {steps.map((step, idx) => {
              const stepCfg = STATUS_CONFIG[step];
              const isActive = idx <= currentIdx;
              return (
                <View key={step} style={styles.progressStep}>
                  <View
                    style={[
                      styles.progressDot,
                      { backgroundColor: isActive ? COLORS.green : COLORS.lightGray },
                    ]}
                  >
                    {isActive && <Ionicons name="checkmark" size={12} color={COLORS.white} />}
                  </View>
                  <Text style={[styles.progressLabel, isActive && { color: COLORS.green, fontWeight: '700' }]}>
                    {stepCfg?.label.split(' ')[0] || step}
                  </Text>
                  {idx < steps.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        { backgroundColor: idx < currentIdx ? COLORS.green : COLORS.lightGray },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Pickup Code */}
        {order.pickup_code && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>PICKUP CODE</Text>
            <Text style={styles.codeValue}>{order.pickup_code}</Text>
            <Text style={styles.codeHint}>Show this code when picking up your order</Text>
          </View>
        )}

        {/* Order Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placed</Text>
            <Text style={styles.infoValue}>
              {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment</Text>
            <Text style={[styles.infoValue, { color: order.payment_status === 'paid' ? '#059669' : COLORS.red }]}>
              {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
            </Text>
          </View>
          {order.delivery_address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{order.delivery_address}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({items.length})</Text>
          {items.map((item) => {
            const customs = formatCustomizations(item.customizations);
            const lineTotal = item.quantity * parseFloat(item.item_price);
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQtyText}>{item.quantity}×</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  {customs ? <Text style={styles.itemCustom}>{customs}</Text> : null}
                </View>
                <Text style={styles.itemPrice}>${lineTotal.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Total */}
        <View style={styles.card}>
          <View style={[styles.infoRow, { paddingVertical: 2 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${parseFloat(order.total).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.orderId}>Order ID: {order.id}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: COLORS.gray },
  statusBanner: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  progressWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  progressStep: { alignItems: 'center', flex: 1, position: 'relative' },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: { fontSize: 9, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  progressLine: {
    position: 'absolute',
    top: 12,
    left: '60%',
    right: '-40%',
    height: 3,
    zIndex: -1,
  },
  codeBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  codeLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  codeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.green,
    letterSpacing: 8,
    marginVertical: 4,
  },
  codeHint: { fontSize: 12, color: COLORS.gray },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.green, marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 13, color: COLORS.gray },
  infoValue: { fontSize: 13, color: COLORS.dark, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemQtyBadge: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemQtyText: { fontSize: 13, fontWeight: '700', color: COLORS.green },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  itemCustom: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: COLORS.green, marginLeft: 8 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  totalValue: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  orderId: { fontSize: 11, color: COLORS.gray, textAlign: 'center', marginTop: 8, fontFamily: 'monospace' },
});