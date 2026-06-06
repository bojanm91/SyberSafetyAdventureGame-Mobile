import { View, Text } from "react-native";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";

interface Props {
  data: { label: string; value: number; icon?: string }[]; // value 0-100
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export default function RadarChart({ data, size = 220 }: Props) {
  if (!data.length) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.35;
  const n = data.length;
  const rings = [0.25, 0.5, 0.75, 1];

  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * maxR;
    return polarToCartesian(cx, cy, r, i, n);
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const labelPadding = 24;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {/* Ring grid */}
        {rings.map((ring) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const pt = polarToCartesian(cx, cy, maxR * ring, i, n);
            return `${pt.x},${pt.y}`;
          }).join(" ");
          return (
            <Polygon
              key={ring}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          );
        })}

        {/* Spokes */}
        {Array.from({ length: n }, (_, i) => {
          const outer = polarToCartesian(cx, cy, maxR, i, n);
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          );
        })}

        {/* Filled polygon */}
        <Polygon
          points={dataPolygon}
          fill="rgba(34,211,238,0.12)"
          stroke="#22D3EE"
          strokeWidth={1.5}
        />

        {/* Data dots */}
        {dataPoints.map((pt, i) => (
          <Circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill="#22D3EE" />
        ))}

        {/* Labels */}
        {data.map((d, i) => {
          const labelPt = polarToCartesian(cx, cy, maxR + labelPadding, i, n);
          const anchor =
            labelPt.x < cx - 5 ? "end" : labelPt.x > cx + 5 ? "start" : "middle";
          return (
            <SvgText
              key={i}
              x={labelPt.x}
              y={labelPt.y + 4}
              fill="#8A97AD"
              fontSize={9.5}
              textAnchor={anchor}
            >
              {d.icon ? `${d.icon} ` : ""}{d.label} {d.value}%
            </SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", paddingHorizontal: 8 }}>
        {data.map((d) => (
          <View key={d.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.value >= 70 ? "#34D399" : d.value >= 40 ? "#FBBF24" : "#F87171" }} />
            <Text style={{ color: "#8A97AD", fontSize: 11 }}>{d.icon} {d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
