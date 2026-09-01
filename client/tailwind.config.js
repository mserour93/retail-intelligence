/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1E40AF", on: "#FFFFFF" },
        secondary: "#3B82F6",
        accent: "#D97706",
        surface: "#FFFFFF",
        background: "#F8FAFC",
        muted: "#E9EEF6",
        border: "#DBEAFE",
        destructive: "#DC2626",
        success: "#16A34A",
        foreground: "#1E293B",
      },
      fontFamily: {
        sans: ["Fira Sans", "system-ui", "sans-serif"],
        mono: ["Fira Code", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
