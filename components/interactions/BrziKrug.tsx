import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import * as Haptics from "expo-haptics";

interface Pitanje {
  tekst: string;
  opcije: string[];
  tacno: number;
}
interface BrziKrugData {
  vrijemeSekundi: number;
  pitanja: Pitanje[];
}
interface BrziKrugCorrect {
  tacni: number[];
}

interface Props {
  gameData: BrziKrugData;
  correctData: BrziKrugCorrect;
  onAnswer: (correct: boolean, xpMultiplier: number) => void;
  answered: boolean;
  revealCorrect: boolean;
}

const LABELS = ["A", "B", "C", "D"];

export default function BrziKrug({ gameData, correctData, onAnswer, answered, revealCorrect }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(gameData.vrijemeSekundi);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<number[]>([]);
  const barWidth = useRef(new Animated.Value(1)).current;

  function startGame() {
    setStarted(true);
    Animated.timing(barWidth, {
      toValue: 0,
      duration: gameData.vrijemeSekundi * 1000,
      useNativeDriver: false,
    }).start();
  }

  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishGame(answersRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, finished]);

  function pickAnswer(idx: number) {
    if (finished || answered) return;
    void Haptics.selectionAsync();
    const newAnswers = [...answers, idx];
    answersRef.current = newAnswers;
    setAnswers(newAnswers);

    if (current + 1 >= gameData.pitanja.length) {
      clearInterval(timerRef.current!);
      finishGame(newAnswers);
    } else {
      setCurrent(current + 1);
    }
  }

  function finishGame(ans: number[]) {
    setFinished(true);
    const total = gameData.pitanja.length;
    let correct_count = 0;
    for (let i = 0; i < ans.length; i++) {
      if (ans[i] === correctData.tacni[i]) correct_count++;
    }
    const timeBonus = timeLeft > 20 ? 0.2 : timeLeft > 10 ? 0.1 : 0;
    const ratio = (correct_count / total) + timeBonus;
    void Haptics.impactAsync(correct_count === total ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    onAnswer(correct_count >= Math.ceil(total * 0.6), Math.min(1.2, ratio));
  }

  if (!started) {
    return (
      <View style={{ alignItems: "center", gap: 16 }}>
        <Text style={{ fontSize: 48 }}>⚡</Text>
        <Text style={{ color: "#E5ECF5", fontSize: 18, fontWeight: "700", textAlign: "center" }}>Brzi krug!</Text>
        <Text style={{ color: "#8A97AD", fontSize: 14, textAlign: "center" }}>
          {gameData.pitanja.length} pitanja · {gameData.vrijemeSekundi} sekundi
        </Text>
        <Text style={{ color: "#8A97AD", fontSize: 13, textAlign: "center" }}>
          Što brže odgovoriš — veći bonus!
        </Text>
        <TouchableOpacity
          onPress={startGame}
          style={{ backgroundColor: "#22D3EE", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 }}
        >
          <Text style={{ color: "#0B0F1A", fontWeight: "700", fontSize: 16 }}>Kreni! →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    const total = gameData.pitanja.length;
    const correct_count = answers.filter((a, i) => a === correctData.tacni[i]).length;
    return (
      <View style={{ alignItems: "center", gap: 12 }}>
        <Text style={{ fontSize: 40 }}>{correct_count === total ? "🏆" : correct_count >= total / 2 ? "👍" : "💪"}</Text>
        <Text style={{ color: "#E5ECF5", fontSize: 20, fontWeight: "700" }}>
          {correct_count} / {total} tačno
        </Text>
        <Text style={{ color: "#8A97AD", fontSize: 14 }}>
          Preostalo: {timeLeft}s · {Math.round(((timeLeft) / gameData.vrijemeSekundi) * 100)}% vremena
        </Text>
      </View>
    );
  }

  const q = gameData.pitanja[current];

  return (
    <View style={{ gap: 14 }}>
      {/* Timer bar */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#8A97AD", fontSize: 12 }}>Pitanje {current + 1} / {gameData.pitanja.length}</Text>
          <Text style={{ color: timeLeft < 10 ? "#F87171" : "#FBBF24", fontSize: 12, fontWeight: "700" }}>⏱ {timeLeft}s</Text>
        </View>
        <View style={{ height: 4, backgroundColor: "#1C2436", borderRadius: 99, overflow: "hidden" }}>
          <Animated.View style={{
            height: "100%",
            backgroundColor: timeLeft < 10 ? "#F87171" : "#22D3EE",
            width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            borderRadius: 99,
          }} />
        </View>
      </View>

      {/* Question */}
      <View style={{ backgroundColor: "#141A2A", borderColor: "#26304A", borderWidth: 1, borderRadius: 14, padding: 16 }}>
        <Text style={{ color: "#E5ECF5", fontSize: 16, fontWeight: "600", lineHeight: 24 }}>{q.tekst}</Text>
      </View>

      {/* Options */}
      <View style={{ gap: 8 }}>
        {q.opcije.map((opt, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => pickAnswer(i)}
            style={{
              borderWidth: 1.5, borderColor: "#26304A",
              backgroundColor: "#141A2A", borderRadius: 12, padding: 12,
              flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44,
            }}
          >
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#1C2436", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#8A97AD", fontWeight: "700", fontSize: 12 }}>{LABELS[i]}</Text>
            </View>
            <Text style={{ color: "#E5ECF5", fontSize: 14, flex: 1 }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
