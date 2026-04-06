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
const PHOTO_1 = `${BASE}/482244915_1268273438205140_7737048440103418536_n.jpg`;
const PHOTO_2 = `${BASE}/484655962_1268892158143268_7677174521053715850_n.jpg`;
const PHOTO_3 = `${BASE}/486823454_1282743750091442_6806820989888753771_n.jpg`;
const PHOTO_BG = `${BASE}/485678414_1275357067496777_6960957652025693329_n.jpg`;

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleSignup() {
    if (!fullName || !email || !password) {
      showAlert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      showAlert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      showAlert('Signup failed', error);
    } else {
      showAlert('Account created', 'Check your email to verify your account, then sign in.');
      router.replace('/(auth)/login');
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
              Fresh, organic, grilled to order. Sign up and start ordering today.
            </Text>

            {/* food photo bubbles */}
            <View style={styles.photoBubbleRow}>
              <Image source={{ uri: PHOTO_1 }} style={styles.photoBubble} />
              <Image source={{ uri: PHOTO_2 }} style={styles.photoBubble} />
              <Image source={{ uri: PHOTO_3 }} style={styles.photoBubble} />
            </View>

            <View style={styles.heroBadges}>
              <View style={styles.badge}>
                <Ionicons name="flame" size={16} color={COLORS.gold} />
                <Text style={styles.badgeText}>Grilled Fresh</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="leaf" size={16} color={COLORS.gold} />
                <Text style={styles.badgeText}>Organic</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="heart" size={16} color={COLORS.gold} />
                <Text style={styles.badgeText}>Healthier Choice</Text>
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
            <Text style={styles.formTag}>JOIN US</Text>
            <Text style={styles.formTitle}>Create Your Account</Text>
            <View style={styles.goldLine} />
            <Text style={styles.formSub}>
              Sign up to order ahead, skip the line, and get your food fresh and fast.
            </Text>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={22} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.gray}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
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
              placeholder="Password (min 6 characters)"
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </Pressable>

          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Sign in</Text>
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
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
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