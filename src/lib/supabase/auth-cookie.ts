/** Session glissante : le cookie est réécrit à chaque rafraîchissement, pour 30 jours. */
export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === "production",
};
