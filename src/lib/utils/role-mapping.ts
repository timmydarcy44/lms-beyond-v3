/**
 * Mapping entre les rôles utilisés dans le frontend (français)
 * et les rôles stockés dans la base de données (anglais)
 */

export type FrontendRole =
  | "formateur"
  | "apprenant"
  | "admin"
  | "tuteur"
  | "entreprise"
  | "admin_hr"
  | "ecole"
  | "club"
  | "partenaire"
  | "demo"
  | "praticien"
  | "expert";
export type DatabaseRole =
  | "instructor"
  | "student"
  | "admin"
  | "tutor"
  | "entreprise"
  | "admin_hr"
  | "ecole"
  | "club"
  | "partenaire"
  | "apprenant"
  | "PARTICULIER"
  | "mentor"
  | "demo"
  | "praticien_bct"
  | "expert"
  | "manager";

/**
 * Convertit un rôle du frontend vers la base de données
 */
export function frontendToDatabaseRole(role: FrontendRole): DatabaseRole {
  const mapping: Record<FrontendRole, DatabaseRole> = {
    formateur: "instructor",
    apprenant: "student",
    admin: "admin",
    tuteur: "tutor",
    entreprise: "entreprise",
    admin_hr: "admin_hr",
    ecole: "ecole",
    club: "club",
    partenaire: "partenaire",
    demo: "demo",
  };
  return mapping[role] ?? "student";
}

/**
 * Convertit un rôle de la base de données vers le frontend
 */
export function databaseToFrontendRole(role: DatabaseRole): FrontendRole {
  if (role === "praticien_bct" || role === "praticien") return "praticien";
  if (role === "expert") return "expert";
  if (role === "manager") return "entreprise";
  if (role === "entreprise" || role === "admin_hr") return "entreprise";
  if (role === "ecole") {
    return "ecole";
  }
  if (role === "apprenant") {
    return "apprenant";
  }
  if (role === "club") {
    return "club";
  }
  if (role === "partenaire") {
    return "partenaire";
  }
  if (role === "demo") {
    return "demo";
  }
  if (role === "PARTICULIER") {
    return "apprenant";
  }
  const mapping: Record<DatabaseRole, FrontendRole> = {
    instructor: "formateur",
    student: "apprenant",
    admin: "admin",
    tutor: "tuteur",
    entreprise: "entreprise",
    admin_hr: "entreprise",
    ecole: "ecole",
    club: "club",
    partenaire: "partenaire",
    apprenant: "apprenant",
    demo: "demo",
    mentor: "admin",
    PARTICULIER: "apprenant",
    praticien_bct: "praticien",
    expert: "expert",
    manager: "entreprise",
  };
  return mapping[role] ?? "apprenant";
}

/**
 * Vérifie si un rôle de DB correspond à un rôle frontend
 */
export function roleMatches(backendRole: DatabaseRole, frontendRole: FrontendRole): boolean {
  return frontendToDatabaseRole(frontendRole) === backendRole;
}










