/** Le builder conserve les blocs supprimés (deleted_at) pour l'annulation. Les lectures apprenant les ignorent. */
export function isCourseNodeVisible(node: { deleted_at?: string | null } | null | undefined) {
  return !node?.deleted_at;
}
