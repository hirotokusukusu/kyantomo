import { Tabs, useRouter } from 'expo-router';
import { Home, Search, User, MessageCircle, Compass } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { colors } from '@/constants/colors';
import { useMessages } from '@/contexts/MessagesContext';
import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading, needsProfileSetup } = useAuth();
  const { getUnreadCount } = useMessages();
  const { pendingRequests } = useFriends();
  
  const totalBadge = getUnreadCount() + pendingRequests.length;

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsProfileSetup) {
      router.replace('/(auth)/setup-profile' as any);
    }
  }, [isLoading, isAuthenticated, needsProfileSetup, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(feed)"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '検索',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '発見',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'メッセージ',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MessageCircle size={size} color={color} />
              {totalBadge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalBadge > 99 ? '99+' : totalBadge}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600' as const,
  },
});
