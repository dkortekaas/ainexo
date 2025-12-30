import type { Config } from "tailwindcss";

const config: Config = {
  // In Tailwind v4, dark mode is configured via @custom-variant in CSS
  // This config is kept for compatibility but dark mode is handled in globals.css
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
