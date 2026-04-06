import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../hooks/useCart';
import type { MenuItem, CustomizationOption } from '../../types';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to fetch item:', error);
        Alert.alert('Error', 'Could not load this item.');
        router.back();
        return;
      }
      setItem(data);
      setLoading(false);
    })();
  }, [id]);

  const toggleOption = (group: CustomizationOption, optionName: string) => {
    setSelectedOptions((prev) => {
      const current = prev[group.group_name] ?? [];
      if (group.multi_select) {
        const exists = current.includes(optionName);
        return {
          ...prev,
          [group.group_name]: exists
            ? current.filter((o) => o !== optionName)
            : [...current, optionName],
        };
      } else {
        return { ...prev, [group.group_name]: [optionName] };
      }
    });
  };

  const computePrice = (): number => {
    if (!item) return 0;
    let total = item.price;
    if (item.customization_options) {
      for (const group of item.customization_options) {
        const selected = selectedOptions[group.group_name] ?? [];
        for (const optName of selected) {
          const opt = group.options.find((o) => o.name === optName);
          if (opt) total += opt.price_delta;
        }
      }
    }
    return total * quantity;
  };

  const canAddToCart = (): boolean => {
    if (!item?.customization_options) return true;
    for (const group of item.customization_options) {
      if (group.required) {
        const selected = selectedOptions[group.group_name] ?? [];
        if (selected.length === 0) return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!item) return;
    if (!canAddToCart()) {
      Alert.alert('Missing selection', 'Please choose all required options.');
      return;
    }
    const unitPrice = computePrice() / quantity;
    addItem(
      { ...item, price: unitPrice },
      quantity,
      selectedOptions,
      specialInstructions.trim()
    );
    router.back();
  };

  if (loading || !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        <Text style={styles.basePrice}>${item.price.toFixed(2)}</Text>

        {item.customization_options?.map((group) => (
          <View key={group.group_name} style={styles.group}>
            <Text style={styles.groupTitle}>
              {group.group_name}
              {group.required && <Text style={styles.required}> *</Text>}
            </Text>
            <Text style={styles.groupSubtitle}>
              {group.multi_select ? 'Choose any' : 'Choose one'}
            </Text>
            {group.options.map((opt) => {
              const selected = (selectedOptions[group.group_name] ?? []).includes(opt.name);
              return (
                <Pressable
                  key={opt.name}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => toggleOption(group, opt.name)}
                >
                  <Text style={[styles.optionName, selected && styles.optionNameSelected]}>
                    {opt.name}
                  </Text>
                  {opt.price_delta !== 0 && (
                    <Text style={[styles.optionPrice, selected && styles.optionNameSelected]}>
                      {opt.price_delta > 0 ? '+' : ''}${opt.price_delta.toFixed(2)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Special Instructions</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. no onions, extra sauce"
            placeholderTextColor="#999"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            maxLength={200}
          />
        </View>

        <View style={styles.qtyRow}>
          <Text style={styles.groupTitle}>Quantity</Text>
          <View style={styles.qtyControls}>
            <Pressable style={styles.qtyButton} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Text style={styles.qtyButtonText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <Pressable style={styles.qtyButton} onPress={() => setQuantity((q) => q + 1)}>
              <Text style={styles.qtyButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.addButton, !canAddToCart() && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={!canAddToCart()}
        >
          <Text style={styles.addButtonText}>
            Add to Cart · ${computePrice().toFixed(2)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EAD8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 120 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#163D26', marginBottom: 4 },
  description: { fontSize: 15, color: '#555', marginBottom: 12, lineHeight: 22 },
  basePrice: { fontSize: 20, fontWeight: '600', color: '#E63946', marginBottom: 20 },
  group: { marginBottom: 24 },
  groupTitle: { fontSize: 17, fontWeight: '600', color: '#163D26' },
  groupSubtitle: { fontSize: 13, color: '#888', marginBottom: 10 },
  required: { color: '#E63946' },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  optionSelected: { borderColor: '#163D26', backgroundColor: '#163D26' },
  optionName: { fontSize: 15, color: '#333' },
  optionNameSelected: { color: '#F2B234', fontWeight: '600' },
  optionPrice: { fontSize: 14, color: '#666' },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
    color: '#333',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#163D26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 22, color: '#F2B234', fontWeight: 'bold' },
  qtyValue: { fontSize: 20, fontWeight: '600', color: '#163D26', minWidth: 30, textAlign: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addButton: {
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: { backgroundColor: '#ccc' },
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});