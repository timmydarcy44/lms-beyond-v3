/**
 * Média de couverture formation : la colonne DB `courses.cover_image` prime ;
 * repli : `builder_snapshot.general.cover_image` (souvent présent côté builder).
 */

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Récupère l’URL / clé brute (non résolue vers un CDN) depuis un objet carte ou course.
 * Ne consulte jamais une clé `cover` (colonne supprimée côté produit).
 */
export function pickCoverImageFromItem(item: Record<string, unknown> | null | undefined): string {
  if (!item) return "";
  const top = trimStr(item.cover_image);
  if (top) return top;

  const gen = item.general;
  if (gen && typeof gen === "object" && gen !== null) {
    const nested = trimStr((gen as { cover_image?: string }).cover_image);
    if (nested) return nested;
  }

  const raw = item.builder_snapshot;
  let snap: unknown = raw;
  if (typeof raw === "string") {
    try {
      snap = JSON.parse(raw) as unknown;
    } catch {
      snap = null;
    }
  }
  if (snap && typeof snap === "object" && snap !== null) {
    const g = (snap as { general?: { cover_image?: string } }).general;
    if (g && typeof g === "object") {
      const c = trimStr((g as { cover_image?: string }).cover_image);
      if (c) return c;
    }
  }

  return "";
}

const PLACEHOLDER = "/placeholder-course.jpg";

function normalizePublicStorageUrl(url: string): string {
  return url
    .replace("/object/public/playmakers/", "/object/public/Playmakers/")
    .replace("/object/public/home/", "/object/public/Home/");
}

/**
 * Transforme la valeur brute (URL absolue, chemin local, ou clé storage) en URL affichable.
 * Fallbacks optionnels (pas `cover`) : hero, image, etc.
 */
export function coverRawToDisplayUrl(
  args: { raw: string; hero_image_url?: string | null; image_url?: string | null; image?: string | null; cover_url?: string | null },
): string {
  const primary = String(args.raw ?? "").trim();
  const chain = [primary, args.hero_image_url, args.image_url, args.cover_url, args.image]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .find((s) => s.length > 0);
  if (!chain) return PLACEHOLDER;
  if (chain.startsWith("/") && /\.(jpe?g|png|webp)$/i.test(chain)) return chain;
  if (/^https?:\/\//i.test(chain)) return normalizePublicStorageUrl(chain);
  return normalizePublicStorageUrl(
    `https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Home/${encodeURIComponent(chain.replace(/^\/+/, ""))}`,
  );
}
