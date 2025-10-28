export type BlockType = "text" | "video" | "resource" | "quiz";

export type SubChapter = {
  id: string;
  title: string;
  blocks: Array<{ id: string; type: BlockType; content: any }>;
};

export type Chapter = {
  id: string;
  title: string;
  subchapters: SubChapter[];
};

export type Section = {
  id: string;
  title: string;
  chapters: Chapter[];
};

export type CourseBlueprint = {
  version: 1;
  meta: {
    coverUrl?: string;
    category?: string;
  };
  outline: Section[];
};




