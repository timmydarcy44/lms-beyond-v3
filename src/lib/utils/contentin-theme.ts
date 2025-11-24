/**
 * Utilitaires pour le thème beige/marron/doré de contentin.cabinet@gmail.com
 */

export const CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export const CONTENTIN_COLORS = {
  // Beige
  beigeLight: "#F5F5DC", // Background principal
  beigeMedium: "#E8E8D3", // Surfaces
  beigeDark: "#D2B48C", // Bordures
  
  // Marron
  brownLight: "#A0522D", // Texte principal
  brownDark: "#8B4513", // Texte secondaire
  brownDarker: "#654321", // Texte très foncé
  
  // Doré
  gold: "#D4AF37", // Accents, liens actifs
  goldLight: "#F4A460", // Hover
  goldDark: "#B8860B", // États actifs
};

/**
 * Vérifie si l'email correspond à contentin.cabinet@gmail.com
 */
export function isContentinEmail(email: string | null | undefined): boolean {
  return email === CONTENTIN_EMAIL;
}

/**
 * Retourne les classes CSS pour le thème contentin
 */
export function getContentinThemeClasses(isContentin: boolean) {
  if (!isContentin) {
    return {
      background: "bg-white",
      backgroundSecondary: "bg-gray-50",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      border: "border-gray-200",
      accent: "text-blue-600",
      accentHover: "hover:text-blue-700",
      accentBg: "bg-blue-600",
      accentBgHover: "hover:bg-blue-700",
    };
  }

  return {
    background: "bg-[#F5F5DC]",
    backgroundSecondary: "bg-[#E8E8D3]",
    text: "text-[#8B4513]",
    textSecondary: "text-[#A0522D]",
    border: "border-[#D2B48C]",
    accent: "text-[#D4AF37]",
    accentHover: "hover:text-[#F4A460]",
    accentBg: "bg-[#D4AF37]",
    accentBgHover: "hover:bg-[#F4A460]",
  };
}




