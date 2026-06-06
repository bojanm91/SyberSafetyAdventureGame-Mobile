import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";

interface BotMessage {
  od: "bot";
  tekst: string;
}
interface PlayerOptions {
  od: "player";
  opcije: Array<{ id: string; tekst: string; tip: "win" | "lose" | "neutral" }>;
}
type Message = BotMessage | PlayerOptions;

interface RazgovorData {
  kontekst: string;
  poruke: Message[];
}
interface RazgovorCorrect {
  tacnoId: string;
}

interface Props {
  gameData: RazgovorData;
  correctData: RazgovorCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

export default function Razgovor({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);

  function choose(id: string, tip: string) {
    if (chosen || answered) return;
    setChosen(id);
    const correct = id === correctData.tacnoId;
    void Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer(correct, 1.0);
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Context */}
      <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 12, padding: 12 }}>
        <Text style={{ color: "#8A97AD", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Situacija</Text>
        <Text style={{ color: "#E5ECF5", fontSize: 14 }}>{gameData.kontekst}</Text>
      </View>

      {/* Chat messages */}
      <View style={{ gap: 10 }}>
        {gameData.poruke.map((msg, i) => {
          if (msg.od === "bot") {
            return (
              <View key={i} style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#F87171", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 14 }}>🤖</Text>
                  </View>
                  <View style={{ backgroundColor: "#1C2436", borderColor: "#26304A", borderWidth: 1, borderRadius: 14, borderBottomLeftRadius: 4, padding: 12 }}>
                    <Text style={{ color: "#E5ECF5", fontSize: 14, lineHeight: 22 }}>{msg.tekst}</Text>
                  </View>
                </View>
              </View>
            );
          }

          // Player choices
          return (
            <View key={i} style={{ gap: 8, marginTop: 4 }}>
              <Text style={{ color: "#8A97AD", fontSize: 12, textAlign: "center" }}>Tvoj odgovor:</Text>
              {msg.opcije.map((opt) => {
                const isChosen = chosen === opt.id;
                const isCorrect = opt.id === correctData.tacnoId;
                const showResult = chosen !== null || revealCorrect;

                let borderColor = "#26304A";
                let bgColor = "#141A2A";
                let textColor = "#E5ECF5";

                if (isChosen && !showResult) {
                  borderColor = "rgba(34,211,238,0.4)";
                  bgColor = "rgba(34,211,238,0.08)";
                } else if (showResult && isCorrect) {
                  borderColor = "rgba(52,211,153,0.5)";
                  bgColor = "rgba(52,211,153,0.1)";
                  textColor = "#34D399";
                } else if (showResult && isChosen && !isCorrect) {
                  borderColor = "rgba(248,113,113,0.5)";
                  bgColor = "rgba(248,113,113,0.1)";
                  textColor = "#F87171";
                }

                return (
                  <TouchableOpacity
                    key={opt.id}
                    disabled={!!chosen || answered}
                    onPress={() => choose(opt.id, opt.tip)}
                    style={{
                      borderWidth: 1.5, borderColor, backgroundColor: bgColor,
                      borderRadius: 12, padding: 12, alignSelf: "flex-end",
                      maxWidth: "85%", minHeight: 44, justifyContent: "center",
                      opacity: showResult && !isCorrect && !isChosen ? 0.4 : 1,
                    }}
                  >
                    <Text style={{ color: textColor, fontSize: 14, lineHeight: 20 }}>{opt.tekst}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}
