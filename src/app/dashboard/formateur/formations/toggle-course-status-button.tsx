"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ToggleCourseStatusButton({
  courseId,
  currentStatus,
}: {
  courseId: string;
  currentStatus: "draft" | "published" | "scheduled";
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const nextStatus = currentStatus === "published" ? "draft" : "published";

  return (
    <Button
      type="button"
      variant="ghost"
      className="rounded-full bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        try {
          const res = await fetch("/api/courses/toggle-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, nextStatus }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.success) {
            throw new Error(typeof data?.error === "string" ? data.error : `Erreur HTTP ${res.status}`);
          }
          toast.success(nextStatus === "published" ? "Publié" : "Passé en brouillon");
          router.refresh();
        } catch (e) {
          toast.error("Erreur", { description: e instanceof Error ? e.message : "Impossible de mettre à jour le statut." });
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {currentStatus === "published" ? "Repasse en brouillon" : "Publier"}
    </Button>
  );
}

