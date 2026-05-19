/**
 * Liens EDGE / Beyond Connect depuis le dashboard apprenant LMS.
 * Les URLs externes peuvent être surchargées en prod via variables NEXT_PUBLIC_*.
 */
import { getBeyondConnectBaseUrl } from "@/lib/beyond-connect/utils";
import { EDGE_LAB_ONLINE_CATALOG_HREF } from "@/lib/galaxy-branding";

const env = (key: string) => process.env[key]?.trim();

const beyondConnectOrigin = (): string =>
  getBeyondConnectBaseUrl().replace(/\/$/, "");

export { EDGE_LAB_ONLINE_CATALOG_HREF };

/** Hub CV / badges côté Beyond Connect (session dédiée). */
export const EDGE_CONNECT_APP_BASE_HREF = `${beyondConnectOrigin()}/beyond-connect-app`;

/** Parcours e-learning & suivi LMS (EDGE Lab galaxy). */
export const EDGE_MY_PROGRESS_HREF =
  env("NEXT_PUBLIC_EDGE_MY_PROGRESS_URL") ?? EDGE_LAB_ONLINE_CATALOG_HREF;

/** Résultats lab / évaluations Beyond Connect (surcharge sinon hub app). */
export const EDGE_LAB_MY_RESULTS_HREF =
  env("NEXT_PUBLIC_EDGE_LAB_MY_RESULTS_URL") ?? EDGE_CONNECT_APP_BASE_HREF;

/** Certifications Beyond Connect ou page profil hub. */
export const EDGE_MY_BADGES_HREF =
  env("NEXT_PUBLIC_EDGE_MY_BADGES_URL") ?? `${beyondConnectOrigin()}/beyond-connect-app/profile`;
