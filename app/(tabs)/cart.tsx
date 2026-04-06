import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../hooks/useCart';

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

const TAX_RATE = 0.10; // 10% VAT Bahamas

export default function CartScreen() {
  const { items, item_count, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleRemove = (cart_item_id: string, name: string) => {
    Alert.alert('Remove item?', `Remove ${name} from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(cart_item_id) },
    ]);
  };

  const handleClear = () => {
    Alert.alert('Clear cart?', 'This will remove all items from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearCart() },
    ]);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const formatCustomizations = (customizations: Record<string, string[]>) => {
    const parts: string[] = [];
    Object.values(customizations).forEach((vals) => {
      vals.forEach((v) => parts.push(v));
    });
    return parts.join(', ');
  };

  if (item_count === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>Add some delicious items from the menu!</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart ({item_count})</Text>
        <Pressable onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.cart_item_id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const customText = formatCustomizations(item.customizations);
          const lineTotal = item.price * item.quantity;
          return (
            <View style={styles.itemRow}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.imagePlaceholder]}>
                  <Ionicons name="restaurant-outline" size={28} color={COLORS.gray} />
                </View>
              )}

              <View style={styles.itemBody}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Pressable
                    onPress={() => handleRemove(item.cart_item_id, item.name)}
                    hitSlop={10}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                  </Pressable>
                </View>

                {customText ? (
                  <Text style={styles.itemCustom} numberOfLines={2}>{customText}</Text>
                ) : null}

                {item.special_instructions ? (
                  <Text style={styles.itemNote} numberOfLines={2}>
                    Note: {item.special_instructions}
                  </Text>
                ) : null}

                <View style={styles.itemBottomRow}>
                  <View style={styles.qtyWrap}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.green} />
                    </Pressable>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color={COLORS.green} />
                    </Pressable>
                  </View>
                  <Text style={styles.linePrice}>${lineTotal.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.totalsBar}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Tax (10%)</Text>
          <Text style={styles.totalsValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalsRow, styles.totalsRowFinal]}>
          <Text style={styles.totalFinalLabel}>Total</Text>
          <Text style={styles.totalFinalValue}>${total.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.green,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 6,
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: 24,
    backgroundColor: COLORS.green,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.green },
  clearText: { color: COLORS.red, fontWeight: '600', fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 20 },
  separator: { height: 10 },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemImage: {
    width: 78,
    height: 78,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginRight: 8,
  },
  itemCustom: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  itemNote: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 2 },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 28,
    textAlign: 'center',
    fontWeight: '700',
    color: COLORS.dark,
  },
  linePrice: { fontSize: 15, fontWeight: '700', color: COLORS.green },
  totalsBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsRowFinal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginTop: 6,
    paddingTop: 10,
  },
  totalsLabel: { fontSize: 14, color: COLORS.gray },
  totalsValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },
  totalFinalLabel: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  totalFinalValue: { fontSize: 17, fontWeight: '700', color: COLORS.green },
  checkoutBtn: {
    marginTop: 14,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});