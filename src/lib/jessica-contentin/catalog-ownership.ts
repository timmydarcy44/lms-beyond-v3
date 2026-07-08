import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";

/** UUID profil Jessica Contentin (prod zmcefidiiqqppowymoqb). */
export const JESSICA_CONTENTIN_PROFILE_ID = "fcdc770d-4474-43ae-97d6-e70ef7e58779";

export type JessicaCatalogOwnerFields = {
  creator_id?: string | null;
  created_by?: string | null;
};

/** Filtre PostgREST pour catalog_items appartenant à Jessica. */
export function jessicaCatalogItemsOrFilter(jessicaId: string = JESSICA_CONTENTIN_PROFILE_ID): string {
  return `creator_id.eq.${jessicaId},created_by.eq.${jessicaId}`;
}

export function catalogItemBelongsToJessica(
  item: JessicaCatalogOwnerFields,
  jessicaId: string = JESSICA_CONTENTIN_PROFILE_ID,
): boolean {
  const id = String(jessicaId);
  return String(item.creator_id ?? "") === id || String(item.created_by ?? "") === id;
}

export function isJessicaContentinEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === JESSICA_CONTENTIN_EMAIL;
}
