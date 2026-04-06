import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
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

type Category = { id: string; name: string; display_order: number };
type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  image_url: string | null;
};

function showAlert(msg: string) {
  if (Platform.OS === 'web') window.alert(msg);
}

export default function MenuEditScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCatId, setFormCatId] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);

  const fetchData = useCallback(async () => {
    const [catsRes, itemsRes, settingsRes] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
      supabase.from('menu_items').select('*').order('name'),
      supabase.from('store_settings').select('is_open').single(),
    ]);
    if (catsRes.data) setCategories(catsRes.data as Category[]);
    if (itemsRes.data) setItems(itemsRes.data as Item[]);
    if (settingsRes.data) setIsStoreOpen(settingsRes.data.is_open);
  }, []);

  useEffect(() => {
    (async () => {
      await fetchData();
      setLoading(false);
    })();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleAvailability = async (item: Item) => {
    const newVal = !item.is_available;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: newVal } : i)));
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: newVal, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: !newVal } : i)));
      showAlert('Failed to update availability');
    }
  };

  const toggleStoreOpen = async () => {
    const newVal = !isStoreOpen;
    setIsStoreOpen(newVal);
    const { error } = await supabase
      .from('store_settings')
      .update({ is_open: newVal })
      .limit(1);
    if (error) {
      setIsStoreOpen(!newVal);
      showAlert('Failed to update store status');
    }
  };

  const openAddModal = () => {
    setEditItem(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormCatId(categories[0]?.id || '');
    setFormAvailable(true);
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditItem(item);
    setFormName(item.name);
    setFormDesc(item.description || '');
    setFormPrice(item.price.toString());
    setFormCatId(item.category_id);
    setFormAvailable(item.is_available);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice.trim() || !formCatId) {
      showAlert('Name, price, and category are required.');
      return;
    }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price < 0) {
      showAlert('Enter a valid price.');
      return;
    }

    setSaving(true);
    if (editItem) {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: formName.trim(),
          description: formDesc.trim() || null,
          price,
          category_id: formCatId,
          is_available: formAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editItem.id);
      if (error) { showAlert('Failed to update item'); setSaving(false); return; }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          name: formName.trim(),
          description: formDesc.trim() || null,
          price,
          category_id: formCatId,
          is_available: formAvailable,
        });
      if (error) { showAlert('Failed to add item: ' + error.message); setSaving(false); return; }
    }
    setSaving(false);
    setShowModal(false);
    await fetchData();
  };

  const handleDelete = async (item: Item) => {
    const proceed = Platform.OS === 'web' ? window.confirm(`Delete "${item.name}"?`) : true;
    if (!proceed) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
    if (error) { showAlert('Failed to delete item'); return; }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const filtered = filterCat === 'all' ? items : items.filter((i) => i.category_id === filterCat);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Menu Manager', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: COLORS.gold, headerTitleStyle: { fontWeight: '700' } }} />
        <View style={styles.centerWrap}><ActivityIndicator size="large" color={COLORS.green} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Menu Manager', headerStyle: { backgroundColor: COLORS.green }, headerTintColor: COLORS.gold, headerTitleStyle: { fontWeight: '700' } }} />

      {/* Store open/close toggle */}
      <View style={styles.storeToggle}>
        <View style={styles.storeToggleLeft}>
          <Ionicons
            name={isStoreOpen ? 'storefront' : 'storefront-outline'}
            size={22}
            color={isStoreOpen ? COLORS.green : COLORS.red}
          />
          <Text style={[styles.storeToggleText, { color: isStoreOpen ? COLORS.green : COLORS.red }]}>
            Store is {isStoreOpen ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
        <Switch
          value={isStoreOpen}
          onValueChange={toggleStoreOpen}
          trackColor={{ false: COLORS.lightGray, true: COLORS.green }}
          thumbColor={COLORS.white}
        />
      </View>

      {/* Category filter + Add button */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            style={[styles.filterChip, filterCat === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCat('all')}
          >
            <Text style={[styles.filterChipText, filterCat === 'all' && styles.filterChipTextActive]}>
              All ({items.length})
            </Text>
          </Pressable>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id).length;
            return (
              <Pressable
                key={cat.id}
                style={[styles.filterChip, filterCat === cat.id && styles.filterChipActive]}
                onPress={() => setFilterCat(cat.id)}
              >
                <Text style={[styles.filterChipText, filterCat === cat.id && styles.filterChipTextActive]}>
                  {cat.name} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add-circle" size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add Item</Text>
        </Pressable>
      </View>

      {/* Item list */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.centerWrap}><Text style={styles.emptyText}>No items in this category</Text></View>
        }
        renderItem={({ item }) => {
          const catName = categories.find((c) => c.id === item.category_id)?.name || '';
          return (
            <View style={[styles.card, !item.is_available && styles.cardSoldOut]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text> : null}
                  <Text style={styles.itemCat}>{catName}</Text>
                </View>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.availBtn, item.is_available ? styles.availBtnOn : styles.availBtnOff]}
                  onPress={() => toggleAvailability(item)}
                >
                  <Ionicons
                    name={item.is_available ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={item.is_available ? COLORS.green : COLORS.red}
                  />
                  <Text style={[styles.availBtnText, { color: item.is_available ? COLORS.green : COLORS.red }]}>
                    {item.is_available ? 'Available' : 'Sold Out'}
                  </Text>
                </Pressable>
                <View style={styles.cardBtns}>
                  <Pressable style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Ionicons name="create-outline" size={18} color={COLORS.gold} />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editItem ? 'Edit Item' : 'Add New Item'}</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </Pressable>
            </View>
            <ScrollView>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} placeholder="Item name" placeholderTextColor={COLORS.gray} />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.modalInput, { minHeight: 60 }]} value={formDesc} onChangeText={setFormDesc} placeholder="Short description" placeholderTextColor={COLORS.gray} multiline />

              <Text style={styles.fieldLabel}>Price *</Text>
              <TextInput style={styles.modalInput} value={formPrice} onChangeText={setFormPrice} placeholder="0.00" placeholderTextColor={COLORS.gray} keyboardType="decimal-pad" />

              <Text style={styles.fieldLabel}>Category *</Text>
              <View style={styles.catPicker}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[styles.catOption, formCatId === cat.id && styles.catOptionActive]}
                    onPress={() => setFormCatId(cat.id)}
                  >
                    <Text style={[styles.catOptionText, formCatId === cat.id && styles.catOptionTextActive]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.availRow}>
                <Text style={styles.fieldLabel}>Available</Text>
                <Switch
                  value={formAvailable}
                  onValueChange={setFormAvailable}
                  trackColor={{ false: COLORS.lightGray, true: COLORS.green }}
                  thumbColor={COLORS.white}
                />
              </View>
            </ScrollView>

            <Pressable style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : (
                <Text style={styles.saveBtnText}>{editItem ? 'Save Changes' : 'Add Item'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: COLORS.gray },
  storeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  storeToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storeToggleText: { fontSize: 15, fontWeight: '800' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterScroll: { flexDirection: 'row', gap: 6, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  filterChipTextActive: { color: COLORS.white },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  listContent: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardSoldOut: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  itemDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  itemCat: { fontSize: 11, color: COLORS.gold, fontWeight: '700', marginTop: 4 },
  itemPrice: { fontSize: 17, fontWeight: '800', color: COLORS.green, marginLeft: 12 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  availBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  availBtnOn: { backgroundColor: '#E8F5E9' },
  availBtnOff: { backgroundColor: '#FDECEC' },
  availBtnText: { fontSize: 12, fontWeight: '700' },
  cardBtns: { flexDirection: 'row', gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.gold },
  deleteBtn: { padding: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.green },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.green, marginTop: 12, marginBottom: 4 },
  modalInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  catOptionActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  catOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  catOptionTextActive: { color: COLORS.white },
  availRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});