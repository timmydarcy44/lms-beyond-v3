"use client";
import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { CourseBlueprint } from "./types";
import { loadBlueprint, saveBlueprint } from "./storage";

export function useCourseMeta(courseId: string) {
  const sb = createClientComponentClient();
  const [meta, setMeta] = useState<{ title: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await sb.from("courses").select("title, description").eq("id", courseId).maybeSingle();
      if (!mounted) return;
      setMeta(error ? null : data);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [courseId, sb]);

  const updateMeta = useCallback(
    async (patch: Partial<{ title: string; description: string }>) => {
      if (!meta) return;
      const next = { ...meta, ...patch };
      setMeta(next);
      const { error } = await sb.from("courses").update(patch).eq("id", courseId);
      if (error) throw error;
    },
    [meta, courseId, sb]
  );

  return { meta, loading, updateMeta };
}

export function useBlueprint(courseId: string) {
  const [bp, setBp] = useState<CourseBlueprint | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const draft = await loadBlueprint(courseId);
      if (mounted) setBp(draft ?? { version: 1, meta: {}, outline: [] });
    })();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  const mutate = (fn: (current: CourseBlueprint) => CourseBlueprint) => {
    setBp((prev) => {
      const next = fn(prev ?? { version: 1, meta: {}, outline: [] });
      setDirty(true);
      return next;
    });
  };

  const persist = async () => {
    if (!bp || !dirty) return;
    setSaving(true);
    try {
      await saveBlueprint(courseId, bp);
    } finally {
      setSaving(false);
      setDirty(false);
    }
  };

  return { bp, mutate, persist, saving, dirty };
}




