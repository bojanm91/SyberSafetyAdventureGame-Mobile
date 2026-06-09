import { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/auth-context";
import {
  markPushPromptAnswered,
  registerForPushNotifications,
} from "../lib/notifications";
import { T } from "../lib/theme";
import Bajt from "./Bajt";

interface Props {
  onDone: () => void;
  title?: string;
  body?: string;
}

export default function PushPermissionPrompt({
  onDone,
  title = "Želiš Bajtove podsjetnike?",
  body = "Mogu da te podsjetim na dnevni izazov, nastavak misije i nove oblasti. Bez spama, samo korisne poruke.",
}: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function close(answered = true) {
    if (answered && user?.id) await markPushPromptAnswered(user.id);
    onDone();
  }

  async function enablePush() {
    if (!user?.id || busy) return;
    setBusy(true);
    try {
      await registerForPushNotifications(user.id);
      await markPushPromptAnswered(user.id);
      Alert.alert("Obavještenja su uključena", "Bajt sada može da ti pošalje podsjetnik kad ima nešto korisno.");
      onDone();
    } catch (err) {
      await markPushPromptAnswered(user.id);
      Alert.alert(
        "Obavještenja nisu uključena",
        err instanceof Error ? err.message : "Možeš ih kasnije uključiti na profilu.",
      );
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(3,7,18,0.82)",
        alignItems: "center", justifyContent: "center",
        paddingHorizontal: 22, zIndex: 80,
      }}
    >
      <View
        style={{
          width: "100%", maxWidth: 420,
          borderRadius: T.rLg,
          borderWidth: 1.5, borderColor: "rgba(34,211,238,0.32)",
          overflow: "hidden",
          backgroundColor: T.panel,
          ...T.shadowCard,
        }}
      >
        <LinearGradient
          colors={["rgba(34,211,238,0.18)", "rgba(93,202,165,0.08)", "rgba(10,16,32,0)"]}
          style={{ padding: 20, alignItems: "center" }}
        >
          <View style={{ marginBottom: -8 }}>
            <Bajt emotion="wink" size={118} />
          </View>
          <View
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: T.sun,
              alignItems: "center", justifyContent: "center",
              borderWidth: 3, borderColor: "rgba(255,255,255,0.18)",
              marginTop: -10, marginBottom: 12,
            }}
          >
            <Text style={{ fontFamily: T.fontHead, color: "#111827", fontSize: 28 }}>?</Text>
          </View>

          <Text style={{ fontFamily: T.fontHead, color: T.hudInk, fontSize: 22, textAlign: "center", lineHeight: 27 }}>
            {title}
          </Text>
          <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9 }}>
            {body}
          </Text>
        </LinearGradient>

        <View style={{ padding: 16, gap: 10 }}>
          <TouchableOpacity
            onPress={enablePush}
            disabled={busy}
            activeOpacity={0.82}
            style={{
              backgroundColor: T.teal,
              borderRadius: T.rPill,
              paddingVertical: 13,
              alignItems: "center",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#04121A" />
            ) : (
              <Text style={{ fontFamily: T.fontBodyXBold, color: "#04121A", fontSize: 14 }}>Da, uključi obavještenja</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => void close(true)}
            disabled={busy}
            activeOpacity={0.82}
            style={{
              borderRadius: T.rPill,
              paddingVertical: 12,
              alignItems: "center",
              borderWidth: 1, borderColor: T.border,
              opacity: busy ? 0.55 : 1,
            }}
          >
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 14 }}>Ne sada</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
