/** Coordonnées approximatives de villes françaises pour géolocaliser le pipeline sans CP. */
const FRENCH_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  paris: { lat: 48.8566, lng: 2.3522 },
  marseille: { lat: 43.2965, lng: 5.3698 },
  lyon: { lat: 45.764, lng: 4.8357 },
  toulouse: { lat: 43.6047, lng: 1.4442 },
  nice: { lat: 43.7102, lng: 7.262 },
  nantes: { lat: 47.2184, lng: -1.5536 },
  montpellier: { lat: 43.6108, lng: 3.8767 },
  strasbourg: { lat: 48.5734, lng: 7.7521 },
  bordeaux: { lat: 44.8378, lng: -0.5792 },
  lille: { lat: 50.6292, lng: 3.0573 },
  rennes: { lat: 48.1173, lng: -1.6778 },
  reims: { lat: 49.2583, lng: 4.0317 },
  "le havre": { lat: 49.4944, lng: 0.1079 },
  "saint-etienne": { lat: 45.4397, lng: 4.3872 },
  toulon: { lat: 43.1242, lng: 5.928 },
  grenoble: { lat: 45.1885, lng: 5.7245 },
  dijon: { lat: 47.322, lng: 5.0415 },
  angers: { lat: 47.4784, lng: -0.5632 },
  nimes: { lat: 43.8367, lng: 4.3601 },
  villeurbanne: { lat: 45.7719, lng: 4.8902 },
  "clermont-ferrand": { lat: 45.7772, lng: 3.087 },
  "le mans": { lat: 48.0077, lng: 0.1984 },
  aix: { lat: 43.5297, lng: 5.4474 },
  "aix-en-provence": { lat: 43.5297, lng: 5.4474 },
  brest: { lat: 48.3905, lng: -4.4861 },
  tours: { lat: 47.3941, lng: 0.6848 },
  amiens: { lat: 49.8941, lng: 2.2958 },
  limoges: { lat: 45.8336, lng: 1.2611 },
  annecy: { lat: 45.8992, lng: 6.1294 },
  perpignan: { lat: 42.6887, lng: 2.8948 },
  metz: { lat: 49.1193, lng: 6.1757 },
  besancon: { lat: 47.2378, lng: 6.0241 },
  orleans: { lat: 47.9029, lng: 1.9093 },
  rouen: { lat: 49.4432, lng: 1.0993 },
  mulhouse: { lat: 47.7508, lng: 7.3359 },
  caen: { lat: 49.1829, lng: -0.3707 },
  nancy: { lat: 48.6921, lng: 6.1844 },
  argenteuil: { lat: 48.9472, lng: 2.2467 },
  montreuil: { lat: 48.8638, lng: 2.4485 },
  roubaix: { lat: 50.6942, lng: 3.1746 },
  tourcoing: { lat: 50.7236, lng: 3.1609 },
  avignon: { lat: 43.9493, lng: 4.8055 },
  dunkerque: { lat: 51.0343, lng: 2.3772 },
  poitiers: { lat: 46.5802, lng: 0.3404 },
  "asnieres-sur-seine": { lat: 48.9106, lng: 2.2858 },
  versailles: { lat: 48.8014, lng: 2.1301 },
  courbevoie: { lat: 48.8967, lng: 2.2567 },
  vitry: { lat: 48.7872, lng: 2.4033 },
  colombes: { lat: 48.9228, lng: 2.252 },
  aulnay: { lat: 48.9384, lng: 2.494 },
  "aulnay-sous-bois": { lat: 48.9384, lng: 2.494 },
  rueil: { lat: 48.8775, lng: 2.189 },
  "rueil-malmaison": { lat: 48.8775, lng: 2.189 },
  pau: { lat: 43.2951, lng: -0.3708 },
  merignac: { lat: 44.8422, lng: -0.6451 },
  "saint-denis": { lat: 48.9362, lng: 2.3574 },
  calais: { lat: 50.9513, lng: 1.8587 },
  antibes: { lat: 43.5804, lng: 7.1251 },
  ajaccio: { lat: 41.9192, lng: 8.7386 },
  cherbourg: { lat: 49.6337, lng: -1.6163 },
  valence: { lat: 44.9334, lng: 4.8924 },
  quimper: { lat: 47.9977, lng: -4.0979 },
  "boulogne-billancourt": { lat: 48.8397, lng: 2.2399 },
  beziers: { lat: 43.3442, lng: 3.215 },
  laon: { lat: 49.5646, lng: 3.6242 },
  tarbes: { lat: 43.2338, lng: 0.078 },
  lorient: { lat: 47.7482, lng: -3.3702 },
  cholet: { lat: 47.061, lng: -0.8793 },
  bayonne: { lat: 43.4929, lng: -1.4748 },
  "saint-nazaire": { lat: 47.273, lng: -2.213 },
  niort: { lat: 46.3237, lng: -0.4648 },
  "saint-quentin": { lat: 49.8471, lng: 3.2876 },
  nevers: { lat: 46.9896, lng: 3.159 },
  "le blanc-mesnil": { lat: 48.9389, lng: 2.4614 },
  hyeres: { lat: 43.1203, lng: 6.1286 },
  epinal: { lat: 48.1728, lng: 6.451 },
  montauban: { lat: 44.0176, lng: 1.3548 },
  chartres: { lat: 48.4469, lng: 1.489 },
  evreux: { lat: 49.027, lng: 1.1514 },
  "la rochelle": { lat: 46.1603, lng: -1.1511 },
  "saint-brieuc": { lat: 48.5136, lng: -2.7653 },
  "saint-malo": { lat: 48.6493, lng: -2.0257 },
  angouleme: { lat: 45.6484, lng: 0.1562 },
  troyes: { lat: 48.2973, lng: 4.0744 },
  albi: { lat: 43.9298, lng: 2.148 },
  macon: { lat: 46.3063, lng: 4.8282 },
  arles: { lat: 43.6766, lng: 4.6278 },
  sete: { lat: 43.405, lng: 3.6966 },
  dieppe: { lat: 49.9228, lng: 1.0775 },
  "le havre": { lat: 49.4944, lng: 0.1079 },
  fecamp: { lat: 49.758, lng: 0.374 },
  honfleur: { lat: 49.4194, lng: 0.2325 },
  deauville: { lat: 49.3598, lng: 0.0751 },
  "le grand-quevilly": { lat: 49.406, lng: 1.041 },
  "petit-quevilly": { lat: 49.4306, lng: 1.0539 },
  elbeuf: { lat: 49.2867, lng: 1.0069 },
  yvetot: { lat: 49.617, lng: 0.748 },
};

export function normalizeCityKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function coordsFromCityName(raw: string | null | undefined): { lat: number; lng: number } | null {
  const key = normalizeCityKey(String(raw ?? ""));
  if (!key || key.length < 2) return null;
  if (FRENCH_CITY_COORDS[key]) return FRENCH_CITY_COORDS[key];
  for (const [city, coords] of Object.entries(FRENCH_CITY_COORDS)) {
    if (key.includes(city) || city.includes(key)) return coords;
  }
  return null;
}

export function extractCityCandidates(...parts: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const part of parts) {
    const raw = String(part ?? "").trim();
    if (!raw) continue;
    out.add(raw);
    const withoutZip = raw.replace(/\b\d{5}\b/g, " ").replace(/\(\d{2,3}\)/g, " ").trim();
    if (withoutZip) out.add(withoutZip);
    for (const chunk of raw.split(/[,;|/]/)) {
      const c = chunk.replace(/\b\d{5}\b/g, "").trim();
      if (c.length >= 2) out.add(c);
    }
  }
  return [...out];
}
