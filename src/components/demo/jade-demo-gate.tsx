"use client";

import { useEffect, useState, type ReactNode } from "react";
import { JadeDemoHome } from "@/components/demo/jade-demo-home";
import { isJadeDemoEmail, type JadeDemoSpace } from "@/lib/demo/jade-account";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function JadeDemoGate({ space, children }: { space: JadeDemoSpace; children: ReactNode }) {
  const [mode, setMode] = useState<"unknown" | "jade" | "other">("unknown");

  useEffect(() => {
    let ignore = false;
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        if (ignore) return;
        setMode(isJadeDemoEmail(data.user?.email) ? "jade" : "other");
      })
      .catch(() => {
        if (!ignore) setMode("other");
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (mode === "unknown") return null;
  if (mode === "jade") return <JadeDemoHome space={space} />;
  return children;
}
