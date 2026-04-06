import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const COLORS = {
  bg: '#F0EAD8',
  green: '#163D26',
  gold: '#F2B234',
  white: '#FFFFFF',
  gray: '#8A8A8A',
  dark: '#1A1A1A',
};

export default function OrderSuccessScreen() {
  const params = useLocalSearchParams();
  const pickupCode = params.pickupCode as string;
  const orderType = params.orderType as string;
  const total = params.total as string;
  const orderId = params.orderId as string;

  const qrData = JSON.stringify({
    orderId,
    pickupCode,
    type: 'tropical-gyros-pickup',
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={90} color={COLORS.green} />
        </View>
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>Thank you for your order</Text>

        {pickupCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your Pickup Code</Text>
            <Text style={styles.codeValue}>{pickupCode}</Text>

            {Platform.OS !== 'web' && (
              <View style={styles.qrWrap}>
                <QRCode
                  value={qrData}
                  size={160}
                  color={COLORS.green}
                  backgroundColor={COLORS.white}
                />
              </View>
            )}

            {Platform.OS === 'web' && (
              <View style={styles.qrFallback}>
                <Ionicons name="qr-code-outline" size={80} color={COLORS.green} />
                <Text style={styles.qrFallbackText}>
                  QR code available in the mobile app
                </Text>
              </View>
            )}

            <Text style={styles.codeHint}>Show this code or QR at pickup</Text>
          </View>
        ) : (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Delivery Order</Text>
            <Text style={styles.codeHint}>We'll deliver to your address shortly</Text>
          </View>
        )}

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Type</Text>
            <Text style={styles.detailValue}>{orderType === 'pickup' ? 'Pickup' : 'Delivery'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Paid</Text>
            <Text style={styles.detailValue}>${total}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValueSmall}>{orderId?.substring(0, 8)}...</Text>
          </View>
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/orders')}>
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/menu')}>
          <Text style={styles.secondaryBtnText}>Back to Menu</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.green },
  subtitle: { fontSize: 15, color: COLORS.gray, marginTop: 4, marginBottom: 24 },
  codeBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  codeLabel: {
    fontSize: 13,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  codeValue: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.green,
    letterSpacing: 8,
    marginVertical: 6,
  },
  qrWrap: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  qrFallback: {
    marginVertical: 16,
    alignItems: 'center',
  },
  qrFallbackText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 6,
    fontStyle: 'italic',
  },
  codeHint: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  detailsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 380,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 14, color: COLORS.gray },
  detailValue: { fontSize: 14, color: COLORS.dark, fontWeight: '700' },
  detailValueSmall: { fontSize: 12, color: COLORS.dark, fontFamily: 'monospace' },
  primaryBtn: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  secondaryBtnText: { color: COLORS.green, fontWeight: '700', fontSize: 15 },
});