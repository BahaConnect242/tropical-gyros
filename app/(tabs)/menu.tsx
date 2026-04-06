import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
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
import { MenuSkeleton } from '../../components/Skeleton';
import type { MenuCategory, MenuItem } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');
const isWide = SCREEN_W > 768;

const COLORS = {
  bg: '#F0EAD8',
  green: '#163D26',
  gold: '#F2B234',
  red: '#E63946',
  orange: '#C4501E',
  white: '#FFFFFF',
  gray: '#8A8A8A',
  lightGray: '#E5E5E5',
  dark: '#1A1A1A',
  cream: '#FAF7F0',
};

/* ── emoji map for categories ── */
const CATEGORY_EMOJI: Record<string, string> = {
  gyros: '🥙',
  wraps: '🌯',
  sides: '🍟',
  drinks: '🥤',
  combos: '🍽️',
  salads: '🥗',
  desserts: '🍰',
  bowls: '🥘',
  extras: '✨',
  specials: '⭐',
  platters: '🍛',
  smoothies: '🥤',
  beverages: '🥤',
  sandwiches: '🥪',
  appetizers: '🍢',
  breakfast: '🍳',
};

/* ── emoji map for common food items ── */
const ITEM_EMOJI: Record<string, string> = {
  gyro: '🥙',
  wrap: '🌯',
  fries: '🍟',
  salad: '🥗',
  chicken: '🍗',
  lamb: '🐑',
  beef: '🥩',
  fish: '🐟',
  shrimp: '🦐',
  water: '💧',
  soda: '🥤',
  juice: '🧃',
  lemonade: '🍋',
  tea: '🍵',
  smoothie: '🥤',
  rice: '🍚',
  hummus: '🫘',
  pita: '🫓',
  sauce: '🫙',
  combo: '🍽️',
  platter: '🍛',
  bowl: '🥘',
  cake: '🍰',
  cookie: '🍪',
  conch: '🐚',
};

function getItemEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(ITEM_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '📋';
}

type Section = {
  title: string;
  data: MenuItem[];
};

/* ── animated add button ── */
function AddButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.8, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          styles.addBtn,
          { transform: [{ scale }] },
          disabled && styles.addBtnDisabled,
        ]}
      >
        <Ionicons name="add" size={22} color={COLORS.white} />
      </Animated.View>
    </Pressable>
  );
}

export default function MenuScreen() {
  const router = useRouter();
  const { item_count, addItem } = useCart();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
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

const handleQuickAdd = (item: MenuItem) => {
    if (!isOpen) return;
    addItem(item, 1);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <MenuSkeleton />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* ── closed banner ── */}
      {!isOpen && (
        <View style={styles.closedBanner}>
          <Ionicons name="time-outline" size={20} color={COLORS.white} />
          <Text style={styles.closedText}>
            We're currently closed — browse the menu and come back when we're open!
          </Text>
        </View>
      )}

      {/* ── branded header ── */}
      <View style={styles.menuHeader}>
        <Text style={styles.menuHeaderTag}>ORDER ONLINE</Text>
        <Text style={styles.menuHeaderTitle}>Our Menu</Text>
        <View style={styles.headerDivider} />
        <Text style={styles.menuHeaderSub}>
          Fresh, organic, grilled to order — Caribbean-Greek fusion at its finest.
        </Text>
      </View>

      {/* ── menu list ── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionEmoji}>{getCategoryEmoji(section.title)}</Text>
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              <View style={styles.sectionGoldLine} />
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!isOpen) return;
              router.push(`/item/${item.id}`);
            }}
            style={({ pressed }) => [
              styles.itemCard,
              pressed && isOpen && styles.itemCardPressed,
              !isOpen && styles.itemCardDisabled,
            ]}
          >
            {/* emoji icon */}
            <View style={[styles.emojiCircle, !isOpen && { opacity: 0.4 }]}>
              <Text style={styles.emojiText}>{getItemEmoji(item.name)}</Text>
            </View>

            {/* name + description */}
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, !isOpen && styles.textDisabled]}>
                {item.name}
              </Text>
              {item.description ? (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={[styles.itemPrice, !isOpen && styles.textDisabled]}>
                ${item.price.toFixed(2)}
              </Text>
            </View>

            {/* green + button */}
            <AddButton
              onPress={() => handleQuickAdd(item)}
              disabled={!isOpen}
            />
          </Pressable>
        )}
        contentContainerStyle={[
          styles.listContent,
          isWide && { maxWidth: 720, alignSelf: 'center', width: '100%' },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.green} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>No menu items available right now.</Text>
          </View>
        }
        stickySectionHeadersEnabled
      />

      {/* ── floating cart bar ── */}
      {isOpen && item_count > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.cartBadge,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Ionicons name="cart" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.cartBadgeText}>
            View Cart · {item_count} {item_count === 1 ? 'item' : 'items'}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

/* ─────────────── styles ─────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },

  /* closed banner */
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

  /* header */
  menuHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.bg,
    alignItems: isWide ? 'center' : 'flex-start',
  },
  menuHeaderTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: COLORS.orange,
    marginBottom: 4,
  },
  menuHeaderTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: 0.5,
  },
  headerDivider: {
    width: 50,
    height: 3,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 10,
  },
  menuHeaderSub: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    textAlign: isWide ? 'center' : 'left',
  },

  /* section headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 10,
  },
  sectionEmoji: {
    fontSize: 24,
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionGoldLine: {
    height: 3,
    width: 40,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    marginTop: 4,
  },

  /* item card */
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  itemCardDisabled: {
    opacity: 0.45,
  },

  /* emoji circle */
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 24,
  },

  /* item text */
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 17,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.orange,
  },
  textDisabled: { color: COLORS.gray },

  /* green + button */
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnDisabled: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
  },

  /* list */
  listContent: { paddingBottom: 100, paddingTop: 4 },
  emptyText: { fontSize: 15, color: COLORS.gray },

  /* floating cart */
  cartBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});