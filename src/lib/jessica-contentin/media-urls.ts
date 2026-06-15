const JESSICA_STORAGE_BASE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin";

export function jessicaStorageUrl(filename: string): string {
  return `${JESSICA_STORAGE_BASE}/${filename}`;
}

export const JESSICA_PARCOURS_HERO_IMAGE = jessicaStorageUrl(
  "Gemini_Generated_Image_tu379itu379itu37.png",
);

/** Maquettes portrait (iPhone déjà intégré dans l'image) */
export const JESSICA_RESOURCE_SLIDER_IMAGES = {
  grilleObservation: jessicaStorageUrl("IMG_0324-portrait.png"),
  protocoleCrise: jessicaStorageUrl("IMG_0325-portrait.png"),
  strategiesAlimentaires: jessicaStorageUrl("IMG_0326-portrait.png"),
  ficheDevoirs: jessicaStorageUrl("IMG_0327-portrait.png"),
  organisationFratrie: jessicaStorageUrl("IMG_0328-portrait.png"),
} as const;
