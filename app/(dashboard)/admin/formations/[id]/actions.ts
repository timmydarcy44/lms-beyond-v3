'use server';

/**
 * ⚠️ Stubs temporaires pour faire passer le build.
 * On branchera ensuite la vraie logique côté serveur (Supabase).
 */

export async function assignContentAction(..._args: any[]): Promise<{ ok: boolean }> {
  // TODO: implémenter l'assignation réelle (items, learners, groups)
  return { ok: true };
}

export async function updateFormationReadingMode(..._args: any[]): Promise<{ ok: boolean }> {
  // TODO: implémenter la mise à jour réelle: formations.reading_mode
  return { ok: true };
}
