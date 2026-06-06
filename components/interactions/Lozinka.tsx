import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

interface Kriterij {
  id: string;
  tekst: string;
  regex: string;
}
interface LozinkaData {
  kriteriji: Kriterij[];
  zabranjene: string[];
}
interface LozinkaCorrect {
  minScore: number;
}

interface Props {
  gameData: LozinkaData;
  correctData: LozinkaCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

function computeScore(password: string, kriteriji: Kriterij[], zabranjene: string[]): { score: number; met: Set<string> } {
  if (!password) return { score: 0, met: new Set() };
  const lower = password.toLowerCase();
  if (zabranjene.some((w) => lower.includes(w))) return { score: 0, met: new Set() };
  const met = new Set<string>();
  for (const k of kriteriji) {
    try {
      if (new RegExp(k.regex).test(password)) met.add(k.id);
    } catch {}
  }
  return { score: Math.round((met.size / kriteriji.length) * 100), met };
}

function strengthLabel(score: number): { label: string; color: string } {
  if (score < 40) return { label: "Slaba", color: "#F87171" };
  if (score < 70) return { label: "Srednja", color: "#FBBF24" };
  if (score < 100) return { label: "Dobra", color: "#22D3EE" };
  return { label: "Jaka 💪", color: "#34D399" };
}

export default function Lozinka({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);

  const { score, met } = computeScore(password, gameData.kriteriji, gameData.zabranjene);
  const { label, color } = strengthLabel(score);

  function submit() {
    if (submitted || score < correctData.minScore) return;
    setSubmitted(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAnswer(true, score / 100);
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Password input */}
      <View style={{ position: "relative" }}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!visible}
          editable={!submitted && !answered}
          placeholder="Napiši svoju lozinku..."
          placeholderTextColor="#8A97AD"
          style={{
            backgroundColor: "#141A2A", borderColor: password ? color : "#26304A",
            borderWidth: 1.5, borderRadius: 14, padding: 14,
            color: "#E5ECF5", fontSize: 16, fontFamily: "monospace",
            paddingRight: 50,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setVisible(!visible)}
          style={{ position: "absolute", right: 14, top: 14 }}
        >
          <Text style={{ fontSize: 18 }}>{visible ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {/* Strength bar */}
      {password.length > 0 && (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#8A97AD", fontSize: 12 }}>Snaga lozinke</Text>
            <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{label}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: "#1C2436", borderRadius: 99, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${score}%`, backgroundColor: color, borderRadius: 99 }} />
          </View>
        </View>
      )}

      {/* Criteria checklist */}
      <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 }}>
        <Text style={{ color: "#8A97AD", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Kriteriji</Text>
        {gameData.kriteriji.map((k) => {
          const ok = met.has(k.id);
          return (
            <View key={k.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: ok ? "#34D399" : "#26304A", fontSize: 16 }}>{ok ? "✓" : "○"}</Text>
              <Text style={{ color: ok ? "#34D399" : "#8A97AD", fontSize: 14 }}>{k.tekst}</Text>
            </View>
          );
        })}
        {gameData.zabranjene.length > 0 && (
          <View style={{ marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#26304A" }}>
            <Text style={{ color: "#8A97AD", fontSize: 12 }}>Zabranjene riječi: {gameData.zabranjene.join(", ")}</Text>
          </View>
        )}
      </View>

      {!submitted && !answered && (
        <TouchableOpacity
          onPress={submit}
          disabled={score < correctData.minScore}
          style={{
            backgroundColor: score >= correctData.minScore ? "#22D3EE" : "#1C2436",
            borderRadius: 14, padding: 14, alignItems: "center",
          }}
        >
          <Text style={{ color: score >= correctData.minScore ? "#0B0F1A" : "#8A97AD", fontWeight: "700", fontSize: 15 }}>
            {score >= correctData.minScore ? "Potvrdi lozinku ✓" : `Dostigni ${correctData.minScore}% snagu...`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
