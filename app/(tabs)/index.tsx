import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  Animated,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');
const isWide = SCREEN_W > 768;

const COLORS = {
  green: '#163D26',
  greenMid: '#2D6A45',
  gold: '#F2B234',
  orange: '#C4501E',
  orangeLight: '#E8693A',
  cream: '#FAF6EE',
  white: '#FFFFFF',
  dark: '#0E1A10',
};

const ALL_PHOTOS = [
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/482244915_1268273438205140_7737048440103418536_n.jpg',
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/482251678_1268273761538441_3131989890907364642_n.jpg',
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/484655962_1268892158143268_7677174521053715850_n.jpg',
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/486859851_1281487813550369_3990273668471177875_n.jpg',
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/488911402_1288172906215193_5213463202359320801_n.jpg',
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/162165852_2545215109108153_3221524076985536213_n.jpg',
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/191062692_2590152827947714_579886162569492966_n.jpg',
  'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/482960199_1268992331466584_6307187989052464263_n.jpg',
];

// Hero image (the big one on the right)
const HERO_IMAGE = 'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images/482960199_1268992331466584_6307187989052464263_n.jpg';

function shuffleArray(arr: string[]): string[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function pickThreeUnique(pool: string[], exclude: string[]): string[] {
  const available = pool.filter((p) => !exclude.includes(p));
  const shuffled = shuffleArray(available.length >= 3 ? available : pool);
  return [shuffled[0], shuffled[1], shuffled[2]];
}

export default function HeroScreen() {
  const [isOpen, setIsOpen] = useState(true);
  const [photos, setPhotos] = useState<string[]>(() => {
    const s = shuffleArray(ALL_PHOTOS);
    return [s[0], s[1], s[2]];
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const photoFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('store_settings').select('is_open').single();
      if (data) setIsOpen(data.is_open);
    })();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(photoFade, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setPhotos((prev) => pickThreeUnique(ALL_PHOTOS, prev));
        Animated.timing(photoFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const BUBBLE = isWide ? 200 : 110;

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* ====== HERO ====== */}
      <View style={styles.heroSection}>
        <Animated.View
          style={[
            styles.heroRow,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* LEFT — Text content */}
          <View style={styles.heroLeft}>
            <Text style={styles.logoMain}>TROPICAL</Text>
            <Text style={styles.logoAccent}>GYROS</Text>
            <Text style={styles.logoSub}>SANDY PORT · NASSAU · EST. 2015</Text>

            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
              <Text style={styles.statusText}>{isOpen ? 'OPEN NOW' : 'CURRENTLY CLOSED'}</Text>
            </View>

            <Text style={styles.heroTitle}>
              Born in{'\n'}
              <Text style={styles.heroGold}>Nassau.</Text>
            </Text>
            <Text style={styles.heroItalic}>Served Fresh.</Text>

            <Text style={styles.heroSub}>
              The Bahamas' original Carib-Greek fusion. Fresh grilled meats, organic greens, tropical fruits, and house-made sauces. A healthier choice — real ingredients, made to order, never frozen.
            </Text>

         <Pressable
              style={({ pressed }) => [styles.ctaBtn, pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }]}
              onPress={() => router.push('/(tabs)/menu')}
            >
              <Ionicons name="restaurant" size={22} color={COLORS.dark} />
              <Text style={styles.ctaBtnText}>View Menu</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.phoneBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {
                if (Platform.OS === 'web') window.open('tel:12428014020');
                else Linking.openURL('tel:12428014020');
              }}
            >
              <Text style={styles.phoneBtnText}>📞  Call (242) 801-4020</Text>
            </Pressable>

           
          </View>

          {/* RIGHT — Big hero image (desktop only) */}
          {isWide && (
            <View style={styles.heroRight}>
              <View style={styles.heroImageWrap}>
                <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* ====== ROTATING GALLERY STRIP ====== */}
      <View style={styles.galleryStrip}>
        <View style={styles.galleryInner}>
          {photos.map((url, i) => (
            <Animated.View
              key={`b-${i}`}
              style={[
                styles.galleryBubble,
                {
                  width: BUBBLE,
                  height: BUBBLE,
                  borderRadius: BUBBLE / 2,
                  opacity: photoFade,
                },
              ]}
            >
              <Image
                source={{ uri: url }}
                style={{ width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2 }}
                resizeMode="cover"
              />
            </Animated.View>
          ))}
        </View>
        <Text style={styles.galleryLabel}>FRESH · GRILLED · MADE TO ORDER</Text>
      </View>

      {/* ====== STATUS BAR ====== */}
      <View style={styles.statusBar}>
        <View style={styles.statusBarLeft}>
          <View style={[styles.statusBarDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
          <Text style={[styles.statusBarMainText, isOpen && { color: '#25D366' }]}>
            {isOpen ? 'Open Now' : 'Currently Closed'}
          </Text>
          <Text style={styles.statusBarHours}>Mon – Sat: 11am – 7pm</Text>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS === 'web') window.open('tel:12428014020');
            else Linking.openURL('tel:12428014020');
          }}
        >
          <Text style={styles.statusBarPhone}>📞 (242) 801-4020</Text>
        </Pressable>
      </View>

      <View style={styles.gradientBar} />

      {/* ====== WHY TROPICAL GYROS ====== */}
      <View style={styles.whySection}>
        <Text style={styles.whySectionTag}>WHY TROPICAL GYROS</Text>
        <Text style={styles.whySectionTitle}>Not Your Average Fast Food</Text>
        <Text style={styles.whySectionSub}>
          While most fast food relies on frozen, processed ingredients, every Tropical Gyros meal is built from scratch with fresh-grilled proteins, crisp organic greens, and real tropical fruits. It's fast food done right — flavorful, filling, and better for you.
        </Text>

        <View style={styles.whyGrid}>
          <View style={styles.whyCard}>
            <Text style={styles.whyCardEmoji}>🥬</Text>
            <Text style={styles.whyCardTitle}>Fresh Ingredients</Text>
            <Text style={styles.whyCardText}>Organic greens, hand-cut vegetables, and seasonal tropical fruits in every order.</Text>
          </View>
          <View style={styles.whyCard}>
            <Text style={styles.whyCardEmoji}>🔥</Text>
            <Text style={styles.whyCardTitle}>Grilled to Order</Text>
            <Text style={styles.whyCardText}>Every protein is grilled fresh when you order — never sitting under a heat lamp.</Text>
          </View>
          <View style={styles.whyCard}>
            <Text style={styles.whyCardEmoji}>🌴</Text>
            <Text style={styles.whyCardTitle}>Carib-Greek Fusion</Text>
            <Text style={styles.whyCardText}>A one-of-a-kind flavor born in Nassau — Caribbean spice meets Mediterranean technique.</Text>
          </View>
          <View style={styles.whyCard}>
            <Text style={styles.whyCardEmoji}>💪</Text>
            <Text style={styles.whyCardTitle}>Healthier Choice</Text>
            <Text style={styles.whyCardText}>High-protein, no deep frying, house-made sauces with no artificial preservatives.</Text>
          </View>
        </View>
      </View>

      {/* ====== FIND US ====== */}
      <View style={styles.findUsSection}>
        <Text style={styles.sectionTagLight}>FIND US</Text>
        <Text style={styles.findUsTitle}>Sandy Port Location</Text>

        <View style={styles.infoCards}>
          <View style={styles.infoCardDark}>
            <Text style={styles.infoCardEmoji}>📍</Text>
            <Text style={styles.infoCardHeading}>ADDRESS</Text>
            <Text style={styles.infoCardBody}>W Bay St, Sandy Port{'\n'}Nassau, Bahamas</Text>
          </View>
          <View style={styles.infoCardDark}>
            <Text style={styles.infoCardEmoji}>🕐</Text>
            <Text style={styles.infoCardHeading}>HOURS</Text>
            <Text style={styles.infoCardBody}>Mon – Sat: 11am – 7pm{'\n'}Sunday: Closed</Text>
          </View>
          <View style={styles.infoCardDark}>
            <Text style={styles.infoCardEmoji}>📞</Text>
            <Text style={styles.infoCardHeading}>CONTACT</Text>
            <Text style={styles.infoCardBody}>(242) 801-4020</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.bigGreenBtn, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
          onPress={() => router.push('/(tabs)/menu')}
        >
          <Ionicons name="restaurant" size={22} color={COLORS.white} />
          <Text style={styles.bigGreenBtnText}>View Menu & Order</Text>
        </Pressable>
      </View>

      {/* ====== FOOTER ====== */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>TROPICAL GYROS</Text>
        <Text style={styles.footerLocation}>Sandy Port · Nassau, Bahamas</Text>
        <Text style={styles.footerDesc}>The Bahamas' original Carib-Greek fusion. Fresh. Bold. Made to order.</Text>
        <View style={styles.footerDivider} />
        <Text style={styles.footerCopy}>© 2025 Tropical Gyros. All rights reserved.</Text>
        <Text style={styles.footerCredit}>App by Baha Connect</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.green },

  // HERO
  heroSection: {
    backgroundColor: COLORS.green,
    paddingTop: isWide ? 60 : 50,
    paddingBottom: isWide ? 40 : 20,
  },
  heroRow: {
    flexDirection: isWide ? 'row' : 'column',
    alignItems: isWide ? 'center' : 'flex-start',
    paddingHorizontal: isWide ? 64 : 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    gap: isWide ? 48 : 0,
  },
  heroLeft: {
    flex: isWide ? 1 : undefined,
  },
  heroRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImageWrap: {
    width: '100%',
    maxWidth: 480,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(242,178,52,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  heroImage: { width: '100%', height: '100%' },

  logoMain: {
    fontSize: isWide ? 56 : 44,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 6,
    lineHeight: isWide ? 58 : 46,
  },
  logoAccent: {
    fontSize: isWide ? 56 : 44,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 6,
    lineHeight: isWide ? 58 : 46,
  },
  logoSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 10,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(242,178,52,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,178,52,0.3)',
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotOpen: { backgroundColor: '#25D366' },
  dotClosed: { backgroundColor: '#E63946' },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: COLORS.gold },
  heroTitle: {
    fontSize: isWide ? 76 : 56,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: isWide ? 74 : 54,
    marginBottom: 4,
  },
  heroGold: { color: COLORS.gold },
  heroItalic: {
    fontSize: isWide ? 54 : 40,
    fontStyle: 'italic',
    color: COLORS.orangeLight,
    fontWeight: '300',
    marginBottom: 20,
    lineHeight: isWide ? 58 : 44,
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 25,
    color: 'rgba(255,255,255,0.5)',
    maxWidth: 440,
    marginBottom: 32,
  },
 ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.gold,
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginBottom: 14,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaBtnText: { fontSize: 18, fontWeight: '800', color: COLORS.dark, letterSpacing: 0.5 },
  phoneBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  phoneBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.white },
  browseLink: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 },
  infoRow: { flexDirection: 'row', gap: 28, flexWrap: 'wrap' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 16 },
  infoStrong: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  infoMuted: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  // GALLERY STRIP
  galleryStrip: {
    backgroundColor: '#0E1A10',
    paddingVertical: isWide ? 48 : 32,
    alignItems: 'center',
  },
  galleryInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isWide ? 32 : 16,
    marginBottom: 16,
  },
  galleryBubble: {
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(242,178,52,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  galleryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
  },

  // STATUS BAR
statusBar: {
    backgroundColor: COLORS.dark,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  statusBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBarDot: { width: 8, height: 8, borderRadius: 4 },
  statusBarMainText: { fontSize: 16, fontWeight: '800', color: COLORS.orangeLight },
  statusBarHours: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  statusBarPhone: { fontSize: 16, color: COLORS.gold, fontWeight: '700' },
  gradientBar: { height: 4, backgroundColor: COLORS.gold },

  // WHY SECTION
  whySection: {
    backgroundColor: COLORS.cream,
    padding: isWide ? 64 : 32,
    alignItems: 'center',
  },
  whySectionTag: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: COLORS.orange, marginBottom: 8 },
  whySectionTitle: {
    fontSize: isWide ? 40 : 30,
    fontWeight: '900',
    color: COLORS.green,
    textAlign: 'center',
    marginBottom: 14,
  },
  whySectionSub: {
    fontSize: 15,
    lineHeight: 25,
    color: '#5A6B5E',
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 36,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 900,
    width: '100%',
  },
  whyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: isWide ? '47%' : '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  whyCardEmoji: { fontSize: 32, marginBottom: 12 },
  whyCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.green, marginBottom: 8, textAlign: 'center' },
  whyCardText: { fontSize: 13, lineHeight: 20, color: '#5A6B5E', textAlign: 'center' },

  // FIND US
  findUsSection: { backgroundColor: COLORS.dark, padding: isWide ? 64 : 32, alignItems: 'center' },
  sectionTagLight: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: COLORS.gold, marginBottom: 8 },
  findUsTitle: { fontSize: isWide ? 36 : 28, fontWeight: '900', color: COLORS.white, marginBottom: 28, textAlign: 'center' },
  infoCards: { flexDirection: isWide ? 'row' : 'column', gap: 14, marginBottom: 28, width: '100%', maxWidth: 700 },
  infoCardDark: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  infoCardEmoji: { fontSize: 24, marginBottom: 10 },
  infoCardHeading: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textAlign: 'center' },
  infoCardBody: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20, textAlign: 'center' },
  bigGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.green,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 99,
  },
  bigGreenBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  // FOOTER
  footer: { backgroundColor: '#0a1309', padding: 40, alignItems: 'center' },
  footerLogo: { fontSize: 28, fontWeight: '900', color: COLORS.gold, letterSpacing: 3, marginBottom: 4 },
  footerLocation: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 14 },
  footerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 20, maxWidth: 300, marginBottom: 16 },
  footerDivider: { width: 40, height: 2, backgroundColor: 'rgba(242,178,52,0.3)', marginBottom: 16 },
  footerCopy: { fontSize: 11, color: 'rgba(255,255,255,0.15)', marginBottom: 4 },
  footerCredit: { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
});