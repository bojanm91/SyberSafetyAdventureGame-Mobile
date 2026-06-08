import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "../contexts/auth-context";
import "../global.css";

// Redirects to /login whenever the user is logged out while inside the app
function NavigationGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const root = segments[0];
    const protectedArea = root === "(tabs)" || root === "game" || root === "quest" || root === "onboarding";
    const authArea = root === "login" || root === "register";

    if (!user && protectedArea) {
      router.replace("/login");
      return;
    }

    if (user && user.onboardingDone && (authArea || root === "onboarding")) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  return null;
}

function NotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") {
        router.push(url as never);
      }
    });
    return () => sub.remove();
  }, [router]);

  return null;
}

// Font assets from @expo-google-fonts packages
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Fredoka_600SemiBold = require("@expo-google-fonts/fredoka/600SemiBold/Fredoka_600SemiBold.ttf");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Nunito_600SemiBold = require("@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Nunito_700Bold = require("@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Nunito_800ExtraBold = require("@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf");

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Fredoka-SemiBold":   Fredoka_600SemiBold,
    "Nunito-SemiBold":    Nunito_600SemiBold,
    "Nunito-Bold":        Nunito_700Bold,
    "Nunito-ExtraBold":   Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F1830", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#18A582" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationGuard />
        <NotificationNavigation />
        <StatusBar style="light" backgroundColor="#0F1830" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0F1830" } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quest/[id]" />
          <Stack.Screen name="game/[id]" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
