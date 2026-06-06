import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

interface Option {
  tekst: string;
  oznaka: string;
}
interface PravoLaznoData {
  tip?: string;
  uputstvo: string;
  a: Option;
  b: Option;
}
interface PravoLaznoCorrect {
  tacno: "a" | "b";
}

interface Props {
  gameData: PravoLaznoData;
  correctData: PravoLaznoCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

export default function PravoLazno({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [selected, setSelected] = useState<"a" | "b" | null>(null);

  function pick(id: "a" | "b") {
    if (selected || answered) return;
    setSelected(id);
    const correct = id === correctData.tacno;
    void Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer(correct, 1.0);
  }

  function cardStyle(id: "a" | "b") {
    const isSelected = selected === id;
    const isCorrect = id === correctData.tacno;
    const showResult = selected !== null || revealCorrect;

    if (showResult) {
      if (isCorrect) return { borderColor: "rgba(52,211,153,0.6)", bg: "rgba(52,211,153,0.1)" };
      if (isSelected && !isCorrect) return { borderColor: "rgba(248,113,113,0.6)", bg: "rgba(248,113,113,0.1)" };
      return { borderColor: "#26304A", bg: "#141A2A" };
    }
    if (isSelected) return { borderColor: "rgba(34,211,238,0.5)", bg: "rgba(34,211,238,0.08)" };
    return { borderColor: "#26304A", bg: "#141A2A" };
  }

  const options: Array<{ id: "a" | "b"; data: Option }> = [
    { id: "a", data: gameData.a },
    { id: "b", data: gameData.b },
  ];

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: "#8A97AD", fontSize: 14, textAlign: "center" }}>{gameData.uputstvo}</Text>

      {options.map(({ id, data }) => {
        const s = cardStyle(id);
        const isCorrect = id === correctData.tacno;
        const isWrong = selected === id && !isCorrect;
        const showResult = (selected !== null || revealCorrect);

        return (
          <TouchableOpacity
            key={id}
            disabled={!!selected || answered}
            onPress={() => pick(id)}
            style={{
              borderWidth: 2, borderColor: s.borderColor, backgroundColor: s.bg,
              borderRadius: 16, padding: 16, gap: 8,
              opacity: showResult && !isCorrect && selected !== id ? 0.5 : 1,
            }}
          >
            {/* Label badge */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: showResult && isCorrect ? "#34D399" : showResult && isWrong ? "#F87171" : "#1C2436",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: showResult ? "#0B0F1A" : "#8A97AD", fontWeight: "700", fontSize: 13 }}>
                  {showResult && isCorrect ? "✓" : showResult && isWrong ? "✗" : data.oznaka}
                </Text>
              </View>
              {showResult && isCorrect && <Text style={{ color: "#34D399", fontSize: 12, fontWeight: "600" }}>TAČNO</Text>}
              {showResult && isWrong && <Text style={{ color: "#F87171", fontSize: 12, fontWeight: "600" }}>NETAČNO</Text>}
            </View>

            {/* URL / content */}
            <View style={{ backgroundColor: "#0B0F1A", borderRadius: 8, padding: 10 }}>
              <Text style={{ color: "#22D3EE", fontSize: 13, fontFamily: "monospace" }}>{data.tekst}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
