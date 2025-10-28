"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { CourseBlueprint } from "./types";

const BUCKET = "course-blueprints";

export async function loadBlueprint(courseId: string): Promise<CourseBlueprint | null> {
  const sb = createClientComponentClient();
  const { data, error } = await sb.storage.from(BUCKET).download(`${courseId}.json`);
  if (error) return null;
  const text = await data.text();
  return JSON.parse(text) as CourseBlueprint;
}

export async function saveBlueprint(courseId: string, blueprint: CourseBlueprint): Promise<void> {
  const sb = createClientComponentClient();
  const blob = new Blob([JSON.stringify(blueprint)], { type: "application/json" });
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(`${courseId}.json`, blob, { upsert: true, cacheControl: "0" });
  if (error) throw error;
}




