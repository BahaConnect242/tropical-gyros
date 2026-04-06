import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

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

const PAYPAL_CLIENT_ID = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID;

function generatePickupCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const { items, clearCart } = useCart();
const { session, loading: authLoading } = useAuth();
  const user = session?.user;  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  const total = parseFloat((params.total as string) || '0');
  const orderType = params.orderType as 'pickup' | 'delivery';

  const createOrder = async (paypalTxId: string) => {
    if (!user) throw new Error('Not logged in');

    const pickupCode = orderType === 'pickup' ? generatePickupCode() : null;

    const contactInfo = `Contact: ${params.name} | ${params.phone}${params.email ? ' | ' + params.email : ''}`;
    const fullNotes = [contactInfo, params.notes ? `Notes: ${params.notes}` : '']
      .filter(Boolean)
      .join(' | ');

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_type: orderType,
        total,
        payment_status: 'paid',
        payment_method: `paypal:${paypalTxId}`,
        pickup_code: pickupCode,
        delivery_address: orderType === 'delivery' ? (params.address as string) : null,
        special_instructions: fullNotes,
      })
      .select()
      .single();

    if (orderErr || !order) throw orderErr || new Error('Order creation failed');

    const orderItems = items.map((it) => ({
      order_id: order.id,
      menu_item_id: it.menu_item_id,
      quantity: it.quantity,
      customizations: it.customizations,
      item_price: it.price,
      item_name: it.name,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    return order;
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setStatus('error');
      setErrorMsg('Mobile payments coming soon. Use the web app for now.');
      return;
    }

    if (!PAYPAL_CLIENT_ID) {
      setStatus('error');
      setErrorMsg('PayPal not configured. Check .env file.');
      return;
    }

 if (authLoading) {
      return; // wait for auth to finish loading
    }

    if (!user) {
      setStatus('error');
      setErrorMsg('Please log in to complete payment.');
      return;
    }

    // Load PayPal SDK
    const existingScript = document.querySelector('script[data-paypal-sdk]');
    if (existingScript) {
      setStatus('ready');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.setAttribute('data-paypal-sdk', 'true');
    script.async = true;
    script.onload = () => setStatus('ready');
    script.onerror = () => {
      setStatus('error');
      setErrorMsg('Failed to load PayPal. Check your internet connection.');
    };
    document.body.appendChild(script);
}, [user, authLoading]);
  useEffect(() => {
    if (status !== 'ready' || buttonsRendered.current) return;
    if (!paypalRef.current) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    buttonsRendered.current = true;

    paypal
      .Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: total.toFixed(2), currency_code: 'USD' },
                description: `Tropical Gyros - ${orderType} order`,
              },
            ],
          });
        },
        onApprove: async (_data: any, actions: any) => {
          setStatus('processing');
          try {
            const capture = await actions.order.capture();
            const txId = capture.id;
            const order = await createOrder(txId);
            clearCart();
            router.replace({
              pathname: '/order-success',
              params: {
                orderId: order.id,
                pickupCode: order.pickup_code || '',
                orderType,
                total: total.toFixed(2),
              },
            });
          } catch (err: any) {
            console.error('Order creation failed:', err);
            setStatus('error');
            setErrorMsg(err.message || 'Something went wrong saving your order. Please contact support — your payment went through.');
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          setStatus('error');
          setErrorMsg('Payment failed. Please try again.');
        },
        onCancel: () => {
          setStatus('ready');
        },
      })
      .render(paypalRef.current);
  }, [status]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Payment',
          headerStyle: { backgroundColor: COLORS.green },
          headerTintColor: COLORS.gold,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Order Type</Text>
            <Text style={styles.rowValue}>{orderType === 'pickup' ? 'Pickup' : 'Delivery'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Items</Text>
            <Text style={styles.rowValue}>${params.subtotal}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tax</Text>
            <Text style={styles.rowValue}>${params.tax}</Text>
          </View>
          {orderType === 'delivery' && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Delivery Fee</Text>
              <Text style={styles.rowValue}>${params.deliveryFee}</Text>
            </View>
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${params.total}</Text>
          </View>
        </View>

        <Text style={styles.payWithLabel}>Pay with PayPal</Text>

        {status === 'loading' && (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.hint}>Loading PayPal...</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {status === 'processing' && (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.hint}>Processing your order...</Text>
          </View>
        )}

        {Platform.OS === 'web' && (
          <View
            // @ts-ignore - web-only ref
            ref={paypalRef}
            style={{ marginTop: 16, minHeight: 200 }}
          />
        )}

        <Text style={styles.disclaimer}>
          This is a sandbox/test payment. No real money will be charged.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  rowLabel: { fontSize: 14, color: COLORS.gray },
  rowValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  totalValue: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  payWithLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerWrap: { alignItems: 'center', padding: 30 },
  hint: { marginTop: 12, color: COLORS.gray },
  errorBox: {
    backgroundColor: '#FDECEC',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  errorText: { color: COLORS.red, fontSize: 14 },
  disclaimer: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});