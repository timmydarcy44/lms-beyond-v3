export type UserRole = "formateur" | "apprenant" | "admin" | "tuteur";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Formation {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  author_id: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  formation_id: string;
  title: string;
  content: string | null;
  order_index: number;
  created_at: string;
}

export interface Flashcard {
  id: string;
  chapter_id: string;
  front: string;
  back: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  formation_id: string;
  progress: number;
  created_at: string;
}

export interface Test {
  id: string;
  formation_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface TestResult {
  id: string;
  test_id: string;
  user_id: string;
  score: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      formations: {
        Row: Formation;
        Insert: Omit<Formation, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Omit<Formation, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        };
      };
      chapters: {
        Row: Chapter;
        Insert: Omit<Chapter, "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Omit<Chapter, "id" | "created_at">>;
      };
      flashcards: {
        Row: Flashcard;
        Insert: Omit<Flashcard, "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Omit<Flashcard, "id" | "created_at">>;
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Omit<Enrollment, "id" | "created_at">>;
      };
      tests: {
        Row: Test;
        Insert: Omit<Test, "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Omit<Test, "id" | "created_at">>;
      };
      test_results: {
        Row: TestResult;
        Insert: Omit<TestResult, "id" | "created_at"> & {
          id?: string;
        };
        Update: Partial<Omit<TestResult, "id" | "created_at">>;
      };
    };
  };
}


