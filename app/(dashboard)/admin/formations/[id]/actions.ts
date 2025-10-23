'use server';

// --- Création : renvoient un objet avec id/title/position (number)
export async function createSection(formationId: string, title: string) {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-sec`) as string,
    title,
    position: 0 as number, // ✅ number, plus "null"
  };
}

export async function createChapter(sectionId: string, title: string) {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-chap`) as string,
    title,
    position: 0 as number, // ✅ number
  };
}

export async function createSubchapter(chapterId: string, title: string) {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-sub`) as string,
    title,
    position: 0 as number, // ✅ number
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
