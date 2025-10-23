'use server';

// --- Création : renvoient un objet avec id/title/position si nécessaire
export async function createSection(formationId: string, title: string) {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-sec`) as string,
    title,
    position: null as number | null,
  };
}

export async function createChapter(sectionId: string, title: string) {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-chap`) as string,
    title,
    position: null as number | null,
  };
}

export async function createSubchapter(chapterId: string, title: string) {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-sub`) as string,
    title,
    position: null as number | null,
  };
}

// --- Renommage / suppression : ne renvoient rien (void)
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

// --- Déjà utilisés par d'autres composants
export async function assignContentAction(..._args: any[]): Promise<void> { /* no-op */ }
export async function updateFormationReadingMode(..._args: any[]): Promise<void> { /* no-op */ }
