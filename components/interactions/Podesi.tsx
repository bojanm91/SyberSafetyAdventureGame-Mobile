import { useState } from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import * as Haptics from "expo-haptics";

interface Opcija {
  id: string;
  naziv: string;
  opis: string;
  ikona: string;
  tacnoStanje: boolean;
}
interface PodesiData {
  uputstvo: string;
  opcije: Opcija[];
}
interface PodesiCorrect {
  ukljuceno: string[];
  iskljuceno: string[];
}

interface Props {
  gameData: PodesiData;
  correctData: PodesiCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

export default function Podesi({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [states, setStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(gameData.opcije.map((o) => [o.id, false])),
  );
  const [submitted, setSubmitted] = useState(false);

  function toggle(id: string) {
    if (submitted || answered) return;
    setStates((prev) => ({ ...prev, [id]: !prev[id] }));
    void Haptics.selectionAsync();
  }

  function submit() {
    if (submitted) return;
    setSubmitted(true);

    const ukljuceno = new Set(correctData.ukljuceno);
    const iskljuceno = new Set(correctData.iskljuceno);
    let correct_count = 0;
    const total = gameData.opcije.length;

    for (const o of gameData.opcije) {
      const stateOk = (ukljuceno.has(o.id) && states[o.id]) || (iskljuceno.has(o.id) && !states[o.id]);
      if (stateOk) correct_count++;
    }

    const ratio = correct_count / total;
    void Haptics.impactAsync(ratio === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer(ratio === 1, ratio);
  }

  const ukljucenoSet = new Set(correctData.ukljuceno);
  const iskljucenoSet = new Set(correctData.iskljuceno);

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: "#8A97AD", fontSize: 14, textAlign: "center" }}>{gameData.uputstvo}</Text>

      <View style={{ gap: 8 }}>
        {gameData.opcije.map((opt) => {
          const currentOn = states[opt.id];
          const correct = ukljucenoSet.has(opt.id) ? currentOn : !currentOn;
          const showResult = submitted || revealCorrect;

          let borderColor = "#26304A";
          if (showResult) {
            borderColor = correct ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)";
          }

          return (
            <View
              key={opt.id}
              style={{
                borderWidth: 1.5, borderColor,
                backgroundColor: "#141A2A", borderRadius: 14, padding: 14,
                flexDirection: "row", alignItems: "center", gap: 12, minHeight: 68,
              }}
            >
              {/* Icon */}
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#1C2436", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20 }}>{opt.ikona}</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: "#E5ECF5", fontWeight: "600", fontSize: 14 }}>{opt.naziv}</Text>
                  {showResult && (
                    <Text style={{ fontSize: 14 }}>{correct ? "✅" : "❌"}</Text>
                  )}
                </View>
                <Text style={{ color: "#8A97AD", fontSize: 12, marginTop: 2 }}>{opt.opis}</Text>
                {showResult && !correct && (
                  <Text style={{ color: "#F87171", fontSize: 11, marginTop: 3 }}>
                    Trebalo bi biti: {ukljucenoSet.has(opt.id) ? "UKLJUČENO" : "ISKLJUČENO"}
                  </Text>
                )}
              </View>

              {/* Toggle */}
              <Switch
                value={currentOn}
                onValueChange={() => toggle(opt.id)}
                disabled={submitted || answered}
                trackColor={{ false: "#26304A", true: "rgba(34,211,238,0.4)" }}
                thumbColor={currentOn ? "#22D3EE" : "#8A97AD"}
              />
            </View>
          );
        })}
      </View>

      {!submitted && !answered && (
        <TouchableOpacity
          onPress={submit}
          style={{ backgroundColor: "#22D3EE", borderRadius: 14, padding: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#0B0F1A", fontWeight: "700", fontSize: 15 }}>Primijeni postavke</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
