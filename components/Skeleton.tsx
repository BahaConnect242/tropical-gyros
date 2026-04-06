import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

const COLORS = {
  bone: '#E8E0CC',
  highlight: '#F5EFE0',
};

function ShimmerBar({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.bar, style, { opacity }]} />;
}

export function MenuSkeleton() {
  return (
    <View style={styles.container}>
      <ShimmerBar style={styles.categoryBar} />
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.menuItem}>
          <View style={styles.menuItemBody}>
            <ShimmerBar style={styles.titleBar} />
            <ShimmerBar style={styles.descBar} />
            <ShimmerBar style={styles.descBarShort} />
          </View>
          <ShimmerBar style={styles.priceBar} />
        </View>
      ))}
    <ShimmerBar style={{ ...styles.categoryBar, marginTop: 16 }} />
      {[6, 7, 8].map((i) => (
        <View key={i} style={styles.menuItem}>
          <View style={styles.menuItemBody}>
            <ShimmerBar style={styles.titleBar} />
            <ShimmerBar style={styles.descBar} />
          </View>
          <ShimmerBar style={styles.priceBar} />
        </View>
      ))}
    </View>
  );
}

export function OrdersSkeleton() {
  return (
    <View style={styles.ordersContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.orderCard}>
          <View style={styles.orderTopRow}>
            <ShimmerBar style={styles.statusBadge} />
            <ShimmerBar style={styles.timeBar} />
          </View>
          <ShimmerBar style={styles.orderTitleBar} />
          <ShimmerBar style={styles.orderSubBar} />
          <View style={styles.orderBottomRow}>
            <ShimmerBar style={styles.orderItemsBar} />
            <ShimmerBar style={styles.orderPriceBar} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profileContainer}>
      <ShimmerBar style={styles.avatarCircle} />
      <ShimmerBar style={styles.profileName} />
      <ShimmerBar style={styles.profileEmail} />
      <View style={{ marginTop: 32 }}>
        {[1, 2, 3, 4].map((i) => (
          <ShimmerBar key={i} style={styles.profileRow} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.bone,
    borderRadius: 6,
  },

  // Menu
  container: { padding: 0 },
  categoryBar: {
    height: 40,
    borderRadius: 0,
    backgroundColor: '#D4CDB8',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD8',
  },
  menuItemBody: { flex: 1, marginRight: 16 },
  titleBar: { height: 16, width: '60%', marginBottom: 8 },
  descBar: { height: 12, width: '90%', marginBottom: 6 },
  descBarShort: { height: 12, width: '50%' },
  priceBar: { height: 18, width: 50 },

  // Orders
  ordersContainer: { padding: 12 },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: { height: 24, width: 80, borderRadius: 6 },
  timeBar: { height: 14, width: 50 },
  orderTitleBar: { height: 16, width: '70%', marginBottom: 8 },
  orderSubBar: { height: 12, width: '40%', marginBottom: 12 },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsBar: { height: 14, width: '50%' },
  orderPriceBar: { height: 20, width: 60 },

  // Profile
  profileContainer: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40 },
  profileName: { height: 20, width: 140, marginTop: 16, borderRadius: 6 },
  profileEmail: { height: 14, width: 200, marginTop: 10, borderRadius: 6 },
  profileRow: { height: 52, width: '100%', borderRadius: 10, marginBottom: 12 },
});