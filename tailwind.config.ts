import type { Config } from "tailwindcss";

/**
 * Tailwind v4 : le thème principal est aussi dans `src/app/globals.css` (`@theme inline`).
 * Les utilitaires `blur-*` / `backdrop-blur-*` utilisent les variables `--blur-*` définies là-bas.
 * Ce fichier reprend l’extension `backdropBlur` pour référence et outillage.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary, #E50914)",
        "primary-foreground": "var(--primary-foreground, #ffffff)",
        edge: {
          red: "#FF3B30",
          black: "#0a0a0a",
          dark: "#111110",
          darker: "#141412",
          grey: "#f5f5f3",
          photo: "#1a1816",
          "photo-light": "#e8e4de",
        },
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "20px",
        "2xl": "40px",
      },
    },
  },
  plugins: [],
};

export default config;
