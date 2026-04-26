import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f5f1ea",
        ink: "#111111",
        muted: "#6b6b6b",
        line: "#e5e1d8",
      },
      fontFamily: {
        serif: ['"EB Garamond"', "Cormorant Garamond", "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
