import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

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

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? 'Guest';
  const name = session?.user?.user_metadata?.full_name ?? email.split('@')[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.menuItem} onPress={() => router.push('/(tabs)/orders')}>
          <Ionicons name="receipt-outline" size={22} color={COLORS.green} />
          <Text style={styles.menuText}>My Orders</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
        </Pressable>

        <Pressable style={styles.menuItem} onPress={() => router.push('/(admin)/orders')}>
          <Ionicons name="grid-outline" size={22} color={COLORS.gold} />
          <Text style={styles.menuText}>Staff Dashboard</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.red} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Tropical Gyros v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.gold },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.dark },
  email: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 12,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.dark },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: COLORS.red },
  version: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 24,
  },
});