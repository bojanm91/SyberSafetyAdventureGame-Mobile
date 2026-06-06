import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";

interface Zastavica {
  id: string;
  tekst: string;
  element: "od" | "naslov" | "tijelo" | "link";
}
interface PhishingData {
  od: string;
  naslov: string;
  tijelo: string;
  link: string;
  zastavice: Zastavica[];
}
interface PhishingCorrect {
  ids: string[];
}

interface Props {
  gameData: PhishingData;
  correctData: PhishingCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

export default function PhishingInbox({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  function toggle(id: string) {
    if (submitted || answered) return;
    setTapped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    void Haptics.selectionAsync();
  }

  function submit() {
    if (submitted) return;
    setSubmitted(true);
    const correctSet = new Set(correctData.ids);
    const tappedArr = Array.from(tapped);
    const correct = tappedArr.every((id) => correctSet.has(id)) && tappedArr.length === correctData.ids.length;
    const ratio = tappedArr.filter((id) => correctSet.has(id)).length / correctData.ids.length;
    void Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer(correct, Math.max(0.3, ratio));
  }

  const correctSet = new Set(correctData.ids);

  return (
    <View style={{ gap: 12 }}>
      {/* Email card */}
      <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 16, overflow: "hidden" }}>
        {/* Email header */}
        <View style={{ backgroundColor: "#1C2436", padding: 14, borderBottomWidth: 1, borderBottomColor: "#26304A", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
            <Text style={{ color: "#8A97AD", fontSize: 12, width: 34 }}>Od:</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 13, flex: 1, fontFamily: "monospace" }}>{gameData.od}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
            <Text style={{ color: "#8A97AD", fontSize: 12, width: 34 }}>Naslov:</Text>
            <Text style={{ color: "#E5ECF5", fontSize: 13, flex: 1, fontWeight: "600" }}>{gameData.naslov}</Text>
          </View>
        </View>

        {/* Email body */}
        <View style={{ padding: 14, gap: 8 }}>
          <Text style={{ color: "#8A97AD", fontSize: 13, lineHeight: 20 }}>{gameData.tijelo}</Text>
          <View style={{ backgroundColor: "#0B0F1A", borderRadius: 8, padding: 10 }}>
            <Text style={{ color: "#22D3EE", fontSize: 12, fontFamily: "monospace" }}>{gameData.link}</Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <Text style={{ color: "#FBBF24", fontSize: 13, fontWeight: "600", textAlign: "center" }}>
        👆 Tapni sve crvene zastavice!
      </Text>

      {/* Red flags */}
      <View style={{ gap: 8 }}>
        {gameData.zastavice.map((z) => {
          const isTapped = tapped.has(z.id);
          const isCorrect = correctSet.has(z.id);
          const showResult = submitted || revealCorrect;

          let borderColor = "#26304A";
          let bgColor = "#141A2A";
          let iconColor = "#8A97AD";
          let icon = "○";

          if (!showResult && isTapped) {
            borderColor = "rgba(251,191,36,0.5)";
            bgColor = "rgba(251,191,36,0.1)";
            icon = "●";
            iconColor = "#FBBF24";
          } else if (showResult && isCorrect && isTapped) {
            borderColor = "rgba(52,211,153,0.5)";
            bgColor = "rgba(52,211,153,0.1)";
            icon = "✓";
            iconColor = "#34D399";
          } else if (showResult && isCorrect && !isTapped) {
            borderColor = "rgba(248,113,113,0.5)";
            bgColor = "rgba(248,113,113,0.08)";
            icon = "!";
            iconColor = "#F87171";
          } else if (showResult && !isCorrect && isTapped) {
            borderColor = "rgba(248,113,113,0.3)";
            bgColor = "rgba(248,113,113,0.05)";
            icon = "✗";
            iconColor = "#F87171";
          }

          return (
            <TouchableOpacity
              key={z.id}
              disabled={submitted || answered}
              onPress={() => toggle(z.id)}
              style={{
                borderColor, backgroundColor: bgColor, borderWidth: 1.5, borderRadius: 12,
                padding: 12, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44,
              }}
            >
              <Text style={{ color: iconColor, fontSize: 16, fontWeight: "700", width: 20, textAlign: "center" }}>{icon}</Text>
              <Text style={{ color: "#E5ECF5", fontSize: 14, flex: 1 }}>{z.tekst}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!submitted && !answered && (
        <TouchableOpacity
          onPress={submit}
          disabled={tapped.size === 0}
          style={{
            backgroundColor: tapped.size > 0 ? "#22D3EE" : "#1C2436",
            borderRadius: 14, padding: 14, alignItems: "center", marginTop: 4,
          }}
        >
          <Text style={{ color: tapped.size > 0 ? "#0B0F1A" : "#8A97AD", fontWeight: "700", fontSize: 15 }}>
            Potvrdi odabir ({tapped.size} / {correctData.ids.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
