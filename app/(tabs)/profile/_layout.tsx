import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '600', color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'プロフィール',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'プロフィール編集',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
