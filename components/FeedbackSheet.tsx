import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { T } from "../lib/theme";

interface Badge { name: string; icon: string }

interface Props {
  correct: boolean;
  xpEarned: number;
  xpTotal: number;
  objasnjenje: string;
  leveledUp: boolean;
  newLevel: number;
  newRank: string;
  earnedBadges: Badge[];
  hasNext: boolean;
  onContinue: () => void;
  onRetry?: () => void;
}

export default function FeedbackSheet({
  correct, xpEarned, xpTotal, objasnjenje, leveledUp, newLevel, newRank,
  earnedBadges, hasNext, onContinue, onRetry,
}: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>

      {/* ── Result banner ── */}
      <View style={{
        borderWidth: 2,
        borderColor: correct ? T.good : T.bad,
        backgroundColor: correct ? T.goodSoft : T.badSoft,
        borderRadius: T.rLg, padding: 18,
        flexDirection: "row", alignItems: "center", gap: 14,
      }}>
        <Text style={{ fontSize: 36 }}>{correct ? "✅" : "❌"}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: T.fontHead, fontSize: 22, color: correct ? T.goodInk : T.badInk }}>
            {correct ? "Tačno!" : "Netačno"}
          </Text>
          {correct && xpEarned > 0 && (
            <Text style={{ fontFamily: T.fontBody, color: correct ? T.goodInk : T.badInk, fontSize: 14, opacity: 0.8, marginTop: 2 }}>
              +{xpEarned} XP zarađeno
            </Text>
          )}
        </View>
      </View>

      {/* ── Saved indicator ── */}
      {correct && (
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          backgroundColor: T.hudBg, borderWidth: 1, borderColor: T.hudStroke,
          borderRadius: T.rMd, paddingHorizontal: 14, paddingVertical: 10,
        }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: T.good, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 13, fontFamily: T.fontBodyXBold }}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: T.fontBodyXBold, color: T.hudInk, fontSize: 13 }}>Napredak sačuvan</Text>
            <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, marginTop: 1 }}>
              Ukupno XP: {xpTotal.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* ── Level-up banner ── */}
      {leveledUp && (
        <View style={{
          backgroundColor: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.4)",
          borderWidth: 1.5, borderRadius: T.rMd, padding: 16, alignItems: "center", gap: 4,
        }}>
          <Text style={{ fontSize: 32 }}>🎉</Text>
          <Text style={{ fontFamily: T.fontHead, color: "#8B5CF6", fontSize: 20 }}>Level {newLevel} dostigan!</Text>
          <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13 }}>Rang: {newRank}</Text>
        </View>
      )}

      {/* ── Explanation ── */}
      <View style={{ backgroundColor: T.panel, borderRadius: T.rMd, borderWidth: 1, borderColor: T.border, padding: 16 }}>
        <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Objašnjenje</Text>
        <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 15, lineHeight: 24 }}>{objasnjenje}</Text>
      </View>

      {/* ── Earned badges ── */}
      {earnedBadges.length > 0 && (
        <View style={{ backgroundColor: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.25)", borderWidth: 1, borderRadius: T.rMd, padding: 14, gap: 10 }}>
          <Text style={{ fontFamily: T.fontBodyXBold, color: "#8B5CF6", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Novi bedževi!</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {earnedBadges.map((b) => (
              <View key={b.name} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 20 }}>{b.icon}</Text>
                <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 14 }}>{b.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Buttons ── */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
        {!correct && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={{ flex: 1, backgroundColor: T.tealDeep, borderRadius: T.rMd, padding: 14, alignItems: "center", borderBottomWidth: 4, borderBottomColor: "#08634A" }}
          >
            <Text style={{ fontFamily: T.fontHead, color: "#fff", fontSize: 15 }}>Pokušaj ponovo ↩</Text>
          </TouchableOpacity>
        )}
        {(correct || !onRetry) && (
          <TouchableOpacity
            onPress={onContinue}
            style={{ flex: 1, backgroundColor: T.tealDeep, borderRadius: T.rMd, padding: 14, alignItems: "center", borderBottomWidth: 4, borderBottomColor: "#08634A" }}
          >
            <Text style={{ fontFamily: T.fontHead, color: "#fff", fontSize: 15 }}>
              {hasNext ? "Sljedeća misija →" : "Završi →"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
