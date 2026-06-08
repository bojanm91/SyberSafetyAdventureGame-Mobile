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

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);

  async function handleRegister() {
    setError("");
    if (password !== confirmPassword) { setError("Lozinke se ne poklapaju."); return; }
    setLoading(true);
    try {
      await register(username, email, password, confirmPassword);
      // New users always go through onboarding
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri registraciji.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "rgba(38,37,34,0.06)",
    borderWidth: 2, borderColor: T.paperLine,
    borderRadius: T.rMd, paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: T.fontBody, fontSize: 15, color: T.ink,
    marginBottom: 14,
  };
  const labelStyle = {
    fontFamily: T.fontBody, fontSize: 11, color: T.inkSoft,
    letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 8,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
          <View style={{ marginBottom: 24, alignItems: "flex-start" }}>
            <View style={{
              width: 56, height: 56, borderRadius: 18,
              backgroundColor: T.primarySoft,
              borderWidth: 2, borderColor: T.primaryInk,
              alignItems: "center", justifyContent: "center",
              marginBottom: 14,
            }}>
              <Text style={{ fontSize: 26 }}>⛨</Text>
            </View>
            <Text style={{ fontFamily: T.fontHead, fontSize: 26, color: T.hudInk }}>
              Akademija Sajber Čuvara
            </Text>
            <Text style={{ fontFamily: T.fontBody, fontSize: 13, color: T.hudMuted, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>
              Kreiranje profila
            </Text>
          </View>

          {/* Info banner */}
          <View style={{
            backgroundColor: T.primarySoft,
            borderWidth: 1, borderColor: "rgba(62,155,232,0.3)",
            borderRadius: T.rMd, paddingHorizontal: 14, paddingVertical: 10,
            marginBottom: 16,
          }}>
            <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 13 }}>
              Nakon registracije kreirat ćeš svog{" "}
              <Text style={{ color: T.mint }}>Sajber Čuvara</Text>{" "}
              i krenuti u prvu misiju.
            </Text>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: T.paper,
            borderRadius: T.rLg,
            borderWidth: 2.5, borderColor: T.paperLine,
            padding: 22,
            ...T.shadowCard,
          }}>
            <Text style={{ fontFamily: T.fontHead, fontSize: 22, color: T.ink, marginBottom: 4 }}>
              Kreiraj profil
            </Text>
            <Text style={{ fontFamily: T.fontBody, fontSize: 14, color: T.inkSoft, marginBottom: 20 }}>
              Postani cyber agent i počni avanturu.
            </Text>

            <Text style={labelStyle}>Korisničko ime</Text>
            <TextInput
              style={inputStyle}
              placeholder="cyber_agent_01"
              placeholderTextColor={T.inkFaint}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
            />

            <Text style={labelStyle}>Email</Text>
            <TextInput
              style={inputStyle}
              placeholder="agent@example.com"
              placeholderTextColor={T.inkFaint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={labelStyle}>Lozinka</Text>
            <TextInput
              style={inputStyle}
              placeholder="••••••••"
              placeholderTextColor={T.inkFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={labelStyle}>Potvrda lozinke</Text>
            <TextInput
              style={{ ...inputStyle, marginBottom: error ? 14 : 4 }}
              placeholder="••••••••"
              placeholderTextColor={T.inkFaint}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {error ? (
              <View style={{
                backgroundColor: T.badSoft, borderWidth: 2, borderColor: T.bad,
                borderRadius: T.rMd, paddingHorizontal: 14, paddingVertical: 10,
                marginBottom: 14,
              }}>
                <Text style={{ fontFamily: T.fontBody, color: T.badInk, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => void handleRegister()}
              disabled={loading}
              style={{
                backgroundColor: T.tealDeep, borderRadius: T.rPill,
                paddingVertical: 16, alignItems: "center",
                opacity: loading ? 0.6 : 1,
                borderBottomWidth: 4, borderBottomColor: "#08634A",
              }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontFamily: T.fontHead, fontSize: 17, color: "#fff" }}>Kreiraj nalog</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20, gap: 4 }}>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14 }}>Već imaš nalog?</Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 14 }}>Prijavi se</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
