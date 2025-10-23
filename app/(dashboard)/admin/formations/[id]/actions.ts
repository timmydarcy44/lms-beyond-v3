'use server';

/**
 * Stubs temporaires pour remettre le build au vert.
 * On branchera la vraie logique Supabase + multi-org ensuite.
 */

type Ok<T = unknown> = { ok: true; data?: T };
type Fail = { ok: false; error: string };
type Res<T = unknown> = Promise<Ok<T> | Fail>;

// Création
export async function createSection(_args: { org: string; formationId: string; title: string }): Res<{ id: string }> {
  return { ok: true, data: { id: crypto.randomUUID() } };
}
export async function createChapter(_args: { org: string; sectionId: string; title: string }): Res<{ id: string }> {
  return { ok: true, data: { id: crypto.randomUUID() } };
}
export async function createSubchapter(_args: { org: string; chapterId: string; title: string }): Res<{ id: string }> {
  return { ok: true, data: { id: crypto.randomUUID() } };
}

// Edition / renommage / suppression
export async function renameNode(_args: { org: string; id: string; title: string }): Res {
  return { ok: true };
}
export async function deleteNode(_args: { org: string; id: string; type: 'section' | 'chapter' | 'subchapter' }): Res {
  return { ok: true };
}

// Réordonnancement
export async function reorderSections(_args: { org: string; formationId: string; order: string[] }): Res {
  return { ok: true };
}
export async function reorderChapters(_args: { org: string; sectionId: string; order: string[] }): Res {
  return { ok: true };
}
export async function reorderSubchapters(_args: { org: string; chapterId: string; order: string[] }): Res {
  return { ok: true };
}

// Ceux déjà demandés par d'autres composants
export async function assignContentAction(..._args: any[]): Res {
  return { ok: true };
}
export async function updateFormationReadingMode(..._args: any[]): Res {
  return { ok: true };
}