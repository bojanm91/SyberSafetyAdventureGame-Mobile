import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/auth-context";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#050816" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B0F1A" } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quest/[id]" />
          <Stack.Screen name="game/[id]" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
