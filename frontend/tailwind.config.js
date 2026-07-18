/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#241C29",
        plum: {
          50: "#F7F1F7",
          100: "#EFE2EF",
          300: "#D3A9D1",
          500: "#9C5C98",
          700: "#6B3F69",
          900: "#3E2440",
        },
        moon: "#F2EDE4",
        blush: "#E7A8B4",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
