import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/auth-context";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");
    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, confirmPassword);
      router.replace("/(tabs)/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri registraciji.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Logo */}
          <View className="mb-8">
            <View className="w-14 h-14 rounded-2xl bg-cyan/20 items-center justify-center mb-4">
              <Text className="text-2xl">⛨</Text>
            </View>
            <Text className="text-white text-2xl font-bold">CyberSafety</Text>
            <Text className="text-slate-500 text-xs tracking-widest uppercase mt-0.5">Adventure Game</Text>
          </View>

          {/* Info banner */}
          <View className="bg-cyan/10 border border-cyan/20 rounded-2xl px-4 py-3 mb-5">
            <Text className="text-slate-300 text-xs">
              Nakon registracije dobićeš status{" "}
              <Text className="text-cyan font-semibold">Cyber Rookie</Text> i pristup prvim misijama.
            </Text>
          </View>

          {/* Card */}
          <View className="bg-panel border border-cyan/20 rounded-3xl p-6">
            <Text className="text-white text-2xl font-bold mb-1">Kreiraj profil</Text>
            <Text className="text-slate-400 text-sm mb-6">Postani cyber agent i počni avanturu.</Text>

            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-2">Korisničko ime</Text>
            <TextInput
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm mb-4"
              placeholder="cyber_agent_01"
              placeholderTextColor="#475569"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
            />

            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-2">Email</Text>
            <TextInput
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm mb-4"
              placeholder="agent@example.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-2">Lozinka</Text>
            <TextInput
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm mb-4"
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-2">Potvrda lozinke</Text>
            <TextInput
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm mb-4"
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {error ? (
              <View className="bg-rose/10 border border-rose/20 rounded-2xl px-4 py-3 mb-4">
                <Text className="text-rose text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className="w-full bg-cyan rounded-2xl py-4 items-center mt-1"
              onPress={() => void handleRegister()}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#04111f" />
              ) : (
                <Text className="text-[#04111f] font-semibold text-sm">Kreiraj nalog</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-6 gap-1">
            <Text className="text-slate-400 text-sm">Već imaš nalog?</Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-cyan text-sm">Prijavi se</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
