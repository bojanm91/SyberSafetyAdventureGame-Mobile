import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/auth-context";
import { T } from "../lib/theme";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={T.teal} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (!user.onboardingDone) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
