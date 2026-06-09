import { Image, type ImageSourcePropType, View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import GuardianAvatar from "./GuardianAvatar";

interface Props {
  level: number;
  xpPercent: number; // 0-100
  size?: number;
  strokeWidth?: number;
  avatarEmoji?: string;
  avatarImage?: ImageSourcePropType;
  avatarBase?: string | null;
  avatarColor?: string | null;
  avatarGear?: string | null;
}

export default function LevelRing({
  level,
  xpPercent,
  size = 100,
  strokeWidth = 7,
  avatarEmoji = "🛡️",
  avatarImage,
  avatarBase,
  avatarColor,
  avatarGear,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(1, Math.max(0, xpPercent / 100));
  const offset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id="ring_grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#22D3EE" />
            <Stop offset="100%" stopColor="#8B5CF6" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring_grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Center content */}
      <View style={{ alignItems: "center" }}>
        {avatarBase ? (
          <View style={{ marginBottom: -size * 0.06 }}>
            <GuardianAvatar base={avatarBase} color={avatarColor} gear={avatarGear} size={size * 0.66} />
          </View>
        ) : avatarImage ? (
          <Image
            source={avatarImage}
            style={{
              width: size * 0.52,
              height: size * 0.58,
              resizeMode: "contain",
              marginBottom: -size * 0.04,
            }}
          />
        ) : (
          <Text style={{ fontSize: size * 0.3 }}>{avatarEmoji}</Text>
        )}
        <Text style={{ color: "#22D3EE", fontWeight: "800", fontSize: size * 0.16, lineHeight: size * 0.2 }}>
          L{level}
        </Text>
      </View>
    </View>
  );
}
