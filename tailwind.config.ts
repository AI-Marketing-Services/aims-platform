import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // AI Operator Collective palette — the (landing) pages already
        // reference these via hex; the aliases below mean the same values
        // now back every `bg-ink` / `text-cream` / `bg-surface` use in
        // the portal/admin/intern/reseller trees so the whole product
        // matches the landing aesthetic. Old "aims gold" aliases point
        // at crimson so any legacy classname keeps rendering a brand
        // colour rather than a raw yellow.
        crimson: {
          DEFAULT: "#981B1B",
          dark: "#791515",
          light: "#C42424",
        },
        aims: {
          gold: "#981B1B",
          "gold-dark": "#791515",
          "gold-light": "#C42424",
        },
        ink: "#1A1A1A",
        deep: "#FFFFFF",
        surface: "#FFFFFF",
        panel: "#F5F5F5",
        cream: "#F5F5F5",
        "gold-dim": "#981B1B",
        line: "rgba(0,0,0,0.08)",
        "line-hover": "rgba(0,0,0,0.14)",
        "dark-deep": "#FFFFFF",
        "dark-surface": "#F5F5F5",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Fallbacks are picked to match Playfair / DM Sans metrics so text
        // renders without visible layout shift while the web font loads.
        sans: ["var(--font-dm-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["var(--font-playfair)", "Georgia", "Cambria", "Times New Roman", "serif"],
        playfair: ["var(--font-playfair)", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(32px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config

export default config
