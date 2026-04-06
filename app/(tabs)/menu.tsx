import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../hooks/useCart';
import type { MenuCategory, MenuItem } from '../../types';

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

  const loadMenu = async () => {
    // Fetch categories and items in parallel
    const [catsRes, itemsRes] = await Promise.all([
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
    ]);

    if (catsRes.error) {
      console.error('Failed to load categories:', catsRes.error);
      return;
    }
    if (itemsRes.error) {
      console.error('Failed to load items:', itemsRes.error);
      return;
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/item/${item.id}`)}
            style={({ pressed }) => [
              styles.itemRow,
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No menu items available.</Text>
          </View>
        }
        stickySectionHeadersEnabled
      />

      {/* Floating cart badge */}
      {item_count > 0 && (
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
  container: { flex: 1, backgroundColor: '#F0EAD8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContent: { paddingBottom: 100 },
  sectionHeader: {
    backgroundColor: '#163D26',
    color: '#F2B234',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD8',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#163D26', marginBottom: 2 },
  itemDescription: { fontSize: 13, color: '#777', lineHeight: 18 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#E63946' },
  emptyText: { fontSize: 15, color: '#777' },
  cartBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});