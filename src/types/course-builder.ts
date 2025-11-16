export type BuilderContentType = "video" | "audio" | "document" | "text";

export type CourseBuilderSubchapter = {
  id: string;
  title: string;
  duration: string;
  type: BuilderContentType;
  summary?: string;
  content?: string;
};

export type CourseBuilderChapter = {
  id: string;
  title: string;
  duration: string;
  type: BuilderContentType;
  summary?: string;
  content?: string;
  subchapters: CourseBuilderSubchapter[];
};

export type CourseBuilderSection = {
  id: string;
  title: string;
  description?: string;
  chapters: CourseBuilderChapter[];
};

export type CourseBuilderResource = {
  id: string;
  title: string;
  type: "pdf" | "video" | "audio" | "document";
  url: string;
};

export type CourseBuilderTest = {
  id: string;
  title: string;
  type: "quiz" | "evaluation" | "auto-diagnostic";
  url: string;
};

export type CourseBuilderGeneralInfo = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  heroImage: string;
  trailerUrl: string;
  badgeLabel: string;
  badgeDescription: string;
  badgeImage?: string;
  target_audience?: "pro" | "apprenant" | "all";
  price?: number;
};

export type CourseBuilderSnapshot = {
  general: CourseBuilderGeneralInfo;
  objectives: string[];
  skills: string[];
  sections: CourseBuilderSection[];
  resources: CourseBuilderResource[];
  tests: CourseBuilderTest[];
};



