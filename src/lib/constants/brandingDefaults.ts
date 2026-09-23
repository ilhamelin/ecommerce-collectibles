export interface StoreBrandingData {
  logoMode: "icon" | "image";
  logoImageUrl?: string;
  logoIcon: string;
  customSvgIcon?: string;
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
  customSvgIcon: "",
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
  { id: "AI_GENERATED", label: "Generado con IA ✨", isAi: true },
];

export interface AiIconPreset {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export const AI_ICON_PRESETS: AiIconPreset[] = [
  {
    id: "mando_retro",
    title: "Mando Gamer Cyberpunk",
    description: "Geometría de controlador retro-futurista con cruceta y botones limpios",
    prompt: "A minimalist modern gaming controller icon with clean D-pad, sharp button outlines, gamer culture aesthetic",
  },
  {
    id: "mascara_kitsune",
    title: "Máscara Kitsune Japonesa",
    description: "Símbolo de anime tradicional y coleccionismo nipón",
    prompt: "A sleek minimalist Japanese kitsune fox mask icon, sacred anime aesthetic, clean vector lineart",
  },
  {
    id: "espada_legendaria",
    title: "Espada Maestra Legendaria",
    description: "Espada mística de aventuras de rol y videojuegos épicos",
    prompt: "A legendary fantasy sword icon pointing upright, clean geometric blade and hilt, Zelda RPG aesthetic",
  },
  {
    id: "gema_psa",
    title: "Gema Certificada PSA Gem Mint",
    description: "Diamante tallado de colección grado 10 con reflejos geométricos",
    prompt: "A pristine faceted diamond gem icon, high grade mint collector symbol, symmetrical geometric facets",
  },
  {
    id: "cofre_tesoro",
    title: "Cofre del Coleccionista",
    description: "Cofre arcano blindado con cerradura mística para figuras y rarezas",
    prompt: "An open treasure chest icon emitting subtle geometric light rays, collector loot aesthetic, bold clean strokes",
  },
  {
    id: "dragon_mecha",
    title: "Dragón Mecha Shogun",
    description: "Cabeza de dragón robótico de anime shonen de alta gama",
    prompt: "A stylized geometric dragon head crest icon, robotic mecha shonen anime aesthetic, sharp clean lines",
  },
];

export const LOGO_GRADIENT_OPTIONS = [
  { id: "from-[#FF6B35] to-[#1F3A5F]", label: "Naranja & Azul Omni (Oficial)", preview: "bg-gradient-to-br from-[#FF6B35] to-[#1F3A5F]" },
  { id: "from-[#FF6B35] to-[#E85D2A]", label: "Naranja Coleccionista", preview: "bg-gradient-to-br from-[#FF6B35] to-[#E85D2A]" },
  { id: "from-[#1F3A5F] to-[#0D1F36]", label: "Azul Nocturno Profundo", preview: "bg-gradient-to-br from-[#1F3A5F] to-[#0D1F36]" },
  { id: "from-amber-500 to-amber-700", label: "Dorado PSA Gem Mint", preview: "bg-gradient-to-br from-amber-500 to-amber-700" },
  { id: "from-purple-600 to-[#1F3A5F]", label: "Púrpura Místico / Anime", preview: "bg-gradient-to-br from-purple-600 to-[#1F3A5F]" },
  { id: "from-emerald-500 to-teal-700", label: "Verde Esmeralda", preview: "bg-gradient-to-br from-emerald-500 to-teal-700" },
];export const STORE_WHATSAPP_NUMBER = "56958243917";
export const STORE_WHATSAPP_DISPLAY = "+56 9 5824 3917";
