import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useUserStore } from '@/lib/state/user-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const router = useRouter();
  const hasSignedUp = useUserStore(s => s.hasSignedUp);
  const hasHydrated = useUserStore(s => s._hasHydrated);
  const userId = useUserStore(s => s.userId);
  const userEmail = useUserStore(s => s.userEmail);
  const userName = useUserStore(s => s.userName);
  const userAge = useUserStore(s => s.userAge);
  const userGender = useUserStore(s => s.userGender);
  const userTrainingGoal = useUserStore(s => s.userTrainingGoal);
  const userGoals = useUserStore(s => s.userGoals);
  const setSignedUp = useUserStore(s => s.setSignedUp);
  const didRedirect = useRef(false);

  // On startup, verify the stored userId still exists in the DB.
  // If the DB was reset, re-register automatically using locally-stored profile data.
  useEffect(() => {
    if (!hasHydrated || !hasSignedUp || !userId || !userEmail) return;

    fetch(`${BACKEND_URL}/api/signup/${userId}`)
      .then(async (res) => {
        if (res.status !== 404) return;
        const age = parseInt(userAge, 10);
        const recoverRes = await fetch(`${BACKEND_URL}/api/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            name: userName || 'User',
            age: isNaN(age) ? 25 : age,
            gender: userGender || 'prefer-not-to-say',
            trainingGoal: userTrainingGoal || undefined,
            goals: userGoals.length > 0 ? userGoals : ['general'],
            agreedToPolicy: true,
          }),
        });
        const data = await recoverRes.json();
        if (data.user?.id) {
          setSignedUp(data.user.id, userEmail, {
            userName,
            userAge,
            userGender,
            userTrainingGoal,
            userGoals,
          });
        }
      })
      .catch(() => {});
  }, [hasHydrated, hasSignedUp, userId]);

  useEffect(() => {
    if (!hasHydrated || didRedirect.current) return;
    didRedirect.current = true;
    SplashScreen.hideAsync().catch(() => {});
    if (!hasSignedUp) {
      router.replace('/signup');
    }
  }, [hasHydrated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="add-food" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="sources" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="saved-meals" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account-deleted" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
        </View>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}