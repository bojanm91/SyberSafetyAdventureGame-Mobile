import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";

interface Stavka {
  id: string;
  tekst: string;
}
interface Kanta {
  id: string;
  naziv: string;
}
interface RazvrstajData {
  stavke: Stavka[];
  kante: Kanta[];
}
interface RazvrstajCorrect {
  [kantaId: string]: string[];
}

interface Props {
  gameData: RazvrstajData;
  correctData: RazvrstajCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

export default function Razvrstaj({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [assignments, setAssignments] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(gameData.stavke.map((s) => [s.id, null])),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function selectItem(id: string) {
    if (submitted || answered) return;
    setSelected((prev) => (prev === id ? null : id));
    void Haptics.selectionAsync();
  }

  function assignToKanta(kantaId: string) {
    if (!selected || submitted || answered) return;
    setAssignments((prev) => ({ ...prev, [selected]: kantaId }));
    setSelected(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function unassign(stavkaId: string) {
    if (submitted || answered) return;
    setAssignments((prev) => ({ ...prev, [stavkaId]: null }));
    void Haptics.selectionAsync();
  }

  function submit() {
    if (submitted) return;
    const allAssigned = gameData.stavke.every((s) => assignments[s.id] !== null);
    if (!allAssigned) return;
    setSubmitted(true);

    let correct_count = 0;
    let total = 0;
    for (const [kantaId, ids] of Object.entries(correctData)) {
      for (const id of ids) {
        total++;
        if (assignments[id] === kantaId) correct_count++;
      }
    }
    const ratio = correct_count / total;
    void Haptics.impactAsync(ratio === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer(ratio === 1, ratio);
  }

  const unassigned = gameData.stavke.filter((s) => assignments[s.id] === null);
  const allAssigned = gameData.stavke.every((s) => assignments[s.id] !== null);

  function getStavkaStatus(stavkaId: string, kantaId: string) {
    if (!submitted && !revealCorrect) return "normal";
    const correct = correctData[kantaId]?.includes(stavkaId);
    return correct ? "correct" : "wrong";
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Instructions */}
      <View style={{ backgroundColor: "rgba(34,211,238,0.08)", borderColor: "rgba(34,211,238,0.2)", borderWidth: 1, borderRadius: 12, padding: 10 }}>
        <Text style={{ color: "#22D3EE", fontSize: 13, textAlign: "center" }}>
          {selected ? "Sada tapni kategoriju ↓" : "Tapni stavku, pa tapni kategoriju"}
        </Text>
      </View>

      {/* Unassigned items */}
      {unassigned.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#8A97AD", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Stavke</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {unassigned.map((s) => {
              const isSelected = selected === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => selectItem(s.id)}
                  disabled={submitted || answered}
                  style={{
                    borderWidth: 1.5,
                    borderColor: isSelected ? "#22D3EE" : "#26304A",
                    backgroundColor: isSelected ? "rgba(34,211,238,0.12)" : "#141A2A",
                    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: isSelected ? "#22D3EE" : "#E5ECF5", fontSize: 14 }}>{s.tekst}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Bins */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {gameData.kante.map((kanta) => {
          const items = gameData.stavke.filter((s) => assignments[s.id] === kanta.id);
          const isTarget = !!selected;
          return (
            <TouchableOpacity
              key={kanta.id}
              onPress={() => assignToKanta(kanta.id)}
              disabled={!selected || submitted || answered}
              style={{
                flex: 1, minHeight: 120,
                borderWidth: 2,
                borderStyle: isTarget && !submitted ? "dashed" : "solid",
                borderColor: isTarget && !submitted ? "#22D3EE" : "#26304A",
                backgroundColor: "#141A2A", borderRadius: 14, padding: 10,
              }}
            >
              <Text style={{ color: "#E5ECF5", fontWeight: "700", fontSize: 13, marginBottom: 8, textAlign: "center" }}>{kanta.naziv}</Text>
              <View style={{ gap: 6 }}>
                {items.map((s) => {
                  const status = getStavkaStatus(s.id, kanta.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => unassign(s.id)}
                      disabled={submitted || answered}
                      style={{
                        borderRadius: 8, padding: 6,
                        backgroundColor: status === "correct" ? "rgba(52,211,153,0.15)" : status === "wrong" ? "rgba(248,113,113,0.15)" : "rgba(34,211,238,0.1)",
                        borderWidth: 1,
                        borderColor: status === "correct" ? "rgba(52,211,153,0.4)" : status === "wrong" ? "rgba(248,113,113,0.4)" : "rgba(34,211,238,0.25)",
                      }}
                    >
                      <Text style={{
                        color: status === "correct" ? "#34D399" : status === "wrong" ? "#F87171" : "#E5ECF5",
                        fontSize: 13, textAlign: "center",
                      }}>{s.tekst}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!submitted && !answered && (
        <TouchableOpacity
          onPress={submit}
          disabled={!allAssigned}
          style={{
            backgroundColor: allAssigned ? "#22D3EE" : "#1C2436",
            borderRadius: 14, padding: 14, alignItems: "center",
          }}
        >
          <Text style={{ color: allAssigned ? "#0B0F1A" : "#8A97AD", fontWeight: "700", fontSize: 15 }}>
            {allAssigned ? "Potvrdi razvrstaj" : `Rasporedi sve stavke (${unassigned.length} ostalo)`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
