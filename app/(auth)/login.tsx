import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

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

const BASE = 'https://vvdnqtacecztvucpipug.supabase.co/storage/v1/object/public/images';
const PHOTO_1 = `${BASE}/487062424_1282744126758071_4844270702759723833_n.jpg`;
const PHOTO_2 = `${BASE}/482251678_1268273761538441_3131989890907364642_n.jpg`;
const PHOTO_3 = `${BASE}/486485888_1281247436907740_4310363794257269735_n.jpg`;
const PHOTO_BG = `${BASE}/488911402_1288172906215193_5213463202359320801_n.jpg`;

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      showAlert('Missing info', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      showAlert('Login failed', error);
    } else {
      router.replace('/(tabs)');
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      showAlert('Enter your email', 'Type your email address above, then tap Forgot Password again.');
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'http://localhost:8081/(auth)/login',
    });
    setResetLoading(false);
    if (error) {
      showAlert('Error', error.message);
    } else {
      showAlert('Check your email', 'We sent a password reset link to ' + email.trim());
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.wrapper, isWide && styles.wrapperWide]}>
        {/* ── hero panel ── */}
        <View style={[styles.heroPanel, isWide && styles.heroPanelWide]}>
          <Image source={{ uri: PHOTO_BG }} style={styles.heroBgImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>🥙</Text>
            <Text style={styles.heroTitle}>Tropical Gyros</Text>
            <Text style={styles.heroTagline}>CARIBBEAN-GREEK FUSION</Text>
            <Text style={styles.heroSub}>
              Order ahead, skip the line. Fresh flavors waiting for you.
            </Text>

            {/* food photo bubbles */}
            <View style={styles.photoBubbleRow}>
              <Image source={{ uri: PHOTO_1 }} style={styles.photoBubble} />
              <Image source={{ uri: PHOTO_2 }} style={styles.photoBubble} />
              <Image source={{ uri: PHOTO_3 }} style={styles.photoBubble} />
            </View>

            <View style={styles.heroBadges}>
              <View style={styles.badge}>
                <Ionicons name="time" size={16} color={COLORS.gold} />
                <Text style={styles.badgeText}>Quick Pickup</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="restaurant" size={16} color={COLORS.gold} />
                <Text style={styles.badgeText}>Order Online</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="card" size={16} color={COLORS.gold} />
                <Text style={styles.badgeText}>Pay Ahead</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── form panel ── */}
        <Animated.View
          style={[
            styles.formPanel,
            isWide && styles.formPanelWide,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.formHeader}>
            <Text style={styles.formTag}>WELCOME BACK</Text>
            <Text style={styles.formTitle}>Sign In</Text>
            <View style={styles.goldLine} />
            <Text style={styles.formSub}>
              Log in to view your orders, reorder favorites, and check out faster.
            </Text>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Pressable onPress={handleForgotPassword} disabled={resetLoading} style={styles.forgotWrap}>
            {resetLoading ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <Text style={styles.forgotText}>Forgot Password?</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </Pressable>

          <Link href="/(auth)/signup" style={styles.link}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </Link>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1 },
  wrapper: { flex: 1, flexDirection: 'column' },
  wrapperWide: { flexDirection: 'row', minHeight: '100%' },

  heroPanel: {
    minHeight: 420,
    backgroundColor: COLORS.green,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPanelWide: {
    flex: 1,
    minHeight: '100%',
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.green,
    opacity: 0.75,
    zIndex: 1,
  },
  heroContent: {
    zIndex: 2,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 44,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 50,
    fontWeight: '900',
    color: COLORS.gold,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.cream,
    letterSpacing: 3,
    marginBottom: 14,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 18,
    color: COLORS.cream,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 400,
    marginBottom: 24,
    opacity: 0.9,
  },
  photoBubbleRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 24,
  },
  photoBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.dark,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 7,
  },
  badgeText: {
    color: COLORS.cream,
    fontSize: 15,
    fontWeight: '600',
  },

  formPanel: {
    padding: 30,
    paddingTop: 36,
    backgroundColor: COLORS.bg,
  },
  formPanelWide: {
    flex: 1,
    maxWidth: 500,
    justifyContent: 'center',
    paddingHorizontal: 52,
  },
  formHeader: { marginBottom: 30 },
  formTag: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: COLORS.orange,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.green,
  },
  goldLine: {
    width: 50,
    height: 3,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 14,
  },
  formSub: {
    fontSize: 16,
    color: COLORS.gray,
    lineHeight: 23,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 17,
    fontSize: 17,
    color: COLORS.dark,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    paddingVertical: 4,
  },
  forgotText: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '700',
  },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { color: COLORS.gray, fontSize: 16 },
  linkBold: { color: COLORS.green, fontWeight: '700' },
});