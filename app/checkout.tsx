import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';

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

const TAX_RATE = 0.10;
const DELIVERY_FEE = 5.00;

type OrderType = 'pickup' | 'delivery';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
}

export default function CheckoutScreen() {
  const { items, subtotal, item_count } = useCart();
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const tax = subtotal * TAX_RATE;
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + tax + deliveryFee;

  const canProceed = () => {
    if (!name.trim() || !phone.trim()) return false;
    if (orderType === 'delivery' && !address.trim()) return false;
    return true;
  };

  const handleProceed = () => {
    if (!canProceed()) {
      showAlert('Missing info', 'Please fill in all required fields.');
      return;
    }
    router.push({
      pathname: '/payment',
      params: {
        orderType,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        total: total.toFixed(2),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
      },
    });
  };

  if (item_count === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Checkout',
          headerStyle: { backgroundColor: COLORS.green },
          headerTintColor: COLORS.gold,
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Order type toggle */}
          <Text style={styles.sectionLabel}>Order Type</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, orderType === 'pickup' && styles.toggleBtnActive]}
              onPress={() => setOrderType('pickup')}
            >
              <Ionicons
                name="bag-handle-outline"
                size={22}
                color={orderType === 'pickup' ? COLORS.white : COLORS.green}
              />
              <Text style={[styles.toggleText, orderType === 'pickup' && styles.toggleTextActive]}>
                Pickup
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, orderType === 'delivery' && styles.toggleBtnActive]}
              onPress={() => setOrderType('delivery')}
            >
              <Ionicons
                name="bicycle-outline"
                size={22}
                color={orderType === 'delivery' ? COLORS.white : COLORS.green}
              />
              <Text
                style={[styles.toggleText, orderType === 'delivery' && styles.toggleTextActive]}
              >
                Delivery
              </Text>
            </Pressable>
          </View>

          {/* Customer info */}
          <Text style={styles.sectionLabel}>Contact Info</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor={COLORS.gray}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            placeholderTextColor={COLORS.gray}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email (optional)"
            placeholderTextColor={COLORS.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {orderType === 'delivery' && (
            <>
              <Text style={styles.sectionLabel}>Delivery Address</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Street address, apt, landmark *"
                placeholderTextColor={COLORS.gray}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </>
          )}

          <Text style={styles.sectionLabel}>Order Notes</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Anything we should know?"
            placeholderTextColor={COLORS.gray}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Order summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Items ({item_count})</Text>
              <Text style={styles.sumValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Tax (10%)</Text>
              <Text style={styles.sumValue}>${tax.toFixed(2)}</Text>
            </View>
            {orderType === 'delivery' && (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Delivery Fee</Text>
                <Text style={styles.sumValue}>${deliveryFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.sumRow, styles.sumRowFinal]}>
              <Text style={styles.sumTotalLabel}>Total</Text>
              <Text style={styles.sumTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.payBtn, !canProceed() && styles.payBtnDisabled]}
            onPress={handleProceed}
            disabled={!canProceed()}
          >
            <Text style={styles.payBtnText}>Continue to Payment · ${total.toFixed(2)}</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 24 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: COLORS.gray, marginBottom: 16 },
  backBtn: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: { color: COLORS.white, fontWeight: '700' },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  toggleBtnActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  toggleText: { fontSize: 15, fontWeight: '700', color: COLORS.green },
  toggleTextActive: { color: COLORS.white },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.dark,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  summary: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 8,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sumRowFinal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginTop: 6,
    paddingTop: 10,
  },
  sumLabel: { fontSize: 14, color: COLORS.gray },
  sumValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },
  sumTotalLabel: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  sumTotalValue: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  footer: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  payBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnDisabled: { backgroundColor: COLORS.gray },
  payBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});