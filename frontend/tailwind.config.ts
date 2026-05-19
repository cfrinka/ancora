import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Âncora design system
        canvas: "#F9F6F0",          // off-white / sand — page background
        ink: "#1A1A1A",             // dark graphite — primary text
        olive: {
          DEFAULT: "#3B473C",       // closed olive green — primary accent
          hover:   "#2E3830",       // darker on hover
          muted:   "#5A6B5B",       // lighter olive for subtle use
          light:   "#EBF0EB",       // very light tint — chip/tag background
          border:  "#C4CFBF",       // olive-tinted border
        },
        warm: {
          50:  "#F9F6F0",
          100: "#F2EDE4",
          200: "#E8E0D5",
          300: "#D6CBBF",
          400: "#B8AC9F",
          500: "#9A8E82",
          600: "#7A6F64",
          700: "#5E554B",
          800: "#3D3630",
          900: "#1A1A1A",
        },
      },
      borderRadius: {
        card: "0.625rem",  // 10px — signature card radius
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(26,26,26,0.06)",
        "card-hover": "0 4px 16px 0 rgba(26,26,26,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
