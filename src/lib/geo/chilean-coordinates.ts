// Chilean Communes and Logistics Coordinates for OmniCollector Live Tracking Engine

export interface LatLngPoint {
  lat: number;
  lng: number;
}

// Bodega Central OmniCollector - Centro de Distribución ENEA / Pudahuel, Santiago
export const OMNI_WAREHOUSE_COORDINATES: LatLngPoint = {
  lat: -33.4345,
  lng: -70.7712,
};

// Base coordinates for common Chilean Communes
export const CHILEAN_COMMUNES_COORDINATES: Record<string, LatLngPoint> = {
  // Región Metropolitana
  "santiago": { lat: -33.4489, lng: -70.6693 },
  "santiago centro": { lat: -33.4489, lng: -70.6693 },
  "providencia": { lat: -33.4314, lng: -70.6093 },
  "las condes": { lat: -33.4116, lng: -70.5654 },
  "vitacura": { lat: -33.3857, lng: -70.5772 },
  "lo barnechea": { lat: -33.3541, lng: -70.5186 },
  "ñuñoa": { lat: -33.4569, lng: -70.5976 },
  "nunoa": { lat: -33.4569, lng: -70.5976 },
  "la reina": { lat: -33.4452, lng: -70.5422 },
  "macul": { lat: -33.4878, lng: -70.5989 },
  "peñalolén": { lat: -33.4862, lng: -70.5367 },
  "penalolen": { lat: -33.4862, lng: -70.5367 },
  "la florida": { lat: -33.5227, lng: -70.5831 },
  "puente alto": { lat: -33.6117, lng: -70.5758 },
  "san bernardo": { lat: -33.5922, lng: -70.7042 },
  "maipú": { lat: -33.5111, lng: -70.7581 },
  "maipu": { lat: -33.5111, lng: -70.7581 },
  "estación central": { lat: -33.4617, lng: -70.7000 },
  "estacion central": { lat: -33.4617, lng: -70.7000 },
  "quinta normal": { lat: -33.4319, lng: -70.6978 },
  "pudahuel": { lat: -33.4422, lng: -70.7589 },
  "lo prado": { lat: -33.4439, lng: -70.7222 },
  "cerro navia": { lat: -33.4278, lng: -70.7389 },
  "renca": { lat: -33.4028, lng: -70.7189 },
  "quilicura": { lat: -33.3644, lng: -70.7300 },
  "huechuraba": { lat: -33.3742, lng: -70.6389 },
  "recoleta": { lat: -33.4111, lng: -70.6400 },
  "independencia": { lat: -33.4194, lng: -70.6611 },
  "san miguel": { lat: -33.4917, lng: -70.6556 },
  "san joaquín": { lat: -33.4944, lng: -70.6278 },
  "san joaquin": { lat: -33.4944, lng: -70.6278 },
  "la cisterna": { lat: -33.5278, lng: -70.6639 },
  "el bosque": { lat: -33.5611, lng: -70.6722 },
  "la granja": { lat: -33.5333, lng: -70.6194 },
  "la pintana": { lat: -33.5833, lng: -70.6333 },
  "san ramón": { lat: -33.5389, lng: -70.6444 },
  "san ramon": { lat: -33.5389, lng: -70.6444 },
  "lo espejo": { lat: -33.5194, lng: -70.6917 },
  "pedro aguirre cerda": { lat: -33.4861, lng: -70.6778 },
  "cerrillos": { lat: -33.4972, lng: -70.7139 },
  "colina": { lat: -33.2031, lng: -70.6756 },
  "lampa": { lat: -33.2833, lng: -70.8667 },
  "padre hurtado": { lat: -33.5667, lng: -70.8167 },
  "peñaflor": { lat: -33.6000, lng: -70.8833 },
  "talagante": { lat: -33.6667, lng: -70.9333 },
  "buin": { lat: -33.7333, lng: -70.7333 },
  "paine": { lat: -33.8167, lng: -70.7500 },

  // Región de Valparaíso
  "viña del mar": { lat: -33.0245, lng: -71.5518 },
  "vina del mar": { lat: -33.0245, lng: -71.5518 },
  "valparaíso": { lat: -33.0472, lng: -71.6127 },
  "valparaiso": { lat: -33.0472, lng: -71.6127 },
  "quilpué": { lat: -33.0450, lng: -71.4428 },
  "quilpue": { lat: -33.0450, lng: -71.4428 },
  "villa alemana": { lat: -33.0428, lng: -71.3739 },
  "concón": { lat: -32.9233, lng: -71.5167 },
  "concon": { lat: -32.9233, lng: -71.5167 },

  // Región del Biobío
  "concepción": { lat: -36.8270, lng: -73.0503 },
  "concepcion": { lat: -36.8270, lng: -73.0503 },
  "talcahuano": { lat: -36.7249, lng: -73.1168 },
  "san pedro de la paz": { lat: -36.8406, lng: -73.1028 },
  "los ángeles": { lat: -37.4697, lng: -72.3537 },
  "los angeles": { lat: -37.4697, lng: -72.3537 },

  // Región de Coquimbo
  "la serena": { lat: -29.9027, lng: -71.2520 },
  "coquimbo": { lat: -29.9533, lng: -71.3395 },

  // Región de Antofagasta
  "antofagasta": { lat: -23.6509, lng: -70.3975 },
  "calama": { lat: -22.4544, lng: -68.9294 },

  // Región de La Araucanía
  "temuco": { lat: -38.7359, lng: -72.5904 },
  "padre las casas": { lat: -38.7611, lng: -72.5972 },

  // Región de Los Lagos
  "puerto montt": { lat: -41.4693, lng: -72.9424 },
  "puerto varas": { lat: -41.3195, lng: -72.9854 },
  "osorno": { lat: -40.5739, lng: -73.1335 },
};

// Returns accurate or fallback coordinates for a given comuna/region in Chile
export function getCoordinatesForAddress(comuna?: string, region?: string): LatLngPoint {
  if (comuna) {
    const cleanComuna = comuna.toLowerCase().trim();
    if (CHILEAN_COMMUNES_COORDINATES[cleanComuna]) {
      return CHILEAN_COMMUNES_COORDINATES[cleanComuna];
    }

    // Try partial match
    for (const [key, coords] of Object.entries(CHILEAN_COMMUNES_COORDINATES)) {
      if (cleanComuna.includes(key) || key.includes(cleanComuna)) {
        return coords;
      }
    }
  }

  // Fallback to central Santiago (Providencia / Santiago Centro area) with slight deterministic variance
  return {
    lat: -33.4372,
    lng: -70.6506,
  };
}

// Generate realistic route waypoints between warehouse and customer destination
export function generateRouteWaypoints(
  origin: LatLngPoint,
  destination: LatLngPoint,
  steps: number = 20
): LatLngPoint[] {
  const points: LatLngPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;

    // Linear interpolation
    let lat = origin.lat + (destination.lat - origin.lat) * progress;
    let lng = origin.lng + (destination.lng - origin.lng) * progress;

    // Add gentle natural curve simulating highway & street networks
    if (i > 0 && i < steps) {
      const curveFactor = Math.sin(progress * Math.PI);
      const latWiggle = Math.sin(i * 1.5) * 0.003 * curveFactor;
      const lngWiggle = Math.cos(i * 1.2) * 0.004 * curveFactor;
      lat += latWiggle;
      lng += lngWiggle;
    }

    points.push({ lat, lng });
  }

  return points;
}
