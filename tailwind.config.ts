import type { Config } from "tailwindcss";

/**
 * NaijaResolve AI — Tailwind Configuration (Instagram Theme)
 * Maps our semantic tokens (`navy`, `emerald`, `warm`, `line`, `muted`, etc.)
 * to an Instagram-inspired palette:
 * - Dark surfaces (`navy`): Instagram dark obsidian (#121212 / #1C1C1E / #262626)
 * - Primary brand (`emerald`): Instagram vibrant magenta-pink (#E1306C) + gradient accents (#F77737, #833AB4)
 * - Light surfaces (`warm`, `line`): Crisp Instagram light mode (#FAFAFA, #DBDBDB)
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Instagram Dark Mode surfaces (mapped to `navy` token family)
        navy: {
          DEFAULT: "#121212", // Instagram primary dark background / dark text on light
          800: "#1C1C1E",     // Elevated dark card / prompt box
          700: "#262626",     // Active nav item / hover state
          line: "#363636",    // Hairline borders on dark
        },
        // Instagram Brand Magenta / Rose / Sunset (mapped to `emerald` token family)
        emerald: {
          DEFAULT: "#E1306C", // Instagram signature magenta-pink
          300: "#FF6B9D",     // Soft pink accent on dark
          700: "#C13584",     // Deep Instagram purple-pink on light
          50: "#FCE7F0",      // Soft pink pill / icon background
          soft: "#FDF2F7",
        },
        // Instagram gradient stops for badges, logos, and buttons
        ig: {
          purple: "#833AB4",
          pink: "#E1306C",
          orange: "#F77737",
          yellow: "#FCAF45",
        },
        "ink-on-emerald": "#FFFFFF", // Crisp white text on Instagram pink/gradient buttons
        warm: "#FAFAFA",             // Classic Instagram light background
        line: "#DBDBDB",             // Classic Instagram 1px border
        muted: {
          DEFAULT: "#737373",        // Instagram secondary gray text
          2: "#8E8E8E",              // Disclaimers / timestamps
          dark: "#A8A8A8",           // Secondary text on dark
        },
        amber: {
          bg: "#FEF3C7",
          text: "#B45309",
        },
        slate: {
          bg: "#EFEFEF",
          text: "#262626",
        },
        // shadcn/ui HSL variable bindings
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      backgroundImage: {
        "ig-gradient":
          "linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)",
        "ig-gradient-hover":
          "linear-gradient(135deg, #722FA0 0%, #C9235B 50%, #E56728 100%)",
      },
      borderRadius: {
        btn: "12px",
        input: "14px",
        composer: "18px",
        card: "20px",
        hero: "24px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        hero: "0 30px 80px rgba(225, 48, 108, 0.22)",
      },
      maxWidth: {
        landing: "1024px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
