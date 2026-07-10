/**
 * Thème /super Jessica Contentin — blanc & noir, accents indigo/violet.
 */

export const CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export const CONTENTIN_COLORS = {
  bg: "#FFFFFF",
  bgMuted: "#F5F5F7",
  bgSubtle: "#FAFAFA",
  text: "#000000",
  textSecondary: "#6E6E73",
  border: "rgba(0,0,0,0.08)",
  primary: "#5B21B6",
  primaryLight: "#EDE9FE",
  primaryDark: "#1E1B4B",
  accent: "#6366F1",
};

export function isContentinEmail(email: string | null | undefined): boolean {
  return email === CONTENTIN_EMAIL;
}

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
    background: "bg-white",
    backgroundSecondary: "bg-neutral-50",
    text: "text-black",
    textSecondary: "text-neutral-500",
    border: "border-black/[0.08]",
    accent: "text-indigo-600",
    accentHover: "hover:text-violet-700",
    accentBg: "bg-gradient-to-br from-[#0B1426] via-[#1E1B4B] to-[#5B21B6]",
    accentBgHover: "hover:brightness-110",
  };
}
