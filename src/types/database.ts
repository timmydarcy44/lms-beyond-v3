export type CertificationStatus = "none" | "training" | "certified";

export type Expert = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  headline?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  registration_step?: number | null;
  is_active?: boolean | null;
  is_certified_beyond?: boolean | null;
  certification_status?: CertificationStatus | string | null;
  specialties?: string[] | null;
  formats_supported?: string[] | null;
  formats?: string[] | null;
};

export type ActionRequestStatus =
  | "pending_hr_validation"
  | "expert_notified"
  | "accepted"
  | "scheduled"
  | "completed"
  | "awaiting_rerun"
  | "cancelled"
  | (string & {});

export type ActionRequest = {
  id: string;
  expert_id?: string | null;
  action_type: string | null;
  target_label: string | null;
  target_count?: number | null;
  status: ActionRequestStatus | null;
  created_at: string | null;
  updated_at?: string | null;
  scheduled_at?: string | null;
  initial_score?: number | null;
  final_score?: number | null;
  impact_category?: string | null;
  completion_notes?: string | null;
  metadata?: any;
  expert?: Pick<Expert, "id" | "first_name" | "last_name" | "headline" | "photo_url" | "certification_status"> | null;
};

export type UserRole =
  | "formateur"
  | "apprenant"
  | "admin"
  | "tuteur"
  | "entreprise"
  | "ecole"
  | "club"
  | "partenaire"
  | "demo"
  | "praticien"
  | "expert";

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
  chapter_id: string | null;
  course_id?: string | null;
  local_chapter_ref?: string | null;
  front: string;
  back: string;
  question?: string | null;
  answer?: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress?: number | null;
  role?: string | null;
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


