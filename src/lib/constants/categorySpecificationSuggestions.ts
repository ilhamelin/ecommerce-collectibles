import type { CustomCategoryTemplateField } from "@/lib/types/domain";

export interface CategorySpecificationSuggestion {
  subtypes: string[];
  basicFields: CustomCategoryTemplateField[];
  advancedFields: CustomCategoryTemplateField[];
}

/**
 * Predefined domain suggestion presets
 */
const DOMAIN_PRESETS: Array<{
  keywords: string[];
  subtypes: string[];
  basic: Array<{ name: string; placeholder: string; required?: boolean }>;
  advanced: Array<{ name: string; placeholder: string; required?: boolean }>;
}> = [
  // 1. Televisores & Pantallas
  {
    keywords: ["televisor", "televisores", "tv", "pantalla", "pantallas", "smart tv", "oled", "qled", "microled"],
    subtypes: ["OLED 4K", "QLED / Mini LED", "Smart TV 4K", "Gaming TV 144Hz", "NanoCell", "8K Ultra HD"],
    basic: [
      { name: "Resolución", placeholder: "ej: 3840 x 2160 (4K UHD) nativo", required: true },
      { name: "Tamaño de Pantalla", placeholder: "ej: 65 pulgadas (165 cm diagonal)", required: true },
      { name: "Tasa de Refresco", placeholder: "ej: 120 Hz / 144 Hz nativo con VRR", required: false },
      { name: "Brillo Máximo (HDR)", placeholder: "ej: 1000 nits pico HDR10+", required: false },
    ],
    advanced: [
      { name: "Tecnología de Panel", placeholder: "ej: QD-OLED / Mini LED con Local Dimming", required: false },
      { name: "Formatos HDR", placeholder: "ej: Dolby Vision IQ, HDR10+, HLG", required: false },
      { name: "Puertos de Entrada", placeholder: "ej: 4x HDMI 2.1 (eARC, ALLM, 4K@120Hz), 2x USB", required: false },
      { name: "Sistema Operativo", placeholder: "ej: Google TV / webOS 24 / Tizen OS", required: false },
      { name: "Audio Integrado", placeholder: "ej: 2.1 Canales 40W con soporte Dolby Atmos", required: false },
      { name: "Conectividad Inalámbrica", placeholder: "ej: Wi-Fi 6 (802.11ax), Bluetooth 5.2, AirPlay 2", required: false },
    ],
  },

  // 2. Audio & Sonido
  {
    keywords: ["audio", "audifono", "audifonos", "auricular", "auriculares", "parlante", "parlantes", "headset", "soundbar", "sonido", "musica"],
    subtypes: ["Over-Ear Inalámbrico", "In-Ear TWS", "Parlante Bluetooth", "Soundbar Dolby Atmos", "Monitor de Estudio", "DAC / Amplificador"],
    basic: [
      { name: "Tipo de Conexión", placeholder: "ej: Bluetooth 5.3 + Jack 3.5mm", required: true },
      { name: "Autonomía de Batería", placeholder: "ej: Hasta 40 horas (ANC desactivado)", required: true },
      { name: "Cancelación de Ruido (ANC)", placeholder: "ej: ANC Activa Híbrida Adaptativa", required: false },
      { name: "Respuesta de Frecuencia", placeholder: "ej: 20 Hz - 40.000 Hz (Hi-Res Audio)", required: false },
    ],
    advanced: [
      { name: "Códecs Soportados", placeholder: "ej: LDAC, aptX Adaptive, AAC, SBC", required: false },
      { name: "Tamaño del Driver", placeholder: "ej: Transductor dinámico de 40mm de biocelulosa", required: false },
      { name: "Impedancia", placeholder: "ej: 32 Ohms a 1 kHz", required: false },
      { name: "Certificación de Resistencia", placeholder: "ej: IPX4 resistente a salpicaduras y sudor", required: false },
      { name: "Micrófono & Llamadas", placeholder: "ej: 4 micrófonos beamforming con reducción de viento", required: false },
    ],
  },

  // 3. Smartphones & Telefonía
  {
    keywords: ["celular", "celulares", "smartphone", "smartphones", "telefono", "telefonos", "movil"],
    subtypes: ["Gama Alta Flagship", "Gama Media Premium", "Plegable Fold", "Plegable Flip", "Gamer Pro"],
    basic: [
      { name: "Almacenamiento Interno", placeholder: "ej: 256 GB / 512 GB UFS 4.0", required: true },
      { name: "Memoria RAM", placeholder: "ej: 12 GB LPDDR5X", required: true },
      { name: "Pantalla Principal", placeholder: "ej: 6.7 pulgadas LTPO OLED 1-120Hz", required: true },
      { name: "Batería y Carga Rápida", placeholder: "ej: 5000 mAh con carga de 67W", required: false },
    ],
    advanced: [
      { name: "Procesador (SoC)", placeholder: "ej: Snapdragon 8 Gen 3 / Apple A18 Pro", required: false },
      { name: "Cámara Principal", placeholder: "ej: 50 MP (OIS) + 50 MP Ultra Gran Angular + 50 MP Teleobjetivo", required: false },
      { name: "Conectividad Red", placeholder: "ej: 5G Sub-6 / mmWave, Wi-Fi 7, eSIM + Dual SIM", required: false },
      { name: "Resistencia Agua & Polvo", placeholder: "ej: IP68 (hasta 1.5 metros por 30 min)", required: false },
      { name: "Sistema Operativo", placeholder: "ej: Android 15 con 7 años de actualizaciones", required: false },
    ],
  },

  // 4. Computación, Notebooks & Hardware
  {
    keywords: ["computador", "computadora", "notebook", "laptop", "pc", "hardware", "tarjeta de video", "placa madre", "procesador"],
    subtypes: ["Laptop Gamer", "Ultrabook Portátil", "Workstation Pro", "Tarjeta Gráfica", "Placa Madre", "Gabinete PC"],
    basic: [
      { name: "Procesador (CPU)", placeholder: "ej: Intel Core i7-14700HX / AMD Ryzen 7 7840HS", required: true },
      { name: "Memoria RAM", placeholder: "ej: 32 GB DDR5 5600 MHz (Expandible)", required: true },
      { name: "Almacenamiento", placeholder: "ej: 1 TB SSD M.2 NVMe PCIe 4.0", required: true },
      { name: "Tarjeta Gráfica (GPU)", placeholder: "ej: NVIDIA GeForce RTX 4070 8GB GDDR6", required: false },
    ],
    advanced: [
      { name: "Pantalla & Resolución", placeholder: "ej: 16 pulgadas QHD+ 2560x1600 IPS 240Hz 100% sRGB", required: false },
      { name: "Refrigeración Térmica", placeholder: "ej: Doble ventilador con cámara de vapor y metal líquido", required: false },
      { name: "Puertos de Expansión", placeholder: "ej: 1x Thunderbolt 4, 1x HDMI 2.1, 2x USB-A 3.2, RJ-45", required: false },
      { name: "Capacidad de Batería", placeholder: "ej: 90 Wh con cargador rápido de 240W", required: false },
      { name: "Sistema Operativo", placeholder: "ej: Windows 11 Home 64-bit licenciado", required: false },
    ],
  },

  // 5. Videojuegos & Mandos
  {
    keywords: ["videojuego", "videojuegos", "consola", "consolas", "mando", "mandos", "joystick", "gamer", "gaming"],
    subtypes: ["Consola de Sobremesa", "Consola Portátil", "Mando Inalámbrico", "Fightstick / Arcade", "Volante de Carreras"],
    basic: [
      { name: "Capacidad de Almacenamiento", placeholder: "ej: 1 TB SSD Ultrarrápido", required: true },
      { name: "Resolución Máxima de Salida", placeholder: "ej: 4K UHD a 120 FPS / Compatible con 8K", required: true },
      { name: "Plataforma / Ecosistema", placeholder: "ej: PlayStation 5 / Xbox Series / Nintendo Switch", required: true },
      { name: "Conexión del Mando", placeholder: "ej: Bluetooth 5.1 con retroalimentación háptica", required: false },
    ],
    advanced: [
      { name: "Lector Óptico", placeholder: "ej: Lector Blu-ray 4K Ultra HD integrado", required: false },
      { name: "Audio Espacial", placeholder: "ej: Tempest 3D AudioTech / Dolby Atmos", required: false },
      { name: "Puertos de Video", placeholder: "ej: 1x HDMI 2.1 con VRR y ALLM", required: false },
      { name: "Compatibilidad Retro", placeholder: "ej: Compatible con títulos de generaciones anteriores", required: false },
    ],
  },

  // 6. Juegos de Mesa & Cartas Coleccionables (TCG)
  {
    keywords: ["juego de mesa", "juegos de mesa", "tablero", "cartas", "tcg", "dados", "magic", "pokemon", "yugioh", "puzzle"],
    subtypes: ["Juego de Estrategia", "Deck Box / Folios", "Booster Box Sellada", "Carta Suelta Calificada", "Juego Cooperativo"],
    basic: [
      { name: "Número de Jugadores", placeholder: "ej: 1 a 4 Jugadores", required: true },
      { name: "Tiempo Estimado de Partida", placeholder: "ej: 45 - 90 minutos", required: true },
      { name: "Edad Recomendada", placeholder: "ej: Mayores de 14 años", required: true },
      { name: "Idioma de los Componentes", placeholder: "ej: Español oficial (manual y cartas)", required: false },
    ],
    advanced: [
      { name: "Mecánicas Principales", placeholder: "ej: Deckbuilding, Colocación de trabajadores, Draft", required: false },
      { name: "Editorial / Desarrollador", placeholder: "ej: Devir / Stonemaier Games / Asmodee", required: false },
      { name: "Condición / Grading", placeholder: "ej: Nuevo sellado / PSA 10 Gem Mint", required: false },
      { name: "Complejidad (BGG Weight)", placeholder: "ej: 2.8 / 5 (Complejidad Media)", required: false },
    ],
  },

  // 7. Zapatillas & Calzado
  {
    keywords: ["zapatilla", "zapatillas", "zapato", "zapatos", "calzado", "sneakers"],
    subtypes: ["Sneaker Lifestyle", "Running / Deporte", "Básquetbol", "Bota Urbana", "Edición Limitada Collab"],
    basic: [
      { name: "Talla / Número", placeholder: "ej: 42 EU / 8.5 US / 26.5 CM", required: true },
      { name: "Material Principal del Exterior", placeholder: "ej: Cuero legítimo y gamuza premium", required: true },
      { name: "Colorway Oficial", placeholder: "ej: White / Black / University Red", required: true },
      { name: "Tecnología de Suela", placeholder: "ej: Amortiguación Air encapsulada y goma antideslizante", required: false },
    ],
    advanced: [
      { name: "Tipo de Cierre", placeholder: "ej: Cordones clásicos con juego extra incluido", required: false },
      { name: "Colección / Temporada", placeholder: "ej: Primavera - Verano 2024 / Retro OG", required: false },
      { name: "País de Fabricación", placeholder: "ej: Vietnam / Indonesia", required: false },
      { name: "Autenticidad Garantizada", placeholder: "ej: Incluye caja original y etiquetas de verificación", required: false },
    ],
  },

  // 8. Figuras & Coleccionables
  {
    keywords: ["figura", "figuras", "estatua", "estatuas", "resina", "nendoroid", "funko", "gunpla", "anime", "escala"],
    subtypes: ["Figura a Escala 1/7", "Estatua de Resina Premium", "Nendoroid Articulada", "Funko Pop! Exclusivo", "Model Kit Gunpla"],
    basic: [
      { name: "Escala / Altura Total", placeholder: "ej: Escala 1/7 (Aprox. 26 cm de altura)", required: true },
      { name: "Fabricante / Licenciatario", placeholder: "ej: Good Smile Company / Alter / Kotobukiya", required: true },
      { name: "Material de Fabricación", placeholder: "ej: PVC y ABS de alta calidad pintado a mano", required: true },
      { name: "Franquicia / Personaje", placeholder: "ej: Neon Genesis Evangelion - Asuka Langley", required: false },
    ],
    advanced: [
      { name: "Accesorios Intercambiables", placeholder: "ej: 2 rostros adicionales, arma secundaria y base temática", required: false },
      { name: "Escultor / Diseñador", placeholder: "ej: Esculpido por Sakurako Ishinaga", required: false },
      { name: "Edición / Certificado", placeholder: "ej: Limitada a 1.500 unidades en todo el mundo con placa numerada", required: false },
      { name: "Condición del Empaque", placeholder: "ej: Nuevo sellado en caja original japonesa (Mint in Box)", required: false },
    ],
  },

  // 9. Ropa & Moda
  {
    keywords: ["ropa", "polera", "poleron", "chaqueta", "pantalon", "vestuario", "moda", "indumentaria", "hoodie"],
    subtypes: ["Polera Oversize", "Hoodie de Algodón", "Chaqueta Cortaviento", "Pantalón Cargo", "Gorra Snapback"],
    basic: [
      { name: "Talla Disponible", placeholder: "ej: S, M, L, XL, XXL", required: true },
      { name: "Composición Textil", placeholder: "ej: 100% Algodón peinado de 240 GSM", required: true },
      { name: "Corte / Fit", placeholder: "ej: Oversize relajado con hombros caídos", required: true },
      { name: "Color / Tono", placeholder: "ej: Negro grafito desgastado", required: false },
    ],
    advanced: [
      { name: "Técnica de Estampado", placeholder: "ej: Serigrafía tacto cero de alta durabilidad", required: false },
      { name: "Instrucciones de Cuidado", placeholder: "ej: Lavar con agua fría del revés, no usar secadora", required: false },
      { name: "Origen de Confección", placeholder: "ej: Diseñado en Chile, confeccionado en Portugal", required: false },
    ],
  },

  // 10. Libros & Manga
  {
    keywords: ["libro", "libros", "manga", "comic", "comics", "artbook", "novela", "novelas", "revista"],
    subtypes: ["Tomo Manga Tankobon", "Comic Book Formato Álbum", "Tomo Omnibus / Deluxe", "Artbook Tapa Dura", "Novela Ligera"],
    basic: [
      { name: "Editorial Oficial", placeholder: "ej: Panini Manga / Ivrea / Norma Editorial", required: true },
      { name: "Idioma de Publicación", placeholder: "ej: Español neutro / Castellano", required: true },
      { name: "Encuadernación", placeholder: "ej: Rústica con sobrecubierta (Tapa blanda)", required: true },
      { name: "Número de Páginas", placeholder: "ej: 192 páginas a blanco y negro + 4 a color", required: false },
    ],
    advanced: [
      { name: "Autor y Arte", placeholder: "ej: Historia y Arte por Eiichiro Oda", required: false },
      { name: "Sentido de Lectura", placeholder: "ej: Sentido oriental japonés tradicional (derecha a izquierda)", required: false },
      { name: "Código ISBN", placeholder: "ej: 978-84-12345-67-8", required: false },
    ],
  },
];

/**
 * Generates rich specification templates and subtypes based on category name reference.
 */
export function suggestCategorySpecifications(
  categoryName: string,
  description?: string
): CategorySpecificationSuggestion {
  const combined = `${categoryName} ${description || ""}`.toLowerCase().trim();
  const normalized = combined
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");

  const words = normalized.split(/\s+/).filter(Boolean);

  let bestMatch = DOMAIN_PRESETS[0];
  let found = false;

  for (const preset of DOMAIN_PRESETS) {
    for (const kw of preset.keywords) {
      const normKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isMatch = normKw.includes(" ")
        ? normalized.includes(normKw)
        : normKw.length <= 3
        ? words.includes(normKw)
        : normalized.includes(normKw);

      if (isMatch) {
        bestMatch = preset;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // If no specific preset found, generate a dynamic domain-tailored fallback
  if (!found) {
    const cleanName = categoryName.trim() || "Producto Especializado";
    return {
      subtypes: [
        `Estándar`,
        `Edición Especial`,
        `Gama Premium`,
        `Pack Coleccionista`,
      ],
      basicFields: [
        {
          id: `bf-${Date.now()}-1`,
          name: "Material Principal",
          placeholder: `ej: Material de construcción de ${cleanName}`,
          defaultValue: "",
          required: true,
        },
        {
          id: `bf-${Date.now()}-2`,
          name: "Dimensiones / Medidas",
          placeholder: `ej: Alto x Ancho x Profundidad o formato oficial`,
          defaultValue: "",
          required: true,
        },
        {
          id: `bf-${Date.now()}-3`,
          name: "Peso / Capacidad",
          placeholder: `ej: Peso neto con empaque o capacidad de uso`,
          defaultValue: "",
          required: false,
        },
      ],
      advancedFields: [
        {
          id: `af-${Date.now()}-1`,
          name: "Compatibilidad / Ecosistema",
          placeholder: `ej: Dispositivos, plataformas o accesorios compatibles`,
          defaultValue: "",
          required: false,
        },
        {
          id: `af-${Date.now()}-2`,
          name: "Garantía y Certificaciones",
          placeholder: `ej: 12 meses de garantía oficial del fabricante`,
          defaultValue: "",
          required: false,
        },
        {
          id: `af-${Date.now()}-3`,
          name: "Contenido del Empaque",
          placeholder: `ej: Qué incluye la caja al momento de abrir el producto`,
          defaultValue: "",
          required: false,
        },
      ],
    };
  }

  return {
    subtypes: [...bestMatch.subtypes],
    basicFields: bestMatch.basic.map((f, i) => ({
      id: `bf-${Date.now()}-${i + 1}`,
      name: f.name,
      placeholder: f.placeholder,
      defaultValue: "",
      required: Boolean(f.required),
    })),
    advancedFields: bestMatch.advanced.map((f, i) => ({
      id: `af-${Date.now()}-${i + 1}`,
      name: f.name,
      placeholder: f.placeholder,
      defaultValue: "",
      required: Boolean(f.required),
    })),
  };
}
