import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
  router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
 <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen
        name="item/[id]"
        options={{
          headerShown: true,
          title: 'Customize',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerStyle: { backgroundColor: '#163D26' },
          headerTintColor: '#F2B234',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          headerShown: true,
          title: 'Checkout',
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: '#163D26' },
          headerTintColor: '#F2B234',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          headerShown: true,
          title: 'Payment',
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: '#163D26' },
          headerTintColor: '#F2B234',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="order-success"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="order/[id]"
        options={{
          headerShown: true,
          title: 'Order Details',
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: '#163D26' },
          headerTintColor: '#F2B234',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen name="(admin)/orders" options={{ headerShown: true }} />
      <Stack.Screen name="(admin)/menu-edit" options={{ headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootLayoutNav />
      </CartProvider>
    </AuthProvider>
  );
}