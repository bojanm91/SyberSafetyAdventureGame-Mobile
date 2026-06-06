/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./contexts/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#050816",
        panel: "#0b1324",
        panelSoft: "#101b33",
        cyan: "#37d6ff",
        cyanDeep: "#0fa8d7",
        violet: "#8b5cf6",
        green: "#13d18a",
        amber: "#f5b942",
        rose: "#ef5da8",
      },
    },
  },
  plugins: [],
};
