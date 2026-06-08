import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/auth-context";
import { T } from "../lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const done = await AsyncStorage.getItem("onboardingDone");
      router.replace(done === "true" ? "/(tabs)/" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri prijavi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Scene gradient */}
      <LinearGradient
        colors={[T.scene1, T.scene2, T.bg]}
        locations={[0, 0.5, 1]}
        style={{ position: "absolute", inset: 0 }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          {/* Logo */}
          <View style={{ marginBottom: 32, alignItems: "flex-start" }}>
            <View style={{
              width: 56, height: 56, borderRadius: 18,
              backgroundColor: T.primarySoft,
              borderWidth: 2, borderColor: T.primaryInk,
              alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 26 }}>⛨</Text>
            </View>
            <Text style={{ fontFamily: T.fontHead, fontSize: 26, color: T.hudInk, lineHeight: 30 }}>
              Akademija Sajber Čuvara
            </Text>
            <Text style={{ fontFamily: T.fontBody, fontSize: 13, color: T.hudMuted, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>
              Prijava agenta
            </Text>
          </View>

          {/* Form card (paper dialog style) */}
          <View style={{
            backgroundColor: T.paper,
            borderRadius: T.rLg,
            borderWidth: 2.5,
            borderColor: T.paperLine,
            padding: 22,
            ...T.shadowCard,
          }}>
            <Text style={{ fontFamily: T.fontHead, fontSize: 22, color: T.ink, marginBottom: 4 }}>
              Dobrodošao nazad
            </Text>
            <Text style={{ fontFamily: T.fontBody, fontSize: 14, color: T.inkSoft, marginBottom: 20 }}>
              Nastavi svoju cyber avanturu.
            </Text>

            {/* Email */}
            <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkSoft, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              style={{
                backgroundColor: "rgba(38,37,34,0.06)",
                borderWidth: 2, borderColor: T.paperLine,
                borderRadius: T.rMd, paddingHorizontal: 16, paddingVertical: 13,
                fontFamily: T.fontBody, fontSize: 15, color: T.ink,
                marginBottom: 14,
              }}
              placeholder="agent@example.com"
              placeholderTextColor={T.inkFaint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {/* Password */}
            <Text style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkSoft, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Lozinka
            </Text>
            <TextInput
              style={{
                backgroundColor: "rgba(38,37,34,0.06)",
                borderWidth: 2, borderColor: T.paperLine,
                borderRadius: T.rMd, paddingHorizontal: 16, paddingVertical: 13,
                fontFamily: T.fontBody, fontSize: 15, color: T.ink,
                marginBottom: 14,
              }}
              placeholder="••••••••"
              placeholderTextColor={T.inkFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {/* Error */}
            {error ? (
              <View style={{
                backgroundColor: T.badSoft,
                borderWidth: 2, borderColor: T.bad,
                borderRadius: T.rMd, paddingHorizontal: 14, paddingVertical: 10,
                marginBottom: 14,
              }}>
                <Text style={{ fontFamily: T.fontBody, color: T.badInk, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            {/* CTA button */}
            <TouchableOpacity
              onPress={() => void handleLogin()}
              disabled={loading}
              style={{
                backgroundColor: T.tealDeep,
                borderRadius: T.rPill,
                paddingVertical: 16,
                alignItems: "center",
                opacity: loading ? 0.6 : 1,
                borderBottomWidth: 4,
                borderBottomColor: "#08634A",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontFamily: T.fontHead, fontSize: 17, color: "#fff" }}>Prijavi se</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20, gap: 4 }}>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14 }}>Nemaš nalog?</Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 14 }}>Registruj se</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
