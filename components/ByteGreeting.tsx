/**
 * ByteGreeting — pojavljuje se pri prijavi: Bajt iskoči i da zanimljivu
 * činjenicu/savjet o sajber bezbjednosti (LLM preko backenda + fallback).
 */
import { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, Easing, Image, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiGetByteFact } from "../lib/api";
import { T } from "../lib/theme";

let BAJT_IMG: number | null = null;
try { BAJT_IMG = require("../assets/bajt_robot.png"); } catch { BAJT_IMG = null; }

export default function ByteGreeting({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const float = useRef(new Animated.Value(0)).current;

  const [fact, setFact]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setFact(null);

    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();

    let alive = true;
    apiGetByteFact()
      .then((r) => { if (alive) setFact(r.fact); })
      .catch(() => { if (alive) setFact("Mali savjet: uključi dvofaktorsku autentifikaciju gdje god možeš — to zaustavlja većinu napada na naloge."); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [visible]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 40, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  }

  if (!visible) return null;

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <Animated.View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(4,8,18,0.82)",
        alignItems: "center", justifyContent: "center",
        paddingHorizontal: 22, paddingBottom: insets.bottom, zIndex: 50,
        opacity: fade,
      }}
    >
      <TouchableOpacity
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        activeOpacity={1}
        onPress={dismiss}
      />

      <Animated.View style={{ width: "100%", maxWidth: 420, transform: [{ translateY: slide }] }}>
        {/* Bajt */}
        <Animated.View style={{ alignItems: "center", marginBottom: -22, zIndex: 2, transform: [{ translateY: floatY }] }}>
          {BAJT_IMG ? (
            <Image source={BAJT_IMG} style={{ width: 132, height: 132, resizeMode: "contain" }} />
          ) : (
            <Text style={{ fontSize: 84 }}>🤖</Text>
          )}
        </Animated.View>

        {/* Govorni oblačić */}
        <View style={{
          backgroundColor: T.panel,
          borderColor: "rgba(93,202,165,0.4)", borderWidth: 1.5,
          borderRadius: T.rLg, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 18,
          ...T.shadowCard,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Text style={{ fontFamily: T.fontHead, color: T.mint, fontSize: 15 }}>Bajt</Text>
            <View style={{ backgroundColor: "rgba(93,202,165,0.15)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 }}>
              <Text style={{ fontFamily: T.fontBody, color: T.mint, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                Znaš li?
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
              <ActivityIndicator color={T.teal} />
              <Text style={{ fontFamily: T.fontBody, color: T.hudMuted, fontSize: 13 }}>Bajt razmišlja…</Text>
            </View>
          ) : (
            <Text style={{ fontFamily: T.fontBody, color: T.hudInk, fontSize: 15, lineHeight: 23 }}>
              {fact}
            </Text>
          )}

          <TouchableOpacity
            onPress={dismiss}
            activeOpacity={0.8}
            style={{
              marginTop: 16, alignSelf: "flex-end",
              backgroundColor: T.teal, borderRadius: T.rPill,
              paddingHorizontal: 20, paddingVertical: 10,
            }}
          >
            <Text style={{ fontFamily: T.fontBodyXBold, color: "#04121A", fontSize: 14 }}>
              Hvala, Bajt!
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
