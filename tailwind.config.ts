import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette from user image (Modern neutral with warm accent)
        brand: {
          base: "#F7F7F5",       // Fondo cálido (no blanco puro)
          white: "#FFFFFF",      // Fondo blanco puro
          text: "#1A1A1A",       // Texto principal casi negro
          textMuted: "#666666",  // Texto secundario
          navy: "#1F3A5F",       // Marca / secundario (azul marino profundo)
          navyDark: "#152842",   // Azul marino oscuro
          navyLight: "#2D5180",  // Azul marino suave
          orange: "#FF6B35",     // Acento CTA (naranja cálido)
          orangeHover: "#E85A24",// Naranja hover
          border: "#E5E5E5",     // Gris de soporte (bordes y separadores)
          success: "#2E9E5B",    // Éxito
          error: "#D64545",      // Error
          warning: "#E8A93B",    // Advertencia
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "#FF6B35",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1F3A5F",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F7F7F5",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "#FF6B35",
          foreground: "#FFFFFF",
        },
        border: "#E5E5E5",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
