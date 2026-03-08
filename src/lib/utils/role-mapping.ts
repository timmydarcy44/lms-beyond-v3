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
  | "ecole"
  | "club"
  | "partenaire"
  | "demo";
export type DatabaseRole =
  | "instructor"
  | "student"
  | "admin"
  | "tutor"
  | "entreprise"
  | "ecole"
  | "club"
  | "partenaire"
  | "apprenant"
  | "PARTICULIER"
  | "mentor"
  | "demo";

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
  if (role === "entreprise") {
    return "entreprise";
  }
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
    ecole: "ecole",
    club: "club",
    partenaire: "partenaire",
    apprenant: "apprenant",
    demo: "demo",
    mentor: "admin",
    PARTICULIER: "apprenant",
  };
  return mapping[role] ?? "apprenant";
}

/**
 * Vérifie si un rôle de DB correspond à un rôle frontend
 */
export function roleMatches(backendRole: DatabaseRole, frontendRole: FrontendRole): boolean {
  return frontendToDatabaseRole(frontendRole) === backendRole;
}










