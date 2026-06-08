// Design tokens — Akademija Sajber Čuvara
// Matches the web prototype palette (styles.css / docs.jsx)

export const T = {
  // ── Backgrounds ───────────────────────────────────────────────────────────
  bg:         "#0F1830",   // scene-deep (darkest)
  scene1:     "#1E2E58",   // scene-1
  scene2:     "#15203D",   // scene-2
  panel:      "#1A2748",   // cards / panels
  panelDeep:  "#0C1220",

  // ── Primary (Bajt blue) ───────────────────────────────────────────────────
  primary:     "#3E9BE8",
  primaryInk:  "#1E5FA6",
  primaryDeep: "#154B86",
  primarySoft: "rgba(62,155,232,0.16)",

  // ── Teal (main CTA accent) ────────────────────────────────────────────────
  teal:     "#18A582",
  tealDeep: "#0E7E60",
  mint:     "#5DCAA5",

  // ── Warm accents ──────────────────────────────────────────────────────────
  sun:   "#FAC775",
  coral: "#F0997B",

  // ── HUD (on dark scenes) ──────────────────────────────────────────────────
  hudBg:     "rgba(13,22,44,0.65)",
  hudStroke: "rgba(150,190,240,0.20)",
  hudInk:    "#EAF1FB",
  hudMuted:  "#9DB2D4",

  // ── Paper / dialog (light surfaces) ──────────────────────────────────────
  paper:     "#F7F4EC",
  paperLine: "#E7E1D2",
  ink:       "#262522",
  inkSoft:   "#6E6A60",
  inkFaint:  "#A8A395",

  // ── Feedback ──────────────────────────────────────────────────────────────
  good:    "#169466",
  goodSoft:"#DBF1E6",
  goodInk: "#0C5E41",
  bad:     "#D9654C",
  badSoft: "#F8E3DC",
  badInk:  "#9A3B27",

  // ── Borders ───────────────────────────────────────────────────────────────
  border:       "rgba(150,190,240,0.18)",
  borderStrong: "rgba(150,190,240,0.35)",

  // ── Typography ────────────────────────────────────────────────────────────
  fontHead:     "Fredoka-SemiBold",
  fontBody:     "Nunito-Bold",
  fontBodyXBold:"Nunito-ExtraBold",

  // ── Radii ─────────────────────────────────────────────────────────────────
  rSm:  10,
  rMd:  18,
  rLg:  26,
  rPill:999,

  // ── Shadows (RN elevation approximation) ─────────────────────────────────
  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export type ThemeColor = keyof typeof T;
