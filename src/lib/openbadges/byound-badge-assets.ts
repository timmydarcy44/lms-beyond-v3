import { PROFIL_COMPORTEMENTAL_BADGE_ID } from "@/lib/openbadges/diagnostic-commercial-badge";

/** Badge doré « Connaissance de soi » — profil croisé (3 tests complets). */
export const BYOUND_CONNAISSANCE_DE_SOI_BADGE_IMAGE_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/Badge%20dore%20isole%20sur%20fond%20transparent.png";

export function resolveByoundPublicBadgeImageUrl(badge: {
  id: string;
  name: string;
  imageUrl: string | null;
}): string | null {
  if (badge.id === PROFIL_COMPORTEMENTAL_BADGE_ID) {
    return BYOUND_CONNAISSANCE_DE_SOI_BADGE_IMAGE_URL;
  }
  if (/connaissance de soi|profil comportemental/i.test(badge.name)) {
    return BYOUND_CONNAISSANCE_DE_SOI_BADGE_IMAGE_URL;
  }
  return badge.imageUrl;
}
