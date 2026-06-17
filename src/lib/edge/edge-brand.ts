/** Tokens visuels EDGE — bleu Revolut, rouge accent uniquement */
export const EDGE_COLORS = {
  bgDeep: "#0a0a0d",
  bgShell: "#0a0a0f",
  blueAccent: "#3D7BFF",
  blueDim: "rgba(61,123,255,0.08)",
  blueDimBorder: "rgba(61,123,255,0.35)",
  redAccent: "#FF3B30",
} as const;

export const EDGE_GRADIENTS = {
  hero: "linear-gradient(135deg, #2451d6 0%, #14245c 55%, #0a0a0d 100%)",
  heroHalo:
    "radial-gradient(circle at 85% 15%, rgba(110,150,255,0.45) 0%, transparent 70%)",
  progress: "linear-gradient(90deg, #3D7BFF 0%, #14245c 100%)",
  passwordBg:
    "radial-gradient(120% 55% at 50% 0%, rgba(61,123,255,0.42) 0%, rgba(36,81,214,0.22) 32%, transparent 58%), linear-gradient(180deg, #0f1a3d 0%, #0a1028 28%, #0a0a0d 55%, #050508 100%)",
  mailOverlayBg:
    "linear-gradient(180deg, #1a3a8f 0%, #0d1f52 38%, #0a0a0d 100%)",
  mailOverlayHalo:
    "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(61,123,255,0.45) 0%, transparent 62%)",
  introHalo:
    "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(61,123,255,0.38) 0%, transparent 58%)",
  dashboardHero:
    "linear-gradient(135deg, #1a3a8f 0%, #0d1f52 40%, #0a0a0d 100%)",
  /** Halo page dashboard — moins intense que la carte cockpit */
  dashboardPageBg:
    "radial-gradient(ellipse 100% 60% at 25% -15%, rgba(45,90,230,0.45), transparent 65%), radial-gradient(ellipse 80% 50% at 105% 20%, rgba(61,123,255,0.25), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(36,81,214,0.15), transparent 60%), #0a0a0d",
} as const;
