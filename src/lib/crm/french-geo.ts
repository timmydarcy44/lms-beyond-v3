/** Coordonnées approximatives (centroïde département métropole) pour cartographie pipeline. */
const DEPARTMENT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "01": { lat: 46.2, lng: 5.22 },
  "02": { lat: 49.56, lng: 3.62 },
  "03": { lat: 46.34, lng: 3.42 },
  "04": { lat: 44.09, lng: 6.24 },
  "05": { lat: 44.66, lng: 6.08 },
  "06": { lat: 43.7, lng: 7.27 },
  "07": { lat: 44.73, lng: 4.6 },
  "08": { lat: 49.77, lng: 4.72 },
  "09": { lat: 42.97, lng: 1.61 },
  "10": { lat: 48.3, lng: 4.08 },
  "11": { lat: 43.21, lng: 2.35 },
  "12": { lat: 44.35, lng: 2.57 },
  "13": { lat: 43.53, lng: 5.45 },
  "14": { lat: 49.18, lng: -0.37 },
  "15": { lat: 45.04, lng: 2.44 },
  "16": { lat: 45.65, lng: 0.16 },
  "17": { lat: 45.75, lng: -0.65 },
  "18": { lat: 47.08, lng: 2.4 },
  "19": { lat: 45.27, lng: 1.77 },
  "21": { lat: 47.32, lng: 5.04 },
  "22": { lat: 48.45, lng: -2.76 },
  "23": { lat: 46.17, lng: 2.07 },
  "24": { lat: 45.18, lng: 0.72 },
  "25": { lat: 47.24, lng: 6.02 },
  "26": { lat: 44.73, lng: 5.22 },
  "27": { lat: 49.02, lng: 1.15 },
  "28": { lat: 48.45, lng: 1.49 },
  "29": { lat: 48.0, lng: -4.1 },
  "30": { lat: 44.13, lng: 4.08 },
  "31": { lat: 43.6, lng: 1.44 },
  "32": { lat: 43.65, lng: 0.59 },
  "33": { lat: 44.84, lng: -0.58 },
  "34": { lat: 43.61, lng: 3.87 },
  "35": { lat: 48.11, lng: -1.68 },
  "36": { lat: 46.81, lng: 1.69 },
  "37": { lat: 47.39, lng: 0.69 },
  "38": { lat: 45.19, lng: 5.72 },
  "39": { lat: 46.67, lng: 5.55 },
  "40": { lat: 43.89, lng: -0.5 },
  "41": { lat: 47.59, lng: 1.34 },
  "42": { lat: 45.44, lng: 4.39 },
  "43": { lat: 45.04, lng: 3.88 },
  "44": { lat: 47.22, lng: -1.55 },
  "45": { lat: 47.9, lng: 2.0 },
  "46": { lat: 44.45, lng: 1.44 },
  "47": { lat: 44.2, lng: 0.62 },
  "48": { lat: 44.52, lng: 3.5 },
  "49": { lat: 47.47, lng: -0.55 },
  "50": { lat: 49.11, lng: -1.09 },
  "51": { lat: 49.04, lng: 4.02 },
  "52": { lat: 48.11, lng: 5.14 },
  "53": { lat: 48.07, lng: -0.77 },
  "54": { lat: 48.69, lng: 6.18 },
  "55": { lat: 49.16, lng: 5.38 },
  "56": { lat: 47.75, lng: -2.76 },
  "57": { lat: 49.12, lng: 6.18 },
  "58": { lat: 47.0, lng: 3.16 },
  "59": { lat: 50.45, lng: 3.07 },
  "60": { lat: 49.42, lng: 2.41 },
  "61": { lat: 48.43, lng: 0.09 },
  "62": { lat: 50.29, lng: 2.78 },
  "63": { lat: 45.78, lng: 3.08 },
  "64": { lat: 43.18, lng: -0.62 },
  "65": { lat: 43.23, lng: 0.08 },
  "66": { lat: 42.7, lng: 2.9 },
  "67": { lat: 48.58, lng: 7.75 },
  "68": { lat: 47.75, lng: 7.34 },
  "69": { lat: 45.76, lng: 4.84 },
  "70": { lat: 47.63, lng: 6.16 },
  "71": { lat: 46.78, lng: 4.85 },
  "72": { lat: 48.0, lng: 0.2 },
  "73": { lat: 45.57, lng: 6.08 },
  "74": { lat: 46.0, lng: 6.33 },
  "75": { lat: 48.86, lng: 2.35 },
  "76": { lat: 49.44, lng: 1.1 },
  "77": { lat: 48.54, lng: 2.66 },
  "78": { lat: 48.8, lng: 2.13 },
  "79": { lat: 46.32, lng: -0.46 },
  "80": { lat: 49.89, lng: 2.3 },
  "81": { lat: 43.93, lng: 2.15 },
  "82": { lat: 44.0, lng: 1.35 },
  "83": { lat: 43.42, lng: 6.23 },
  "84": { lat: 44.05, lng: 5.05 },
  "85": { lat: 46.67, lng: -1.43 },
  "86": { lat: 46.58, lng: 0.34 },
  "87": { lat: 45.83, lng: 1.26 },
  "88": { lat: 48.17, lng: 6.45 },
  "89": { lat: 47.8, lng: 3.57 },
  "90": { lat: 47.63, lng: 6.86 },
  "91": { lat: 48.53, lng: 2.24 },
  "92": { lat: 48.84, lng: 2.21 },
  "93": { lat: 48.91, lng: 2.44 },
  "94": { lat: 48.79, lng: 2.46 },
  "95": { lat: 49.05, lng: 2.1 },
};

export function parseZipFromText(raw: string | null | undefined): string | null {
  const match = String(raw ?? "").match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}

export function departmentFromZip(zip: string | null | undefined): string | null {
  const z = String(zip ?? "").trim();
  if (z.length !== 5) return null;
  if (z.startsWith("20")) return "2A";
  const dept = z.slice(0, 2);
  if (dept === "97" || dept === "98") return dept;
  return dept;
}

export function centroidFromZip(zip: string | null | undefined): { lat: number; lng: number } | null {
  const dept = departmentFromZip(zip);
  if (!dept) return null;
  return DEPARTMENT_CENTROIDS[dept] ?? null;
}

export function projectLatLngToSvg(
  lat: number,
  lng: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const minLat = 41.0;
  const maxLat = 51.2;
  const minLng = -5.5;
  const maxLng = 9.8;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = ((maxLat - lat) / (maxLat - minLat)) * height;
  return { x: Math.max(4, Math.min(width - 4, x)), y: Math.max(4, Math.min(height - 4, y)) };
}

export type DealGeoPoint = {
  id: string;
  company_name: string;
  lat: number;
  lng: number;
  naf_code?: string | null;
};

export function resolveDealGeoPoint(deal: {
  id: string;
  company_name: string;
  location?: string | null;
  zip_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  naf_code?: string | null;
}): DealGeoPoint | null {
  if (typeof deal.latitude === "number" && typeof deal.longitude === "number") {
    return {
      id: deal.id,
      company_name: deal.company_name,
      lat: deal.latitude,
      lng: deal.longitude,
      naf_code: deal.naf_code,
    };
  }
  const zip = deal.zip_code ?? parseZipFromText(deal.location);
  const centroid = centroidFromZip(zip);
  if (!centroid) return null;
  return {
    id: deal.id,
    company_name: deal.company_name,
    lat: centroid.lat,
    lng: centroid.lng,
    naf_code: deal.naf_code,
  };
}
