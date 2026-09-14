export interface StoreBrandingData {
  logoMode: "icon" | "image";
  logoImageUrl?: string;
  logoIcon: string;
  logoBgGradient: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  updatedAt?: string;
}

export const DEFAULT_BRANDING_DATA: StoreBrandingData = {
  logoMode: "icon",
  logoImageUrl: "",
  logoIcon: "Sparkles",
  logoBgGradient: "from-[#FF6B35] to-[#1F3A5F]",
  titlePrefix: "OMNI",
  titleHighlight: "COLLECTOR",
  subtitle: "Chile • Nicho Coleccionista",
};

export const LOGO_ICON_OPTIONS = [
  { id: "Sparkles", label: "Brillo / Sparkles" },
  { id: "Flame", label: "Fuego / Colección Hot" },
  { id: "Shield", label: "Escudo / Protección Mint" },
  { id: "Trophy", label: "Trofeo / Piezas Únicas" },
  { id: "Gamepad2", label: "Mando / Gamer" },
  { id: "Crown", label: "Corona / Edición Royal" },
  { id: "Zap", label: "Rayo / Express" },
  { id: "Star", label: "Estrella / Premium" },
];

export const LOGO_GRADIENT_OPTIONS = [
  { id: "from-[#FF6B35] to-[#1F3A5F]", label: "Naranja & Azul Omni (Oficial)", preview: "bg-gradient-to-br from-[#FF6B35] to-[#1F3A5F]" },
  { id: "from-[#FF6B35] to-[#E85D2A]", label: "Naranja Coleccionista", preview: "bg-gradient-to-br from-[#FF6B35] to-[#E85D2A]" },
  { id: "from-[#1F3A5F] to-[#0D1F36]", label: "Azul Nocturno Profundo", preview: "bg-gradient-to-br from-[#1F3A5F] to-[#0D1F36]" },
  { id: "from-amber-500 to-amber-700", label: "Dorado PSA Gem Mint", preview: "bg-gradient-to-br from-amber-500 to-amber-700" },
  { id: "from-purple-600 to-[#1F3A5F]", label: "Púrpura Místico / Anime", preview: "bg-gradient-to-br from-purple-600 to-[#1F3A5F]" },
  { id: "from-emerald-500 to-teal-700", label: "Verde Esmeralda", preview: "bg-gradient-to-br from-emerald-500 to-teal-700" },
];
