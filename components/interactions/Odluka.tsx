import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

interface OdlukaData {
  opcije: Array<{ id: string; tekst: string }>;
}
interface OdlukaCorrect {
  id: string;
}

interface Props {
  gameData: OdlukaData;
  correctData: OdlukaCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

const LABELS = ["A", "B", "C", "D"];

export default function Odluka({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  function pick(id: string) {
    if (answered || selected) return;
    setSelected(id);
    const correct = id === correctData.id;
    void Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer(correct, 1.0);
  }

  return (
    <View style={{ gap: 10 }}>
      {gameData.opcije.map((opt, i) => {
        const isSelected = selected === opt.id;
        const isCorrect = opt.id === correctData.id;
        const showCorrect = revealCorrect && isCorrect;
        const showWrong = revealCorrect && isSelected && !isCorrect;

        let borderColor = "#26304A";
        let bgColor = "#141A2A";
        let textColor = "#8A97AD";
        let labelBg = "#1C2436";
        let labelColor = "#8A97AD";

        if (isSelected && !revealCorrect) {
          borderColor = "rgba(34,211,238,0.5)";
          bgColor = "rgba(34,211,238,0.08)";
          textColor = "#E5ECF5";
          labelBg = "#22D3EE";
          labelColor = "#0B0F1A";
        } else if (showCorrect) {
          borderColor = "rgba(52,211,153,0.5)";
          bgColor = "rgba(52,211,153,0.1)";
          textColor = "#34D399";
          labelBg = "#34D399";
          labelColor = "#0B0F1A";
        } else if (showWrong) {
          borderColor = "rgba(248,113,113,0.5)";
          bgColor = "rgba(248,113,113,0.1)";
          textColor = "#F87171";
          labelBg = "#F87171";
          labelColor = "#0B0F1A";
        }

        return (
          <TouchableOpacity
            key={opt.id}
            disabled={answered || !!selected}
            onPress={() => pick(opt.id)}
            style={{
              borderColor, backgroundColor: bgColor, borderWidth: 1.5,
              borderRadius: 14, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 12,
              opacity: revealCorrect && !isCorrect && !isSelected ? 0.45 : 1,
            }}
          >
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: labelBg, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: labelColor, fontWeight: "700", fontSize: 12 }}>
                {showCorrect ? "✓" : showWrong ? "✗" : LABELS[i]}
              </Text>
            </View>
            <Text style={{ color: textColor, fontSize: 15, flex: 1, lineHeight: 22 }}>{opt.tekst}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
