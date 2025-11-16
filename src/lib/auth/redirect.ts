import { DASHBOARD_ROUTES } from "@/lib/auth/routes";
import type { UserRole } from "@/types/database";

export const getDashboardRouteForRole = (role: UserRole) => {
  switch (role) {
    case "formateur":
      return DASHBOARD_ROUTES.formateur;
    case "apprenant":
      return DASHBOARD_ROUTES.apprenant;
    case "admin":
      return DASHBOARD_ROUTES.admin;
    case "tuteur":
      return DASHBOARD_ROUTES.tuteur;
    default:
      // Si le rôle est null ou non reconnu, rediriger vers formateur par défaut (plus logique pour un utilisateur connecté)
      console.warn(`[redirect] Role non reconnu: ${role}, redirection vers formateur par défaut`);
      return DASHBOARD_ROUTES.formateur;
  }
};



