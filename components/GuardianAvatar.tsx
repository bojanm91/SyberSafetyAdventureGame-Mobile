import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

export type AvatarBase = "A" | "B" | "C" | "D";

interface Props {
  base?: string | null;
  color?: string | null;
  gear?: string | null;
  size?: number;
}

function keyOf(base?: string | null): AvatarBase {
  const key = (base ?? "A").replace("cuvar_", "").toUpperCase();
  return key === "B" || key === "C" || key === "D" ? key : "A";
}

function GearMark({ gear, color }: { gear?: string | null; color: string }) {
  if (gear === "tragac") {
    return (
      <G transform="translate(80 84)">
        <Circle cx="0" cy="0" r="7" fill="none" stroke="#F8FAFC" strokeWidth="2.5" />
        <Path d="M5 5 L12 12" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="0" cy="0" r="3" fill={color} opacity="0.75" />
      </G>
    );
  }
  if (gear === "tehnicar") {
    return (
      <G transform="translate(81 84)">
        <Circle cx="0" cy="0" r="8" fill="#F8FAFC" opacity="0.95" />
        <Circle cx="0" cy="0" r="3" fill={color} />
        <Path d="M0 -12 V-8 M0 8 V12 M-12 0 H-8 M8 0 H12 M-8 -8 L-5 -5 M8 -8 L5 -5 M-8 8 L-5 5 M8 8 L5 5" stroke="#F8FAFC" strokeWidth="2.4" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <Path
      d="M78 76 L91 81 V91 C91 99 86 104 78 107 C70 104 65 99 65 91 V81 Z"
      fill="#F8FAFC"
      opacity="0.95"
      stroke={color}
      strokeWidth="2"
    />
  );
}

function Hair({ base }: { base: AvatarBase }) {
  if (base === "B") {
    return (
      <G>
        <Path d="M33 43 C31 21 49 12 64 16 C84 21 89 40 82 61 C75 53 53 55 37 62 C35 55 34 49 33 43Z" fill="#30223C" />
        <Path d="M66 16 C80 22 81 43 74 56 C83 55 90 51 92 45 C91 29 82 18 66 16Z" fill="#412C55" />
      </G>
    );
  }
  if (base === "C") {
    return (
      <G fill="#2D2A35">
        <Circle cx="42" cy="31" r="10" />
        <Circle cx="53" cy="24" r="11" />
        <Circle cx="66" cy="24" r="10" />
        <Circle cx="77" cy="31" r="9" />
        <Path d="M35 42 C35 26 83 25 84 43 C74 35 49 35 35 42Z" />
      </G>
    );
  }
  if (base === "D") {
    return (
      <G>
        <Path d="M34 44 C34 25 49 15 64 17 C79 19 88 31 86 48 C76 39 50 39 34 49Z" fill="#163A4C" />
        <Path d="M82 40 C101 46 99 69 86 76 C88 63 83 54 75 50Z" fill="#163A4C" />
        <Circle cx="93" cy="61" r="12" fill="#1E5269" />
      </G>
    );
  }
  return (
    <G>
      <Path d="M35 39 C37 23 51 15 66 18 C78 21 84 29 84 42 C72 35 50 35 35 44Z" fill="#263140" />
      <Path d="M39 35 C47 26 66 23 80 31" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    </G>
  );
}

function Face({ base }: { base: AvatarBase }) {
  const skin = base === "C" ? "#9A654A" : base === "D" ? "#A96E4F" : base === "B" ? "#C58A62" : "#B87957";
  return (
    <G>
      <Ellipse cx="60" cy="49" rx="26" ry="29" fill={skin} />
      <Path d="M47 52 Q51 49 55 52" stroke="#101827" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Path d="M66 52 Q70 49 74 52" stroke="#101827" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Path d="M54 64 Q60 69 67 64" stroke="#7F3F35" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.75" />
      <Ellipse cx="43" cy="60" rx="4" ry="2.5" fill="#F8A8A8" opacity="0.42" />
      <Ellipse cx="77" cy="60" rx="4" ry="2.5" fill="#F8A8A8" opacity="0.42" />
    </G>
  );
}

function Suit({ base, color, gear }: { base: AvatarBase; color: string; gear?: string | null }) {
  const slim = base === "B" || base === "D";
  const shoulder = slim ? "M32 90 C37 80 45 75 60 75 C75 75 83 80 88 90" : "M28 91 C36 79 46 75 60 75 C74 75 84 79 92 91";
  return (
    <G>
      <Path d={shoulder} fill="#111827" />
      <Path d={slim ? "M39 84 H81 L87 122 H33Z" : "M36 84 H84 L91 122 H29Z"} fill="#182235" />
      <Path d={slim ? "M46 82 H74 L79 122 H41Z" : "M43 82 H77 L83 122 H37Z"} fill={color} />
      <Path d="M53 80 L60 94 L67 80" fill="#E5F8FF" opacity="0.9" />
      <Path d="M43 96 H77" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <Path d="M47 108 H73" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
      <Path d="M29 94 C20 101 17 112 16 122" stroke="#182235" strokeWidth="13" strokeLinecap="round" />
      <Path d="M91 94 C100 101 103 112 104 122" stroke="#182235" strokeWidth="13" strokeLinecap="round" />
      <Path d="M31 99 C25 105 24 114 24 122" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <Path d="M89 99 C95 105 96 114 96 122" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <GearMark gear={gear} color={color} />
    </G>
  );
}

export default function GuardianAvatar({ base, color, gear, size = 110 }: Props) {
  const key = keyOf(base);
  const accent = color ?? "#3E9BE8";

  return (
    <Svg width={size} height={size} viewBox="0 0 120 132">
      <Defs>
        <LinearGradient id="avatarGlow" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={accent} stopOpacity="0.34" />
          <Stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="60" cy="125" rx="35" ry="6" fill="#000" opacity="0.22" />
      <Circle cx="60" cy="68" r="54" fill="url(#avatarGlow)" />
      <Suit base={key} color={accent} gear={gear} />
      <Face base={key} />
      <Hair base={key} />
      <Rect x="36" y="70" width="48" height="10" rx="5" fill="#111827" opacity="0.9" />
      <Rect x="41" y="72" width="38" height="4" rx="2" fill={accent} opacity="0.78" />
      <Path d="M37 47 C45 38 74 37 83 47" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" opacity="0.12" />
    </Svg>
  );
}
