/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds (dark, cool — matching prototype)
        bg:        "#0F1830",
        scene1:    "#1E2E58",
        scene2:    "#15203D",
        panel:     "#1A2748",
        // Primary (Bajt blue)
        primary:    "#3E9BE8",
        primaryInk: "#1E5FA6",
        // Teal (main CTA)
        teal:     "#18A582",
        tealDeep: "#0E7E60",
        mint:     "#5DCAA5",
        // Warm accents
        sun:   "#FAC775",
        coral: "#F0997B",
        // HUD text
        ink:     "#EAF1FB",
        inkMuted:"#9DB2D4",
        // Paper / dialog
        paper:    "#F7F4EC",
        paperLine:"#E7E1D2",
        // Feedback
        good: "#169466",
        bad:  "#D9654C",
        // Aliases kept for backward compat (game interaction screens)
        cyan:       "#3E9BE8",
        cyanDeep:   "#1E5FA6",
        success:    "#169466",
        danger:     "#D9654C",
        warning:    "#FAC775",
        textPrimary:"#EAF1FB",
        textMuted:  "#9DB2D4",
        border:     "rgba(150,190,240,0.18)",
        violet:     "#8B5CF6",
        violet2:    "#6D28D9",
        amber:      "#FAC775",
        rose:       "#D9654C",
      },
      fontFamily: {
        head: ["Fredoka-SemiBold"],
        body: ["Nunito-Bold"],
        xbold:["Nunito-ExtraBold"],
      },
    },
  },
  plugins: [],
};
