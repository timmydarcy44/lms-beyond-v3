/**
 * Mapping entre les rôles utilisés dans le frontend (français)
 * et les rôles stockés dans la base de données (anglais)
 */

export type FrontendRole = "formateur" | "apprenant" | "admin" | "tuteur";
export type DatabaseRole = "instructor" | "student" | "admin" | "tutor";

/**
 * Convertit un rôle du frontend vers la base de données
 */
export function frontendToDatabaseRole(role: FrontendRole): DatabaseRole {
  const mapping: Record<FrontendRole, DatabaseRole> = {
    formateur: "instructor",
    apprenant: "student",
    admin: "admin",
    tuteur: "tutor",
  };
  return mapping[role] ?? "student";
}

/**
 * Convertit un rôle de la base de données vers le frontend
 */
export function databaseToFrontendRole(role: DatabaseRole): FrontendRole {
  const mapping: Record<DatabaseRole, FrontendRole> = {
    instructor: "formateur",
    student: "apprenant",
    admin: "admin",
    tutor: "tuteur",
  };
  return mapping[role] ?? "apprenant";
}

/**
 * Vérifie si un rôle de DB correspond à un rôle frontend
 */
export function roleMatches(backendRole: DatabaseRole, frontendRole: FrontendRole): boolean {
  return frontendToDatabaseRole(frontendRole) === backendRole;
}




