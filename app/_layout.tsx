import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/constants/colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { PostsProvider } from '@/contexts/PostsContext';
import { FriendsProvider } from '@/contexts/FriendsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="user/[userId]"
        options={{
          headerShown: true,
          title: 'プロフィール',
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { fontWeight: '600', color: colors.text },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <PostsProvider>
            <FriendsProvider>
              <MessagesProvider>
                <RootLayoutNav />
              </MessagesProvider>
            </FriendsProvider>
          </PostsProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
