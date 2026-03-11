import { Stack } from "expo-router";
import { colors } from "@/constants/colors";

export default function FeedLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: "600", color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "ホーム",
        }}
      />
      <Stack.Screen
        name="[postId]"
        options={{
          title: "投稿",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "新規投稿",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
