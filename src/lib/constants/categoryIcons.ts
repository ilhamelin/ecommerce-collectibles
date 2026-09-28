import type { LucideIcon } from "lucide-react";
import {
  Tv,
  Monitor,
  Cpu,
  Gamepad2,
  Headphones,
  Box,
  Shirt,
  BookOpen,
  Gift,
  Disc3,
  HardDrive,
  Shield,
  Zap,
  Sliders,
  Sparkles,
  Tag,
  Dices,
  Puzzle,
  Coffee,
  Car,
  Bike,
  Camera,
  Video,
  Speaker,
  Music,
  Watch,
  Clock,
  Smartphone,
  Tablet,
  Laptop,
  Dumbbell,
  Utensils,
  Wrench,
  Gem,
  Crown,
  Dog,
  Cat,
  Trophy,
  Flame,
  Footprints,
  Glasses,
  Palette,
  Layers,
  Radio,
} from "lucide-react";

export interface CategoryIconItem {
  id: string;
  label: string;
  icon: LucideIcon;
  tags?: string[];
}

/**
 * 16 Preset canonical suggested icons shown by default in the grid
 */
export const AVAILABLE_SUGGESTED_ICONS: CategoryIconItem[] = [
  { id: "Tv", label: "Pantallas / TV", icon: Tv, tags: ["televisor", "tv", "pantalla", "oled"] },
  { id: "Monitor", label: "Monitores", icon: Monitor, tags: ["monitor", "display", "pantalla"] },
  { id: "Cpu", label: "Hardware / PC", icon: Cpu, tags: ["pc", "procesador", "tarjeta", "hardware"] },
  { id: "Gamepad2", label: "Gaming / Mandos", icon: Gamepad2, tags: ["consola", "juego", "mando", "joystick"] },
  { id: "Headphones", label: "Audio / Headsets", icon: Headphones, tags: ["audio", "auricular", "audifono", "sonido"] },
  { id: "Box", label: "Cajas / Packs", icon: Box, tags: ["pack", "caja", "bundle", "lote"] },
  { id: "Shirt", label: "Indumentaria", icon: Shirt, tags: ["ropa", "polera", "vestuario", "moda"] },
  { id: "BookOpen", label: "Libros / Cómics", icon: BookOpen, tags: ["manga", "comic", "libro", "artbook"] },
  { id: "Gift", label: "Merch / Regalos", icon: Gift, tags: ["regalo", "merch", "souvenir"] },
  { id: "Disc3", label: "Discos / OST", icon: Disc3, tags: ["disco", "vinilo", "ost", "musica"] },
  { id: "HardDrive", label: "Almacenamiento", icon: HardDrive, tags: ["disco duro", "ssd", "memoria"] },
  { id: "Zap", label: "Energía / Fuentes", icon: Zap, tags: ["bateria", "fuente", "cargador", "energia"] },
  { id: "Shield", label: "Coleccionables", icon: Shield, tags: ["figura", "coleccionable", "estatua"] },
  { id: "Sliders", label: "Accesorios", icon: Sliders, tags: ["accesorio", "periferico", "setup"] },
  { id: "Sparkles", label: "Especial", icon: Sparkles, tags: ["especial", "premium", "edicion"] },
  { id: "Tag", label: "Etiqueta", icon: Tag, tags: ["otro", "general", "etiqueta"] },
];

/**
 * Full registry of supported icons mapped by ID
 */
export const ICON_REGISTRY: Record<string, { icon: LucideIcon; defaultLabel: string }> = {
  Tv: { icon: Tv, defaultLabel: "Pantalla / TV" },
  Monitor: { icon: Monitor, defaultLabel: "Monitor" },
  Cpu: { icon: Cpu, defaultLabel: "Hardware / CPU" },
  Gamepad2: { icon: Gamepad2, defaultLabel: "Gaming / Consola" },
  Headphones: { icon: Headphones, defaultLabel: "Audio / Audífonos" },
  Box: { icon: Box, defaultLabel: "Caja / Pack" },
  Shirt: { icon: Shirt, defaultLabel: "Ropa / Estilo" },
  BookOpen: { icon: BookOpen, defaultLabel: "Libro / Manga" },
  Gift: { icon: Gift, defaultLabel: "Merch / Regalo" },
  Disc3: { icon: Disc3, defaultLabel: "Música / Disco" },
  HardDrive: { icon: HardDrive, defaultLabel: "Almacenamiento" },
  Zap: { icon: Zap, defaultLabel: "Energía / Potencia" },
  Shield: { icon: Shield, defaultLabel: "Coleccionable" },
  Sliders: { icon: Sliders, defaultLabel: "Accesorio" },
  Sparkles: { icon: Sparkles, defaultLabel: "Especial" },
  Tag: { icon: Tag, defaultLabel: "Etiqueta" },
  Dices: { icon: Dices, defaultLabel: "Juegos de Mesa" },
  Puzzle: { icon: Puzzle, defaultLabel: "Puzzle / Estrategia" },
  Coffee: { icon: Coffee, defaultLabel: "Café & Cocina" },
  Car: { icon: Car, defaultLabel: "Vehículos / Autos" },
  Bike: { icon: Bike, defaultLabel: "Bicicletas / Ciclismo" },
  Camera: { icon: Camera, defaultLabel: "Fotografía & Video" },
  Video: { icon: Video, defaultLabel: "Cine & Grabación" },
  Speaker: { icon: Speaker, defaultLabel: "Parlantes / Sonido" },
  Music: { icon: Music, defaultLabel: "Instrumentos / Audio" },
  Watch: { icon: Watch, defaultLabel: "Relojes & Smartwatch" },
  Clock: { icon: Clock, defaultLabel: "Tiempo / Colección" },
  Smartphone: { icon: Smartphone, defaultLabel: "Smartphones & Celulares" },
  Tablet: { icon: Tablet, defaultLabel: "Tablets & Dibujo" },
  Laptop: { icon: Laptop, defaultLabel: "Notebooks & Laptops" },
  Dumbbell: { icon: Dumbbell, defaultLabel: "Fitness & Deporte" },
  Utensils: { icon: Utensils, defaultLabel: "Cocina & Gourmet" },
  Wrench: { icon: Wrench, defaultLabel: "Herramientas" },
  Gem: { icon: Gem, defaultLabel: "Joyas & Lujo" },
  Crown: { icon: Crown, defaultLabel: "Edición Coleccionista" },
  Dog: { icon: Dog, defaultLabel: "Mascotas & Animales" },
  Cat: { icon: Cat, defaultLabel: "Felinos & Accesorios" },
  Trophy: { icon: Trophy, defaultLabel: "Trofeos & Torneos" },
  Flame: { icon: Flame, defaultLabel: "Tendencia / Hot" },
  Footprints: { icon: Footprints, defaultLabel: "Calzado / Zapatillas" },
  Glasses: { icon: Glasses, defaultLabel: "Lentes & Óptica" },
  Palette: { icon: Palette, defaultLabel: "Arte & Pintura" },
  Layers: { icon: Layers, defaultLabel: "Lote / Bundle" },
  Radio: { icon: Radio, defaultLabel: "Transmisión / Radio" },
};

/**
 * Returns the Lucide component for any given icon ID, defaulting to Tag if unrecognized.
 */
export function getCategoryIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return Tag;
  const entry = ICON_REGISTRY[iconName];
  return entry ? entry.icon : Tag;
}

/**
 * Normalized string helper: strips accents, lowercases and trims.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

/**
 * Semantic mapping rules: maps keywords to prioritized icon IDs.
 */
interface SemanticRule {
  keywords: string[];
  iconCandidates: string[];
}

const SEMANTIC_RULES: SemanticRule[] = [
  // TVs / Screens / Displays
  {
    keywords: ["televisor", "televisores", "tv", "pantalla", "pantallas", "smart tv", "oled", "qled", "microled", "display", "proyector"],
    iconCandidates: ["Tv", "Monitor", "Radio"],
  },
  // Monitors
  {
    keywords: ["monitor", "monitores"],
    iconCandidates: ["Monitor", "Tv"],
  },
  // Mobile / Smartphones
  {
    keywords: ["celular", "celulares", "smartphone", "smartphones", "telefono", "telefonos", "movil", "moviles"],
    iconCandidates: ["Smartphone", "Tablet", "Watch"],
  },
  // Tablets
  {
    keywords: ["tablet", "tablets", "ipad", "kindle"],
    iconCandidates: ["Tablet", "Smartphone", "Laptop"],
  },
  // Laptops & PCs
  {
    keywords: ["laptop", "laptops", "notebook", "notebooks", "macbook", "computador", "computadora", "ordenador", "torre pc"],
    iconCandidates: ["Laptop", "Cpu", "Monitor"],
  },
  // Gaming / Consoles
  {
    keywords: [
      "consola", "consolas", "playstation", "ps5", "ps4", "xbox", "nintendo", "switch",
      "videojuego", "videojuegos", "mando", "mandos", "joystick", "gamer", "gaming", "arcade"
    ],
    iconCandidates: ["Gamepad2", "Trophy", "Cpu"],
  },
  // Audio / Sound / Music
  {
    keywords: [
      "audio", "sonido", "parlante", "parlantes", "altavoz", "altavoces", "auricular", "auriculares",
      "audifono", "audifonos", "headset", "headsets", "musica", "disco", "vinilo", "ost", "soundtrack",
      "microfono", "amplificador"
    ],
    iconCandidates: ["Headphones", "Speaker", "Disc3", "Music"],
  },
  // Photography / Cameras / Drones
  {
    keywords: ["camara", "camaras", "foto", "fotografia", "lente", "lentes", "video", "filmadora", "drone", "drones", "gopro"],
    iconCandidates: ["Camera", "Video"],
  },
  // Apparel / Clothing / Fashion
  {
    keywords: [
      "ropa", "polera", "poleras", "poleron", "polerones", "camiseta", "camisetas", "pantalon", "pantalones",
      "indumentaria", "moda", "vestuario", "textil", "abrigo", "chaqueta", "buzo", "hoodie"
    ],
    iconCandidates: ["Shirt", "Crown", "Tag"],
  },
  // Footwear
  {
    keywords: ["zapatilla", "zapatillas", "zapato", "zapatos", "calzado", "sneakers", "botas", "sandalias"],
    iconCandidates: ["Footprints", "Shirt"],
  },
  // Watches & Smartwatches
  {
    keywords: ["reloj", "relojes", "smartwatch", "horologia", "cronometro"],
    iconCandidates: ["Watch", "Clock"],
  },
  // Glasses & Optics
  {
    keywords: ["lente", "lentes", "gafas", "anteojos", "optica"],
    iconCandidates: ["Glasses"],
  },
  // Books / Manga / Comics
  {
    keywords: ["libro", "libros", "manga", "mangas", "comic", "comics", "artbook", "artbooks", "novela", "novelas", "revista", "revistas", "lectura", "libreria"],
    iconCandidates: ["BookOpen"],
  },
  // Board Games / Cards / TCG
  {
    keywords: [
      "juego de mesa", "juegos de mesa", "tablero", "tableros", "cartas", "tcg", "dados",
      "magic", "pokemon", "yugioh", "puzzle", "rompecabezas", "ajedrez", "catan"
    ],
    iconCandidates: ["Dices", "Puzzle", "Trophy", "Box"],
  },
  // Collectibles / Figures / Anime
  {
    keywords: [
      "figura", "figuras", "estatua", "estatuas", "resina", "resinas", "busto", "bustos",
      "diorama", "funko", "funkos", "nendoroid", "gunpla", "anime", "coleccionable", "coleccionables", "escala"
    ],
    iconCandidates: ["Sparkles", "Shield", "Trophy", "Gem"],
  },
  // Hardware & PC Components
  {
    keywords: ["hardware", "componente", "componentes", "cpu", "procesador", "gpu", "placa madre", "ram", "fuente de poder", "refrigeracion", "tarjeta de video"],
    iconCandidates: ["Cpu", "HardDrive", "Zap"],
  },
  // Storage
  {
    keywords: ["almacenamiento", "disco duro", "ssd", "nvme", "pendrive", "micro sd", "memoria"],
    iconCandidates: ["HardDrive", "Cpu"],
  },
  // Coffee / Kitchen / Gourmet
  {
    keywords: ["cafe", "cafetera", "cafeteras", "espresso", "te", "taza", "tazas", "pocillo", "granos de cafe"],
    iconCandidates: ["Coffee", "Utensils"],
  },
  // Food & Drinks
  {
    keywords: ["comida", "snack", "snacks", "bebida", "bebidas", "alimento", "alimentos", "cocina", "gourmet", "dulces", "golosinas"],
    iconCandidates: ["Utensils", "Coffee"],
  },
  // Tools / DIY
  {
    keywords: ["herramienta", "herramientas", "ferreteria", "bricolaje", "taller", "reparacion", "taladro"],
    iconCandidates: ["Wrench"],
  },
  // Sports & Fitness
  {
    keywords: ["deporte", "deportes", "fitness", "pesas", "gym", "gimnasio", "entrenamiento", "mancuernas"],
    iconCandidates: ["Dumbbell", "Flame", "Trophy"],
  },
  // Bikes
  {
    keywords: ["bicicleta", "bicicletas", "bike", "ciclismo", "ciclo"],
    iconCandidates: ["Bike"],
  },
  // Vehicles / Cars
  {
    keywords: ["auto", "autos", "automovil", "automoviles", "coche", "coches", "vehiculo", "vehiculos", "motor", "carreras"],
    iconCandidates: ["Car"],
  },
  // Pets
  {
    keywords: ["mascota", "mascotas", "perro", "perros", "canino", "veterinaria"],
    iconCandidates: ["Dog", "Cat"],
  },
  {
    keywords: ["gato", "gatos", "felino", "gatito"],
    iconCandidates: ["Cat", "Dog"],
  },
  // Jewelry / Luxury
  {
    keywords: ["joya", "joyas", "anillo", "anillos", "collar", "collares", "diamante", "diamantes", "oro", "plata", "lujo"],
    iconCandidates: ["Gem", "Crown"],
  },
  // Art / Design
  {
    keywords: ["arte", "pintura", "dibujo", "ilustracion", "cuadro", "cuadros", "escultura", "diseno"],
    iconCandidates: ["Palette", "Sparkles"],
  },
  // Bundles & Packs
  {
    keywords: ["paquete", "pack", "packs", "lote", "lotes", "bundle", "bundles", "combo", "set"],
    iconCandidates: ["Box", "Layers", "Gift"],
  },
];

/**
 * Result of generating an icon from category metadata.
 */
export interface GeneratedIconResult {
  id: string;
  label: string;
  icon: LucideIcon;
  concept: string;
}

/**
 * Generates an icon item with identical design language based on the category name reference.
 *
 * @param categoryName Name of the category entered by the user
 * @param description Optional description/purpose
 * @param variationIndex Optional index to cycle through alternative candidates
 */
export function generateCategoryIcon(
  categoryName: string,
  description?: string,
  variationIndex = 0
): GeneratedIconResult {
  const combined = `${categoryName} ${description || ""}`.trim();
  if (!combined) {
    return {
      id: "Tag",
      label: "Nueva Categoría",
      icon: Tag,
      concept: "Genérico",
    };
  }

  const normalized = normalizeText(combined);
  const words = normalized.split(/\s+/).filter(Boolean);

  // Search matching semantic rules
  const matchedCandidateIds: string[] = [];

  for (const rule of SEMANTIC_RULES) {
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw);
      if (!normKw) continue;

      const isMatch = normKw.includes(" ")
        ? normalized.includes(normKw)
        : normKw.length <= 3
        ? words.includes(normKw)
        : normalized.includes(normKw);

      if (isMatch) {
        for (const candidate of rule.iconCandidates) {
          if (!matchedCandidateIds.includes(candidate)) {
            matchedCandidateIds.push(candidate);
          }
        }
      }
    }
  }

  // Fallback candidates if no keyword matched
  if (matchedCandidateIds.length === 0) {
    matchedCandidateIds.push("Sparkles", "Tag", "Box", "Layers", "Sliders");
  }

  // Select candidate based on variationIndex
  const safeIndex = Math.abs(variationIndex) % matchedCandidateIds.length;
  const selectedIconId = matchedCandidateIds[safeIndex] || "Tag";

  const entry = ICON_REGISTRY[selectedIconId] || { icon: Tag, defaultLabel: "Personalizado" };
  const labelText = categoryName.trim() || entry.defaultLabel;

  return {
    id: selectedIconId,
    label: labelText,
    icon: entry.icon,
    concept: `Generado para "${categoryName}" (${entry.defaultLabel})`,
  };
}
