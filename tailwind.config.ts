import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CARETRACE Design System Palette
        primary: {
          DEFAULT: "#123C43", // Primary deep teal
          hover: "#0E3036",
          active: "#092125",
          light: "#1B545D",
          50: "#EFF7F6",
          100: "#D6EBE8",
          200: "#B0D8D2",
          300: "#80BCB3",
          400: "#4D9A8F",
          500: "#2B7E73",
          600: "#1B5D55",
          700: "#123C43",
          800: "#0D2C31",
          900: "#081C1F",
        },
        secondary: {
          DEFAULT: "#247C78", // Secondary teal
          hover: "#1D6461",
          active: "#164E4C",
          light: "#319590",
        },
        mint: {
          DEFAULT: "#E8F4EF", // Soft mint
          hover: "#DCEDE5",
          border: "#CBE4D9",
          50: "#F5FBF8",
          100: "#E8F4EF",
          200: "#D1EBE0",
        },
        canvas: {
          background: "#F7F8F5", // Warm background
          surface: "#FFFFFF", // White surface
          subtle: "#F0F3F1",
        },
        main: "#172B2B", // Main text
        secondaryText: "#627270", // Secondary text
        mutedText: "#859593",
        subtleBorder: "#E2E9E5", // Subtle border
        strongBorder: "#CCD6D1",
        
        // Semantic Clinical Feedback
        clinical: {
          success: "#237A57",
          successBg: "#EAF5F0",
          successBorder: "#BFE4D3",
          warning: "#B7791F",
          warningBg: "#FEF7ED",
          warningBorder: "#F6D9A9",
          danger: "#B54747",
          dangerBg: "#FDF2F2",
          dangerBorder: "#F4C5C5",
          info: "#3478A5",
          infoBg: "#EFF6FA",
          infoBorder: "#C1DEF0",
        },
        
        // Legacy compatibility aliases for existing templates
        navy: {
          800: "#123C43",
          900: "#0D2C31",
          950: "#081C1F",
        },
        teal: {
          500: "#247C78",
          600: "#1D6461",
          700: "#123C43",
        },
      },
      fontSize: {
        "elder-base": ["1.125rem", { lineHeight: "1.75rem" }],
        "elder-lg": ["1.25rem", { lineHeight: "1.875rem" }],
        "elder-xl": ["1.5rem", { lineHeight: "2rem" }],
        "elder-2xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "elder-3xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      borderRadius: {
        "card": "0.875rem", // 14px
        "elder": "1rem",
        "elder-lg": "1.25rem",
      },
      boxShadow: {
        "subtle": "0 1px 3px 0 rgba(18, 60, 67, 0.05), 0 1px 2px -1px rgba(18, 60, 67, 0.03)",
        "card": "0 1px 3px 0 rgba(18, 60, 67, 0.06), 0 1px 2px -1px rgba(18, 60, 67, 0.04)",
        "elevated": "0 4px 6px -1px rgba(18, 60, 67, 0.07), 0 2px 4px -2px rgba(18, 60, 67, 0.05)",
        "modal": "0 20px 25px -5px rgba(18, 60, 67, 0.12), 0 8px 10px -6px rgba(18, 60, 67, 0.06)",
        "elder": "0 4px 6px -1px rgba(18, 60, 67, 0.07), 0 2px 4px -2px rgba(18, 60, 67, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
