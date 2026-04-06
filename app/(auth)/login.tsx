import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
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
      router.replace('/(tabs)/menu');
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
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Text style={styles.title}>Tropical Gyros</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

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
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.gray}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      <Pressable onPress={handleForgotPassword} disabled={resetLoading} style={styles.forgotWrap}>
        {resetLoading ? (
          <ActivityIndicator size="small" color={COLORS.gold} />
        ) : (
          <Text style={styles.forgotText}>Forgot Password?</Text>
        )}
      </Pressable>

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>

      <Link href="/(auth)/signup" style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.green,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 6,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 12,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  link: { marginTop: 20, alignSelf: 'center' },
  linkText: { color: COLORS.gray, fontSize: 14 },
  linkBold: { color: COLORS.green, fontWeight: '700' },
});