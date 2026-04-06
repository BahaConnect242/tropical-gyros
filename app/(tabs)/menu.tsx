import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../hooks/useCart';
import type { MenuCategory, MenuItem } from '../../types';

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

type Section = {
  title: string;
  data: MenuItem[];
};

export default function MenuScreen() {
  const router = useRouter();
  const { item_count } = useCart();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const loadMenu = async () => {
    const [catsRes, itemsRes, settingsRes] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('name'),
      supabase
        .from('store_settings')
        .select('is_open')
        .single(),
    ]);

    if (catsRes.error) console.error('Failed to load categories:', catsRes.error);
    if (itemsRes.error) console.error('Failed to load items:', itemsRes.error);

    if (settingsRes.data) {
      setIsOpen(settingsRes.data.is_open);
    }

    const categories = (catsRes.data ?? []) as MenuCategory[];
    const items = (itemsRes.data ?? []) as MenuItem[];

    const grouped: Section[] = categories
      .map((cat) => ({
        title: cat.name,
        data: items.filter((i) => i.category_id === cat.id),
      }))
      .filter((s) => s.data.length > 0);

    setSections(grouped);
  };

useEffect(() => {
    (async () => {
      await loadMenu();
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        loadMenu();
      }
    }, [loading])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Closed banner */}
      {!isOpen && (
        <View style={styles.closedBanner}>
          <Ionicons name="time-outline" size={20} color={COLORS.white} />
          <Text style={styles.closedText}>
            We're currently closed. Browse the menu — ordering will open when we're back!
          </Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!isOpen) return;
              router.push(`/item/${item.id}`);
            }}
            style={({ pressed }) => [
              styles.itemRow,
              pressed && isOpen && { opacity: 0.7 },
              !isOpen && styles.itemRowDisabled,
            ]}
          >
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, !isOpen && styles.textDisabled]}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={[styles.itemPrice, !isOpen && styles.textDisabled]}>
              ${item.price.toFixed(2)}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.green} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No menu items available.</Text>
          </View>
        }
        stickySectionHeadersEnabled
      />

      {/* Floating cart badge — only when store is open */}
      {isOpen && item_count > 0 && (
        <Pressable
          style={styles.cartBadge}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Text style={styles.cartBadgeText}>
            View Cart · {item_count} {item_count === 1 ? 'item' : 'items'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  closedBanner: {
    backgroundColor: COLORS.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  closedText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  listContent: { paddingBottom: 100 },
  sectionHeader: {
    backgroundColor: COLORS.green,
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  itemRowDisabled: {
    opacity: 0.5,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: COLORS.green, marginBottom: 2 },
  itemDescription: { fontSize: 13, color: COLORS.gray, lineHeight: 18 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: COLORS.red },
  textDisabled: { color: COLORS.gray },
  emptyText: { fontSize: 15, color: COLORS.gray },
  cartBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cartBadgeText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});