import { nanoid } from "nanoid";

import {
  CourseBuilderChapter,
  CourseBuilderResource,
  CourseBuilderSection,
  CourseBuilderSnapshot,
  CourseBuilderSubchapter,
  CourseBuilderTest,
} from "@/types/course-builder";

const normalizeRichText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeRichText(item))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => {
        const normalized = normalizeRichText(val);
        if (!normalized) return "";
        const heading = key
          ? `### ${key
              .replace(/[_-]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .replace(/\b\w/g, (char) => char.toUpperCase())}`
          : "";
        return heading ? `${heading}\n${normalized}` : normalized;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return String(value);
};

const createSubchapter = (overrides?: Partial<CourseBuilderSubchapter>): CourseBuilderSubchapter => ({
  id: nanoid(),
  title: "Sous-chapitre",
  duration: "",
  type: "text",
  summary: "",
  content: "",
  ...overrides,
});

const createChapter = (overrides?: Partial<CourseBuilderChapter>): CourseBuilderChapter => ({
  id: nanoid(),
  title: "Chapitre",
  duration: "",
  type: "video",
  summary: "",
  content: "",
  subchapters: [],
  ...overrides,
});

const createSection = (overrides?: Partial<CourseBuilderSection>): CourseBuilderSection => ({
  id: nanoid(),
  title: "Nouvelle section",
  description: "Décrivez le rôle de cette section.",
  chapters: [],
  ...overrides,
});

const createResource = (overrides?: Partial<CourseBuilderResource>): CourseBuilderResource => ({
  id: nanoid(),
  title: "Nouvelle ressource",
  type: "pdf",
  url: "",
  ...overrides,
});

const createTest = (overrides?: Partial<CourseBuilderTest>): CourseBuilderTest => ({
  id: nanoid(),
  title: "Nouvel assessment",
  type: "quiz",
  url: "",
  ...overrides,
});

const baseSnapshot: CourseBuilderSnapshot = {
  general: {
    title: "NeuroDesign intensif",
    subtitle: "Déclenchez l'engagement émotionnel et boostez la mémorisation",
    description: "",
    category: "Masterclass",
    level: "Intermédiaire",
    duration: "6 semaines",
    heroImage: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4",
    badgeLabel: "Badge Neuro Insights",
    badgeDescription: "Atteste de votre maîtrise des leviers attentionnels et émotionnels.",
    badgeImage: "",
    price: 0,
  },
  objectives: [
    "Cerner les mécanismes attentionnels à activer en début de parcours",
    "Construire des rituels émotionnels pour maintenir l'engagement",
    "Structurer une progression blended haute intensité",
  ],
  skills: ["Conception pédagogique", "Expérience apprenante", "Analyse émotionnelle"],
  sections: [
    createSection({
      title: "Section 1 — Activer l'attention",
      description: "Cadrez vos intentions pédagogiques et déclenchez un lancement immersif.",
      chapters: [
        createChapter({
          title: "Chapitre 1 — Rituel de lancement immersif",
          duration: "12 min",
          type: "video",
          summary: "Une capsule vidéo pour installer l'énergie et les bonnes postures cognitives.",
          content:
            "# Rituel de lancement\n\nObjectifs :\n- Préparer le cerveau à l'apprentissage intensif\n- Activer la curiosité émotionnelle\n\nScript vidéo, points clés et call-to-action sont fournis ici.",
          subchapters: [
            createSubchapter({
              title: "Micro-rituel — Activation attentionnelle",
              duration: "7 min",
              type: "video",
              summary: "Déclenchez la concentration en moins de 3 minutes avec un rituel multisensoriel.",
              content:
                "## Contenu vidéo\n- Introduction en voix off\n- Visual ancrage chromatique\n- Plan d'action immédiat\n\nIncluez vos slides, séquencés par minute.",
            }),
            createSubchapter({
              title: "Support audio — Préparation mentale",
              duration: "5 min",
              type: "audio",
              summary: "Audio immersif pour préparer les formateurs à incarner le rituel.",
              content:
                "## Checklist audio\n1. Respiration guidée\n2. Visualisation\n3. Intention pédagogique\n\nAjoutez les marqueurs temporels de votre fichier audio.",
            }),
          ],
        }),
        createChapter({
          title: "Chapitre 2 — Concevoir un scénario attentionnel",
          duration: "45 min",
          type: "document",
          summary: "Un guide structuré pour concevoir un scénario d'ouverture irrésistible.",
          content:
            "## Template scénario\n- Hook émotionnel\n- Démonstration\n- Projection\n- Décryptage neuroscientifique\n\nIncluez ici votre template téléchargeable ou les consignes détaillées.",
          subchapters: [
            createSubchapter({
              title: "Workshop guidé",
              duration: "30 min",
              type: "document",
              summary: "Un atelier clef-en-main pour co-construire le lancement avec vos formateurs.",
              content:
                "### Déroulé atelier\n- Mise en situation\n- Travail en binôme\n- Synthèse rapide\n\nPrécisez vos ressources (Miro, slides, fiches).",
            }),
          ],
        }),
      ],
    }),
    createSection({
      title: "Section 2 — Ancrer & mémoriser",
      description: "Installez des traces mémorielles durables et multipliez les occasions de réactivation.",
      chapters: [
        createChapter({
          title: "Chapitre 3 — Séquence de consolidation",
          duration: "18 min",
          type: "text",
          summary: "Un protocole pas-à-pas pour solidifier les apprentissages clés.",
          content:
            "## Séquence\n1. Rappel express\n2. Questionnement\n3. Projection\n\nAjoutez vos scripts, exemples et ressources associées.",
          subchapters: [
            createSubchapter({
              title: "Ressource documentaire",
              duration: "PDF",
              type: "document",
              summary: "Fiche synthèse à remettre aux apprenants en fin de séquence.",
              content:
                "### Fiche à fournir\n- Résumé\n- Schéma\n- Call-to-action\n\nUploadez votre PDF ou décrivez son contenu.",
            }),
          ],
        }),
      ],
    }),
  ],
  resources: [
    createResource({
      title: "Kit de rituels émotionnels",
      type: "pdf",
      url: "https://example.com/kit",
    }),
  ],
  tests: [
    createTest({
      title: "NeuroCheck — auto-évaluation",
      type: "auto-diagnostic",
      url: "https://example.com/test",
    }),
  ],
};

const deepCloneSnapshot = (snapshot: CourseBuilderSnapshot): CourseBuilderSnapshot => ({
  general: { ...snapshot.general },
  objectives: [...snapshot.objectives],
  skills: [...snapshot.skills],
  sections: snapshot.sections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({
      ...chapter,
      summary: normalizeRichText(chapter.summary),
      content: normalizeRichText(chapter.content),
      subchapters: chapter.subchapters.map((sub) => ({
        ...sub,
        summary: normalizeRichText(sub.summary),
        content: normalizeRichText(sub.content),
      })),
    })),
  })),
  resources: snapshot.resources.map((resource) => ({ ...resource })),
  tests: snapshot.tests.map((test) => ({ ...test })),
});

export const createEmptyCourseBuilderSnapshot = (): CourseBuilderSnapshot => ({
  general: {
    title: "",
    subtitle: "",
    description: "",
    category: "",
    level: "",
    duration: "",
    heroImage: "",
    trailerUrl: "",
    badgeLabel: "",
    badgeDescription: "",
    badgeImage: "",
    price: 0,
  },
  objectives: [],
  skills: [],
  sections: [],
  resources: [],
  tests: [],
});

export const createDefaultCourseBuilderSnapshot = (): CourseBuilderSnapshot => deepCloneSnapshot(baseSnapshot);

export const cloneCourseBuilderSnapshot = (snapshot: CourseBuilderSnapshot): CourseBuilderSnapshot =>
  deepCloneSnapshot(snapshot);

export const courseBuilderFallbackSnapshot = (): CourseBuilderSnapshot => createDefaultCourseBuilderSnapshot();



