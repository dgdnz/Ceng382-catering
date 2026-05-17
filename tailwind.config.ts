import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pink Dessert / Pastry Shop Theme Colors
        primary: "#ffb6c1",    // Light pink
        secondary: "#ff69b4",  // Hot pink
        accent: "#ff1493",     // Deep pink
        background: "#fff0f5", // Lavender blush (very light pinkish background)
        textDark: "#4a0e2e",   // Dark purple/pink for text
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
