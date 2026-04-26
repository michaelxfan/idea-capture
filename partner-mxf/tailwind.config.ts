import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F8F7F4",
        surface: "#FFFFFF",
        "surface-subtle": "#F2F1EE",
        border: "#E5E4E0",
        "border-subtle": "#EEECEA",
        ink: {
          DEFAULT: "#1A1917",
          muted: "#6A6965",
          subtle: "#9A9893",
        },
        solid: {
          DEFAULT: "#3A6348",
          bg: "#EEF3F0",
          border: "#C5D9CC",
        },
        "light-drift": {
          DEFAULT: "#7A6540",
          bg: "#F5EFE4",
          border: "#D9C9A8",
        },
        noticeable: {
          DEFAULT: "#A85A2F",
          bg: "#F7EDE6",
          border: "#D9B49A",
        },
        friction: {
          DEFAULT: "#922B2B",
          bg: "#F5E8E8",
          border: "#D9AAAA",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(26,25,23,0.06), 0 1px 2px rgba(26,25,23,0.04)",
        "card-md": "0 4px 12px rgba(26,25,23,0.08), 0 1px 3px rgba(26,25,23,0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
