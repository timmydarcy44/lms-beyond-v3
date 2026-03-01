"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type DiscScores = { D: number; I: number; S: number; C: number };

export type DiscResults = {
  disc_profile: string;
  disc_score: number;
  disc_scores: DiscScores;
  disc_status: "completed";
};

export const saveDiscResults = async (userId: string, results: DiscResults) => {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }
  return supabase
    .from("profiles")
    .upsert({ id: userId, ...results }, { onConflict: "id" });
};
