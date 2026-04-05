import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SectionList } from 'react-native';
import { supabase } from '../../lib/supabase';
import type { MenuItem, MenuCategory } from '../../types';

interface MenuSection {
  title: string;
  data: MenuItem[];
}

export default function MenuScreen() {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      setLoading(true);
      const { data: categories, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (catError) throw catError;

      const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);
      if (itemError) throw itemError;

      const grouped: MenuSection[] = (categories as MenuCategory[]).map((cat) => ({
        title: cat.name,
        data: (items as MenuItem[]).filter((i) => i.category_id === cat.id),
      }));
      setSections(grouped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error loading menu: {error}</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
          </View>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
      )}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  list: { backgroundColor: '#fff' },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#E63946',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#222' },
  itemDesc: { fontSize: 13, color: '#666', marginTop: 4 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#E63946' },
  error: { fontSize: 14, color: '#E63946', textAlign: 'center', padding: 20 },
});