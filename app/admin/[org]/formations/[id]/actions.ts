'use server';

/**
 * Server actions pour la gestion des formations
 * Stubs compatibles avec les composants existants
 */

function uid(prefix: string) {
  const r = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`) as string;
  return `${prefix}-${r}`;
}

// --- Créations : renvoient un objet avec id, title et position:number
export async function createSection(formationId: string, title: string) {
  return { id: uid('sec'), title, position: 0 };
}

export async function createChapter(sectionId: string, title: string) {
  return { id: uid('chap'), title, position: 0 };
}

export async function createSubchapter(chapterId: string, title: string) {
  return { id: uid('sub'), title, position: 0 };
}

// --- Renommage / suppression : void
export async function renameNode(
  type: 'section' | 'chapter' | 'subchapter',
  id: string,
  title: string
): Promise<void> { /* no-op */ }

export async function deleteNode(
  type: 'section' | 'chapter' | 'subchapter',
  id: string
): Promise<void> { /* no-op */ }

// --- Réordonnancement : void
export async function reorderSections(formationId: string, order: string[]): Promise<void> { /* no-op */ }
export async function reorderChapters(sectionId: string, order: string[]): Promise<void> { /* no-op */ }
export async function reorderSubchapters(chapterId: string, order: string[]): Promise<void> { /* no-op */ }

// --- Déjà utilisées par d'autres composants
export async function assignContentAction(..._args: any[]): Promise<void> { /* no-op */ }
export async function updateFormationReadingMode(..._args: any[]): Promise<void> { /* no-op */ }
