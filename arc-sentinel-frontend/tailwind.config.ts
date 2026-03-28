import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1220",
        panel: "#111827",
        primary: "#0EA5E9",
        secondary: "#FDE047",
        "hazard-red": "#EF4444",
        obsidian: "#020408",
        "surface-variant": "#21262f",
        "on-surface": "#f1f3fc",
      },
    },
  },
  plugins: [],
};

export default config;
