/**
 * Media and Video utilities for OmniCollector Chile
 */

/**
 * Extracts a YouTube Video ID and returns a safe embed URL.
 * Handles standard youtube.com/watch?v=, youtu.be/, shorts/, and embed/ URLs.
 */
export function extractYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // If already an embed URL
  if (trimmed.includes("youtube.com/embed/") || trimmed.includes("youtube-nocookie.com/embed/")) {
    return trimmed;
  }

  // Handle youtu.be/<id>
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`;
  }

  // Handle youtube.com/watch?v=<id>
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
  }

  // Handle youtube.com/shorts/<id>
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?rel=0&modestbranding=1`;
  }

  // If passed just the 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}?rel=0&modestbranding=1`;
  }

  return null;
}

/**
 * Extrae el ID de archivo de Google Drive desde múltiples formatos de URL:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 * - https://lh3.googleusercontent.com/d/FILE_ID
 * - ID puro alfanumérico
 */
export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. /file/d/{id} o /d/{id}
  const pathMatch = trimmed.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // 2. Query param ?id={id} o &id={id}
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  // 3. Cadena pura si coincide con longitud y formato estándar de ID de Drive (mínimo 20 caracteres)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Normaliza cualquier URL de imagen, convirtiendo URLs de Google Drive
 * en el formato CDN directo (https://lh3.googleusercontent.com/d/{id})
 * para que se renderice instantáneamente en etiquetas <img> y Next.js sin páginas de visor HTML intermedias.
 */
export function normalizeImageUrl(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Si contiene patrones de Google Drive o Google Docs
  if (
    trimmed.includes("drive.google.com") ||
    trimmed.includes("docs.google.com") ||
    trimmed.includes("googleusercontent.com")
  ) {
    const driveId = extractGoogleDriveFileId(trimmed);
    if (driveId) {
      return `https://lh3.googleusercontent.com/d/${driveId}`;
    }
  }

  // Si el usuario ingresó solo el ID largo de Google Drive directamente
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed) && !trimmed.startsWith("http")) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }

  return trimmed;
}

/**
 * Intelligent heuristic lookup for canonical YouTube trailers across popular franchises,
 * video games, anime figures, consoles, and gaming hardware.
 */
export function inferOfficialYouTubeTrailer(
  rawName: string,
  _rawType?: string,
  _customCategoryLabel?: string
): string | undefined {
  const lower = (rawName || "").toLowerCase();

  // 1. Popular Video Games
  if (lower.includes("erdtree")) return "https://www.youtube.com/watch?v=qLZenOn7WUo";
  if (lower.includes("elden ring")) return "https://www.youtube.com/watch?v=E3Huy2cdih0";
  if (lower.includes("rebirth") || (lower.includes("final fantasy") && lower.includes("7")))
    return "https://www.youtube.com/watch?v=H_5_9iPqF-U";
  if (lower.includes("final fantasy xvi") || lower.includes("final fantasy 16"))
    return "https://www.youtube.com/watch?v=iaJ4VVFGIa8";
  if (lower.includes("cyberpunk")) return "https://www.youtube.com/watch?v=8X2kIfS6fb8";
  if (lower.includes("witcher")) return "https://www.youtube.com/watch?v=c0i88t0Kacs";
  if (lower.includes("tears of the kingdom")) return "https://www.youtube.com/watch?v=uHGShqcAHlQ";
  if (lower.includes("breath of the wild")) return "https://www.youtube.com/watch?v=zw47_q9wbBE";
  if (lower.includes("wukong")) return "https://www.youtube.com/watch?v=pnSsgRJmsCc";
  if (lower.includes("resident evil 4")) return "https://www.youtube.com/watch?v=j5Ic2z36Ue0";
  if (lower.includes("resident evil")) return "https://www.youtube.com/watch?v=btFclZUXpwo";
  if (lower.includes("tekken 8")) return "https://www.youtube.com/watch?v=2hPuRQz6IlM";
  if (lower.includes("sparking") || (lower.includes("dragon ball") && lower.includes("zero")))
    return "https://www.youtube.com/watch?v=1F_s05Qf0fE";
  if (lower.includes("persona 3 reload")) return "https://www.youtube.com/watch?v=f2vO_a_e_yY";
  if (lower.includes("persona 5")) return "https://www.youtube.com/watch?v=kZX3eR89X4w";
  if (lower.includes("metaphor")) return "https://www.youtube.com/watch?v=y1h209zVz9k";
  if (lower.includes("mario wonder")) return "https://www.youtube.com/watch?v=JStAYvbeSHc";
  if (lower.includes("silent hill 2")) return "https://www.youtube.com/watch?v=7h2Y0R3rL6k";
  if (lower.includes("gta") || lower.includes("grand theft auto"))
    return "https://www.youtube.com/watch?v=QdBZY2fkU-0";
  if (lower.includes("ragnarok") || lower.includes("god of war"))
    return "https://www.youtube.com/watch?v=EE-4GvjKcfs";
  if (lower.includes("spider-man") || lower.includes("spiderman"))
    return "https://www.youtube.com/watch?v=9fVYKs4amsw";
  if (lower.includes("ghost of yotei")) return "https://www.youtube.com/watch?v=7_t_v8o_Tmg";
  if (lower.includes("monster hunter wilds")) return "https://www.youtube.com/watch?v=bbj5Ew1k_u4";
  if (lower.includes("death stranding")) return "https://www.youtube.com/watch?v=1t2gJp4l5tY";
  if (lower.includes("doom")) return "https://www.youtube.com/watch?v=4gwflzD_Kog";
  if (lower.includes("helldivers")) return "https://www.youtube.com/watch?v=l_kR_M79k88";

  // 2. Anime & Figures
  if (lower.includes("chainsaw man") || lower.includes("makima") || lower.includes("denji") || lower.includes("power"))
    return "https://www.youtube.com/watch?v=v4yLeNt-kCU";
  if (lower.includes("evangelion") || lower.includes("asuka") || lower.includes("rei") || lower.includes("eva-01"))
    return "https://www.youtube.com/watch?v=10rx_6w5AUs";
  if (lower.includes("jujutsu") || lower.includes("gojo") || lower.includes("sukuna"))
    return "https://www.youtube.com/watch?v=pkKu8p8eZ_w";
  if (lower.includes("kimetsu") || lower.includes("demon slayer") || lower.includes("nezuko") || lower.includes("tanjiro"))
    return "https://www.youtube.com/watch?v=VQGCKyvzIM4";
  if (lower.includes("one piece") || lower.includes("luffy") || lower.includes("zoro") || lower.includes("nami"))
    return "https://www.youtube.com/watch?v=MCb13lbKpsk";
  if (lower.includes("fate") || lower.includes("saber") || lower.includes("grand order"))
    return "https://www.youtube.com/watch?v=0kF1pQ7B6f8";
  if (lower.includes("genshin") || lower.includes("raiden") || lower.includes("furina") || lower.includes("zhongli"))
    return "https://www.youtube.com/watch?v=TAlKhARUcoY";
  if (lower.includes("honkai") || lower.includes("star rail") || lower.includes("acheron"))
    return "https://www.youtube.com/watch?v=7X8kOqZ4Q1k";
  if (lower.includes("nier") || lower.includes("2b"))
    return "https://www.youtube.com/watch?v=0yGj3m9G1t0";
  if (lower.includes("dragon ball") || lower.includes("goku") || lower.includes("vegeta"))
    return "https://www.youtube.com/watch?v=2e6i44XmH-Q";
  if (lower.includes("bleach") || lower.includes("ichigo"))
    return "https://www.youtube.com/watch?v=78WIYzX_Ed8";
  if (lower.includes("shingeki") || lower.includes("attack on titan") || lower.includes("levi"))
    return "https://www.youtube.com/watch?v=M_OauHnAFc8";
  if (lower.includes("frieren"))
    return "https://www.youtube.com/watch?v=qgQunxD0qLk";
  if (lower.includes("oshi no ko") || lower.includes("ai hoshino"))
    return "https://www.youtube.com/watch?v=gT8wNl21j-o";
  if (lower.includes("bocchi"))
    return "https://www.youtube.com/watch?v=0X2aB3lPqg4";
  if (lower.includes("spy x family") || lower.includes("anya"))
    return "https://www.youtube.com/watch?v=ofXigq9aIpo";

  // 3. Consoles, Peripherals & Hardware
  if (lower.includes("playstation 5") || lower.includes("ps5"))
    return "https://www.youtube.com/watch?v=RkC0l4iekYo";
  if (lower.includes("switch oled") || lower.includes("nintendo switch"))
    return "https://www.youtube.com/watch?v=4mHq6Y7JSmg";
  if (lower.includes("dualsense"))
    return "https://www.youtube.com/watch?v=SebzB8WytQ0";
  if (lower.includes("xbox series"))
    return "https://www.youtube.com/watch?v=0tUqIHwHDEc";
  if (lower.includes("steam deck"))
    return "https://www.youtube.com/watch?v=Mww4t3jEawU";
  if (lower.includes("geforce") || lower.includes("rtx"))
    return "https://www.youtube.com/watch?v=u8qQ92_99wY";
  if (lower.includes("ryzen") || lower.includes("radeon"))
    return "https://www.youtube.com/watch?v=J3mC3N8c0mE";

  return undefined;
}
