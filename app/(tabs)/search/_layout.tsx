import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function SearchLayout() {
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
          title: '検索',
        }}
      />
    </Stack>
  );
}
