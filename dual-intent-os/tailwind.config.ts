import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Inter', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: "#f7f7f6",
          100: "#ededeb",
          200: "#d9d8d3",
          300: "#b9b7ae",
          400: "#8f8c80",
          500: "#6b6859",
          600: "#504e42",
          700: "#3d3b32",
          800: "#272620",
          900: "#17160f",
        },
        paper: "#fbfaf7",
        accent: "#6b6859",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,20,15,0.04), 0 4px 16px rgba(20,20,15,0.04)",
        lift: "0 2px 4px rgba(20,20,15,0.05), 0 12px 32px rgba(20,20,15,0.06)",
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
    },
  },
  plugins: [],
};
export default config;
