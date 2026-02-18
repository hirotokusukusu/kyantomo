import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function DiscoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '600', color: colors.text },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: '発見' }}
      />
    </Stack>
  );
}
