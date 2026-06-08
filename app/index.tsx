import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/auth-context";
import { T } from "../lib/theme";

export default function Index() {
  const { user, loading }       = useAuth();
  const [onboardingDone, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && user) {
      AsyncStorage.getItem("onboardingDone")
        .then((v) => setDone(v === "true"))
        .catch(() => setDone(true));
    }
  }, [loading, user]);

  if (loading || (user && onboardingDone === null)) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={T.teal} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (!onboardingDone) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/" />;
}
