"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";

import {
  cloneCourseBuilderSnapshot,
  createEmptyCourseBuilderSnapshot,
} from "@/data/course-builder-fallback";
import {
  CourseBuilderChapter,
  CourseBuilderSnapshot,
  CourseBuilderSection,
  CourseBuilderSubchapter,
} from "@/types/course-builder";

export type BuilderSelection =
  | { type: "chapter"; sectionId: string; chapterId: string }
  | { type: "subchapter"; sectionId: string; chapterId: string; subchapterId: string }
  | null;

type CourseBuilderState = {
  snapshot: CourseBuilderSnapshot;
  selection: BuilderSelection;
  updateGeneral: (payload: Partial<CourseBuilderSnapshot["general"]>) => void;
  addObjective: (value: string) => void;
  removeObjective: (value: string) => void;
  addSkill: (value: string) => void;
  removeSkill: (value: string) => void;
  addSection: () => void;
  updateSection: (sectionId: string, payload: Partial<Omit<CourseBuilderSection, "id" | "chapters">>) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (activeId: string, overId: string) => void;
  addChapter: (sectionId: string) => void;
  updateChapter: (
    sectionId: string,
    chapterId: string,
    payload: Partial<Omit<CourseBuilderChapter, "id" | "subchapters">>,
  ) => void;
  removeChapter: (sectionId: string, chapterId: string) => void;
  reorderChapters: (sectionId: string, activeId: string, overId: string) => void;
  moveChapter: (
    fromSectionId: string,
    toSectionId: string,
    chapterId: string,
    targetIndex?: number,
  ) => void;
  addSubchapter: (sectionId: string, chapterId: string) => void;
  updateSubchapter: (
    sectionId: string,
    chapterId: string,
    subchapterId: string,
    payload: Partial<Omit<CourseBuilderSubchapter, "id">>,
  ) => void;
  removeSubchapter: (sectionId: string, chapterId: string, subchapterId: string) => void;
  reorderSubchapters: (sectionId: string, chapterId: string, activeId: string, overId: string) => void;
  moveSubchapter: (
    fromSectionId: string,
    fromChapterId: string,
    toSectionId: string,
    toChapterId: string,
    subchapterId: string,
    targetIndex?: number,
  ) => void;
  selectChapter: (sectionId: string, chapterId: string) => void;
  selectSubchapter: (sectionId: string, chapterId: string, subchapterId: string) => void;
  clearSelection: () => void;
  addResource: () => void;
  updateResource: (resourceId: string, payload: Partial<CourseBuilderSnapshot["resources"][number]>) => void;
  removeResource: (resourceId: string) => void;
  addTest: () => void;
  updateTest: (testId: string, payload: Partial<CourseBuilderSnapshot["tests"][number]>) => void;
  removeTest: (testId: string) => void;
  reset: () => void;
  hydrateFromSnapshot: (snapshot: CourseBuilderSnapshot) => void;
  getSnapshot: () => CourseBuilderSnapshot;
};

const findFirstSelectableNode = (sections: CourseBuilderSection[]): BuilderSelection => {
  for (const section of sections) {
    const firstChapter = section.chapters[0];
    if (firstChapter) {
      return { type: "chapter", sectionId: section.id, chapterId: firstChapter.id };
    }
  }
  return null;
};

const ensureSelection = (selection: BuilderSelection, sections: CourseBuilderSection[]): BuilderSelection => {
  if (!selection) return findFirstSelectableNode(sections);
  const section = sections.find((item) => item.id === selection.sectionId);
  if (!section) return findFirstSelectableNode(sections);
  const chapter = section.chapters.find((item) => item.id === selection.chapterId);
  if (!chapter) return findFirstSelectableNode(sections);
  if (selection.type === "subchapter") {
    return chapter.subchapters.find((item) => item.id === selection.subchapterId)
      ? selection
      : findFirstSelectableNode(sections);
  }
  return selection;
};

const createInitialState = () => {
  const snapshot = createEmptyCourseBuilderSnapshot();
  const selection = findFirstSelectableNode(snapshot.sections);
  return { snapshot, selection };
};

export const useCourseBuilder = create<CourseBuilderState>((set, get) => ({
  ...createInitialState(),
  updateGeneral: (payload) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        general: {
          ...state.snapshot.general,
          ...payload,
        },
      },
    })),
  addObjective: (value) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        objectives: value.trim() ? [...state.snapshot.objectives, value.trim()] : state.snapshot.objectives,
      },
    })),
  removeObjective: (value) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        objectives: state.snapshot.objectives.filter((item) => item !== value),
      },
    })),
  addSkill: (value) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        skills: value.trim() ? [...state.snapshot.skills, value.trim()] : state.snapshot.skills,
      },
    })),
  removeSkill: (value) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        skills: state.snapshot.skills.filter((item) => item !== value),
      },
    })),
  addSection: () =>
    set((state) => {
      const newSection: CourseBuilderSection = {
        id: nanoid(),
        title: "Nouvelle section",
        description: "Décrivez le rôle de cette section dans votre parcours.",
        chapters: [],
      };
      const sections = [...state.snapshot.sections, newSection];
      return {
        snapshot: {
          ...state.snapshot,
          sections,
        },
        selection: ensureSelection(state.selection, sections),
      };
    }),
  updateSection: (sectionId, payload) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        sections: state.snapshot.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                ...payload,
              }
            : section,
        ),
      },
    })),
  removeSection: (sectionId) =>
    set((state) => {
      const sections = state.snapshot.sections.filter((section) => section.id !== sectionId);
      return {
        snapshot: {
          ...state.snapshot,
          sections,
        },
        selection: ensureSelection(state.selection, sections),
      };
    }),
  reorderSections: (activeId, overId) =>
    set((state) => {
      if (activeId === overId) return state;
      const sections = [...state.snapshot.sections];
      const activeIndex = sections.findIndex((section) => section.id === activeId);
      const overIndex = sections.findIndex((section) => section.id === overId);
      if (activeIndex === -1 || overIndex === -1) return state;
      const [moved] = sections.splice(activeIndex, 1);
      sections.splice(overIndex, 0, moved);
      return {
        snapshot: {
          ...state.snapshot,
          sections,
        },
        selection: ensureSelection(state.selection, sections),
      };
    }),
  addChapter: (sectionId) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        sections: state.snapshot.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                chapters: [
                  ...section.chapters,
                  {
                    id: nanoid(),
                    title: "Nouveau chapitre",
                    duration: "",
                    type: "video",
                    summary: "Décrivez le résultat pédagogique attendu.",
                    content: "",
                    subchapters: [],
                  },
                ],
              }
            : section,
        ),
      },
    })),
  updateChapter: (sectionId, chapterId, payload) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        sections: state.snapshot.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                chapters: section.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? {
                        ...chapter,
                        ...payload,
                      }
                    : chapter,
                ),
              }
            : section,
        ),
      },
    })),
  removeChapter: (sectionId, chapterId) =>
    set((state) => {
      const sections = state.snapshot.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              chapters: section.chapters.filter((chapter) => chapter.id !== chapterId),
            }
          : section,
      );
      return {
        snapshot: {
          ...state.snapshot,
          sections,
        },
        selection: ensureSelection(state.selection, sections),
      };
    }),
  reorderChapters: (sectionId, activeId, overId) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        sections: state.snapshot.sections.map((section) => {
          if (section.id !== sectionId || activeId === overId) return section;
          const chapters = [...section.chapters];
          const activeIndex = chapters.findIndex((chapter) => chapter.id === activeId);
          const overIndex = chapters.findIndex((chapter) => chapter.id === overId);
          if (activeIndex === -1 || overIndex === -1) return section;
          const [moved] = chapters.splice(activeIndex, 1);
          chapters.splice(overIndex, 0, moved);
          return {
            ...section,
            chapters,
          };
        }),
      },
      selection: ensureSelection(state.selection, state.snapshot.sections),
    })),
  moveChapter: (fromSectionId, toSectionId, chapterId, targetIndex) =>
    set((state) => {
      const sections = state.snapshot.sections.map((section) => ({
        ...section,
        chapters: section.chapters.map((chapter) => ({
          ...chapter,
          subchapters: chapter.subchapters.map((sub) => ({ ...sub })),
        })),
      }));

      const fromSection = sections.find((section) => section.id === fromSectionId);
      const toSection = sections.find((section) => section.id === toSectionId);
      if (!fromSection || !toSection) {
        return {
          snapshot: { ...state.snapshot },
          selection: ensureSelection(state.selection, sections),
        };
      }

      const currentIndex = fromSection.chapters.findIndex((chapter) => chapter.id === chapterId);
      if (currentIndex === -1) {
        return {
          snapshot: { ...state.snapshot },
          selection: ensureSelection(state.selection, sections),
        };
      }

      const [moved] = fromSection.chapters.splice(currentIndex, 1);
      if (!moved) {
        return {
          snapshot: { ...state.snapshot },
          selection: ensureSelection(state.selection, sections),
        };
      }

      let insertIndex =
        typeof targetIndex === "number"
          ? Math.max(0, Math.min(targetIndex, toSection.chapters.length))
          : toSection.chapters.length;

      if (fromSectionId === toSectionId && insertIndex > currentIndex) {
        insertIndex -= 1;
      }

      toSection.chapters.splice(insertIndex, 0, moved);

      return {
        snapshot: {
          ...state.snapshot,
          sections,
        },
        selection: ensureSelection(state.selection, sections),
      };
    }),
  addSubchapter: (sectionId, chapterId) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        sections: state.snapshot.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                chapters: section.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? {
                        ...chapter,
                        subchapters: [
                          ...chapter.subchapters,
                          {
                            id: nanoid(),
                            title: "Nouveau sous-chapitre",
                            duration: "",
                            type: "text",
                            summary: "Précisez la promesse pédagogique.",
                            content: "",
                          },
                        ],
                      }
                    : chapter,
                ),
              }
            : section,
        ),
      },
    })),
  updateSubchapter: (sectionId, chapterId, subchapterId, payload) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        sections: state.snapshot.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                chapters: section.chapters.map((chapter) =>
                  chapter.id === chapterId
                    ? {
                        ...chapter,
                        subchapters: chapter.subchapters.map((subchapter) =>
                          subchapter.id === subchapterId
                            ? {
                                ...subchapter,
                                ...payload,
                              }
                            : subchapter,
                        ),
                      }
                    : chapter,
                ),
              }
            : section,
        ),
      },
    })),
  removeSubchapter: (sectionId, chapterId, subchapterId) =>
    set((state) => {
      const sections = state.snapshot.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              chapters: section.chapters.map((chapter) =>
                chapter.id === chapterId
                  ? {
                      ...chapter,
                      subchapters: chapter.subchapters.filter((subchapter) => subchapter.id !== subchapterId),
                    }
                  : chapter,
              ),
            }
          : section,
      );
      return {
        snapshot: {
          ...state.snapshot,
          sections,
        },
        selection: ensureSelection(state.selection, sections),
      };
    }),
  reorderSubchapters: (sectionId, chapterId, activeId, overId) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        sections: state.snapshot.sections.map((section) => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            chapters: section.chapters.map((chapter) => {
              if (chapter.id !== chapterId || activeId === overId) return chapter;
              const subchapters = [...chapter.subchapters];
              const activeIndex = subchapters.findIndex((sub) => sub.id === activeId);
              const overIndex = subchapters.findIndex((sub) => sub.id === overId);
              if (activeIndex === -1 || overIndex === -1) return chapter;
              const [moved] = subchapters.splice(activeIndex, 1);
              subchapters.splice(overIndex, 0, moved);
              return {
                ...chapter,
                subchapters,
              };
            }),
          };
        }),
      },
      selection: ensureSelection(state.selection, state.snapshot.sections),
    })),
  moveSubchapter: (fromSectionId, fromChapterId, toSectionId, toChapterId, subchapterId, targetIndex) =>
    set((state) => {
      const sections = state.snapshot.sections.map((section) => ({
        ...section,
        chapters: section.chapters.map((chapter) => ({
          ...chapter,
          subchapters: chapter.subchapters.map((sub) => ({ ...sub })),
        })),
      }));

      const fromSection = sections.find((section) => section.id === fromSectionId);
      const toSection = sections.find((section) => section.id === toSectionId);
      if (!fromSection || !toSection) {
        return {
          snapshot: { ...state.snapshot },
          selection: ensureSelection(state.selection, sections),
        };
      }

      const fromChapter = fromSection.chapters.find((chapter) => chapter.id === fromChapterId);
      const toChapter = toSection.chapters.find((chapter) => chapter.id === toChapterId);
      if (!fromChapter || !toChapter) {
        return {
          snapshot: { ...state.snapshot },
          selection: ensureSelection(state.selection, sections),
        };
      }

      const currentIndex = fromChapter.subchapters.findIndex((sub) => sub.id === subchapterId);
      if (currentIndex === -1) {
        return {
          snapshot: { ...state.snapshot },
          selection: ensureSelection(state.selection, sections),
        };
      }

      const [moved] = fromChapter.subchapters.splice(currentIndex, 1);
      if (!moved) {
        return {
          snapshot: { ...state.snapshot },
          selection: ensureSelection(state.selection, sections),
        };
      }

      let insertIndex =
        typeof targetIndex === "number"
          ? Math.max(0, Math.min(targetIndex, toChapter.subchapters.length))
          : toChapter.subchapters.length;

      if (
        fromSectionId === toSectionId &&
        fromChapterId === toChapterId &&
        insertIndex > currentIndex
      ) {
        insertIndex -= 1;
      }

      toChapter.subchapters.splice(insertIndex, 0, moved);

      return {
        snapshot: {
          ...state.snapshot,
          sections,
        },
        selection: ensureSelection(state.selection, sections),
      };
    }),
  selectChapter: (sectionId, chapterId) =>
    set(() => ({
      selection: { type: "chapter", sectionId, chapterId },
    })),
  selectSubchapter: (sectionId, chapterId, subchapterId) =>
    set(() => ({
      selection: { type: "subchapter", sectionId, chapterId, subchapterId },
    })),
  clearSelection: () => set(() => ({ selection: null })),
  addResource: () =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        resources: [
          ...state.snapshot.resources,
          { id: nanoid(), title: "Nouvelle ressource", type: "pdf", url: "" },
        ],
      },
    })),
  updateResource: (resourceId, payload) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        resources: state.snapshot.resources.map((resource) =>
          resource.id === resourceId
            ? {
                ...resource,
                ...payload,
              }
            : resource,
        ),
      },
    })),
  removeResource: (resourceId) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        resources: state.snapshot.resources.filter((resource) => resource.id !== resourceId),
      },
    })),
  addTest: () =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        tests: [...state.snapshot.tests, { id: nanoid(), title: "Nouvel assessment", type: "quiz", url: "" }],
      },
    })),
  updateTest: (testId, payload) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        tests: state.snapshot.tests.map((test) =>
          test.id === testId
            ? {
                ...test,
                ...payload,
              }
            : test,
        ),
      },
    })),
  removeTest: (testId) =>
    set((state) => ({
      snapshot: {
        ...state.snapshot,
        tests: state.snapshot.tests.filter((test) => test.id !== testId),
      },
    })),
  reset: () => set(createInitialState()),
  hydrateFromSnapshot: (snapshot) =>
    set(() => {
      const cloned = cloneCourseBuilderSnapshot(snapshot);
      return {
        snapshot: cloned,
        selection: findFirstSelectableNode(cloned.sections),
      };
    }),
  getSnapshot: () => cloneCourseBuilderSnapshot(get().snapshot),
}));


