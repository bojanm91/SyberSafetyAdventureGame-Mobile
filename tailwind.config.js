/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./contexts/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Legacy
        bg: "#0B0F1A",
        panel: "#141A2A",
        panelSoft: "#1C2436",
        // Primary
        cyan: "#22D3EE",
        cyanDeep: "#0E7490",
        // Status
        success: "#34D399",
        danger: "#F87171",
        warning: "#FBBF24",
        // Text
        textPrimary: "#E5ECF5",
        textMuted: "#8A97AD",
        border: "#26304A",
        // Accent
        violet: "#8B5CF6",
        violet2: "#6D28D9",
        green: "#34D399",
        amber: "#FBBF24",
        rose: "#F87171",
        pink: "#EC4899",
        blue: "#3B82F6",
        teal: "#14B8A6",
        orange: "#F97316",
        indigo: "#6366F1",
        fuchsia: "#D946EF",
      },
    },
  },
  plugins: [],
};
