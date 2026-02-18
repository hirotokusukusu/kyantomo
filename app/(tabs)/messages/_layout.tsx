import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '600' as const, color: colors.text },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'メッセージ' }}
      />
      <Stack.Screen
        name="[chatId]"
        options={{ title: 'チャット' }}
      />
      <Stack.Screen
        name="friends"
        options={{ title: '友達' }}
      />
    </Stack>
  );
}
