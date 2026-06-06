import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface Badge {
  name: string;
  icon: string;
}

interface Props {
  correct: boolean;
  xpEarned: number;
  objasnjenje: string;
  leveledUp: boolean;
  newLevel: number;
  newRank: string;
  earnedBadges: Badge[];
  onContinue: () => void;
  onRetry?: () => void;
}

export default function FeedbackSheet({
  correct, xpEarned, objasnjenje, leveledUp, newLevel, newRank, earnedBadges, onContinue, onRetry,
}: Props) {
  const borderColor = correct ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)";
  const bgColor = correct ? "rgba(52,211,153,0.07)" : "rgba(248,113,113,0.07)";
  const icon = correct ? "✅" : "❌";
  const heading = correct ? "Tačno!" : "Netačno";
  const headingColor = correct ? "#34D399" : "#F87171";

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      {/* Result card */}
      <View style={{ borderWidth: 1.5, borderColor, backgroundColor: bgColor, borderRadius: 20, padding: 20, gap: 16 }}>
        {/* Heading */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 32 }}>{icon}</Text>
          <View>
            <Text style={{ color: headingColor, fontSize: 22, fontWeight: "800" }}>{heading}</Text>
            {correct && xpEarned > 0 && (
              <Text style={{ color: "#8A97AD", fontSize: 14 }}>+{xpEarned} XP zarađeno</Text>
            )}
          </View>
        </View>

        {/* Level-up banner */}
        {leveledUp && (
          <View style={{
            backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.4)",
            borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: "center", gap: 4,
          }}>
            <Text style={{ fontSize: 28 }}>🎉</Text>
            <Text style={{ color: "#8B5CF6", fontWeight: "800", fontSize: 18 }}>Level {newLevel} dostigan!</Text>
            <Text style={{ color: "#8A97AD", fontSize: 13 }}>Rang: {newRank}</Text>
          </View>
        )}

        {/* Explanation */}
        <View>
          <Text style={{ color: "#8A97AD", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Objašnjenje</Text>
          <Text style={{ color: "#E5ECF5", fontSize: 15, lineHeight: 24 }}>{objasnjenje}</Text>
        </View>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <View style={{ backgroundColor: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.25)", borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 }}>
            <Text style={{ color: "#8B5CF6", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700" }}>Novi bedževi!</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {earnedBadges.map((b) => (
                <View key={b.name} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 20 }}>{b.icon}</Text>
                  <Text style={{ color: "#E5ECF5", fontSize: 14, fontWeight: "600" }}>{b.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        {!correct && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={{ flex: 1, borderWidth: 1.5, borderColor: "#26304A", borderRadius: 14, padding: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#E5ECF5", fontWeight: "600", fontSize: 14 }}>↩ Pokušaj ponovo</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onContinue}
          style={{ flex: 1, backgroundColor: "#22D3EE", borderRadius: 14, padding: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#0B0F1A", fontWeight: "700", fontSize: 15 }}>
            {correct ? "Nastavi →" : "Dalje →"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
