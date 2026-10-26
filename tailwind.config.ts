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
        stage: {
          950: "#090b10",
          900: "#111520",
          800: "#1a2032",
          700: "#252e46",
        },
        amber: {
          450: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
