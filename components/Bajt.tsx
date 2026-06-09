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

export type BajtEmotion = "happy" | "neutral" | "wink" | "alarm" | "determined" | "proud";

interface Props {
  emotion?: BajtEmotion;
  emo?: BajtEmotion;
  size?: number;
}

function Eyes({ emotion }: { emotion: BajtEmotion }) {
  if (emotion === "wink") {
    return (
      <G>
        <Path d="M34 55 Q41 49 48 55" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M66 54 H82" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" />
        <Path d="M45 70 Q58 78 72 70" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
      </G>
    );
  }

  if (emotion === "alarm") {
    return (
      <G>
        <Circle cx="42" cy="55" r="9" fill="#F7FEFF" />
        <Circle cx="75" cy="55" r="9" fill="#F7FEFF" />
        <Circle cx="42" cy="55" r="4" fill="#101827" />
        <Circle cx="75" cy="55" r="4" fill="#101827" />
        <Path d="M57 75 H62" stroke="#FB7185" strokeWidth="5" strokeLinecap="round" />
      </G>
    );
  }

  if (emotion === "determined") {
    return (
      <G>
        <Path d="M32 52 L49 56" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" />
        <Path d="M84 52 L67 56" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" />
        <Path d="M46 72 Q58 66 72 72" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
      </G>
    );
  }

  if (emotion === "proud") {
    return (
      <G>
        <Path d="M35 55 Q42 48 49 55" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M68 55 Q75 48 82 55" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M47 70 Q58 78 70 70" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" fill="none" />
      </G>
    );
  }

  if (emotion === "happy") {
    return (
      <G>
        <Path d="M35 56 Q42 47 49 56" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M68 56 Q75 47 82 56" stroke="#F7FEFF" strokeWidth="5" strokeLinecap="round" fill="none" />
        <Path d="M47 69 Q58 77 70 69" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
        <Ellipse cx="31" cy="67" rx="6" ry="3" fill="#FCA5A5" opacity="0.45" />
        <Ellipse cx="86" cy="67" rx="6" ry="3" fill="#FCA5A5" opacity="0.45" />
      </G>
    );
  }

  return (
    <G>
      <Circle cx="42" cy="55" r="6.5" fill="#F7FEFF" />
      <Circle cx="75" cy="55" r="6.5" fill="#F7FEFF" />
      <Path d="M49 72 H68" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </G>
  );
}

export default function Bajt({ emotion, emo, size = 120 }: Props) {
  const mood = emotion ?? emo ?? "happy";
  const lamp = mood === "alarm" ? "#FB7185" : mood === "proud" ? "#FACC15" : "#5EEAD4";

  return (
    <Svg width={size} height={size} viewBox="0 0 120 132">
      <Defs>
        <LinearGradient id="bajtHead" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6DD5F7" />
          <Stop offset="58%" stopColor="#2F86B7" />
          <Stop offset="100%" stopColor="#1E5F86" />
        </LinearGradient>
        <LinearGradient id="bajtBody" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#3BA4D8" />
          <Stop offset="100%" stopColor="#255C7C" />
        </LinearGradient>
        <LinearGradient id="bajtVisor" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#17243A" />
          <Stop offset="100%" stopColor="#07111F" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="60" cy="124" rx="30" ry="6" fill="#000" opacity="0.2" />

      <G>
        <Path d="M60 16 V30" stroke="#30769A" strokeWidth="5" strokeLinecap="round" />
        <Circle cx="60" cy="11" r="8" fill={lamp} />
        <Circle cx="60" cy="11" r="13" fill={lamp} opacity="0.15" />

        <Rect x="11" y="45" width="14" height="30" rx="6" fill="#F6B94B" />
        <Rect x="95" y="45" width="14" height="30" rx="6" fill="#F6B94B" />

        <Rect x="20" y="26" width="80" height="72" rx="31" fill="url(#bajtHead)" />
        <Path d="M31 35 C43 25 77 25 89 35" stroke="#B6F3FF" strokeWidth="4" strokeLinecap="round" opacity="0.32" />
        <Rect x="31" y="43" width="58" height="42" rx="18" fill="url(#bajtVisor)" />
        <Path d="M37 47 H81" stroke="#B6F3FF" strokeWidth="2" strokeLinecap="round" opacity="0.18" />
        <Eyes emotion={mood} />

        <Rect x="38" y="90" width="44" height="29" rx="12" fill="url(#bajtBody)" />
        <Rect x="49" y="98" width="22" height="12" rx="5" fill="#101827" opacity="0.9" />
        <Circle cx="60" cy="104" r="3.5" fill={lamp} />
        <Path d="M36 103 C25 101 22 93 20 85" stroke="#F6B94B" strokeWidth="6" strokeLinecap="round" fill="none" />
        <Path d="M84 103 C95 101 98 93 100 85" stroke="#F6B94B" strokeWidth="6" strokeLinecap="round" fill="none" />
        <Path d="M48 119 H39" stroke="#2A6D91" strokeWidth="7" strokeLinecap="round" />
        <Path d="M72 119 H81" stroke="#2A6D91" strokeWidth="7" strokeLinecap="round" />
      </G>
    </Svg>
  );
}
