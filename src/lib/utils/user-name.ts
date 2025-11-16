/**
 * Extrait le prénom depuis full_name ou email
 * @param fullNameOrEmail - Le nom complet de l'utilisateur (ex: "John Doe") ou l'email
 * @returns Le prénom ou la partie avant @ de l'email
 */
export function getUserName(fullNameOrEmail: string | null | undefined): string {
  if (!fullNameOrEmail) {
    return "Utilisateur";
  }

  // Si c'est un email, extraire la partie avant @
  if (fullNameOrEmail.includes("@")) {
    const emailPart = fullNameOrEmail.split("@")[0];
    // Supprimer les points et underscores pour un affichage plus propre
    return emailPart.split(/[._]/)[0];
  }

  // Si c'est un nom complet, extraire le premier mot (prénom)
  const firstName = fullNameOrEmail.trim().split(/\s+/)[0];
  if (firstName) {
    return firstName;
  }

  return "Utilisateur";
}

/**
 * Extrait le prénom depuis full_name ou email (alias pour compatibilité)
 */
export function getFirstName(fullName: string | null, email: string | null): string {
  return getUserName(fullName || email || null);
}
