"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

type CourseProof = {
  id: string;
  title: string;
  objectives: string[];
  objectivesOk: boolean;
  onePager: string;
  source: string;
};

export function QualiopiCataloguePanel() {
  const [courses, setCourses] = useState<CourseProof[]>([]);
  const [summary, setSummary] = useState({
    coursesTotal: 0,
    withObjectives: 0,
    approvedExperts: 0,
    expertsOk: false,
  });
  const [experts, setExperts] = useState<Array<{ id: string; first_name: string | null; last_name: string | null }>>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/catalog-proofs");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Catalogue");
      setCourses(json.courses ?? []);
      setSummary(json.summary);
      setExperts(json.experts ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const download = (course: CourseProof) => {
    const blob = new Blob([course.onePager], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preuve-catalogue-${course.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Preuves catalogue</h1>
          <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
            Objectifs ≥3, accessibilité, experts approuvés — export one-pager pour le dossier auditeur.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/15 bg-transparent text-white">
          <Link href="/super/lms/formations">Ouvrir le studio</Link>
        </Button>
      </div>

      {loading ? (
        <p className={cn("flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={cn(QUALIOPI_CARD_INNER, "p-4")}>
              <p className={cn("text-xs", QUALIOPI_MUTED)}>Formations avec ≥3 objectifs</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {summary.withObjectives}/{summary.coursesTotal}
              </p>
            </div>
            <div className={cn(QUALIOPI_CARD_INNER, "p-4")}>
              <p className={cn("text-xs", QUALIOPI_MUTED)}>Experts approuvés</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {summary.approvedExperts}{" "}
                <span className="text-sm font-normal text-white/50">{summary.expertsOk ? "OK" : "(viser ≥2)"}</span>
              </p>
            </div>
            <div className={cn(QUALIOPI_CARD_INNER, "p-4")}>
              <p className={cn("text-xs", QUALIOPI_MUTED)}>Accessibilité</p>
              <p className="mt-1 text-sm text-white/80">referent-handicap@byound.fr sur one-pagers</p>
            </div>
          </div>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Formations</h2>
            <ul className="mt-4 space-y-2">
              {courses.slice(0, 40).map((course) => (
                <li key={`${course.source}-${course.id}`} className={cn(QUALIOPI_CARD_INNER, "flex items-center justify-between gap-3 p-3")}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{course.title}</p>
                    <p className={cn("text-xs", QUALIOPI_MUTED)}>
                      {course.objectivesOk
                        ? `${course.objectives.length} objectifs`
                        : "Objectifs incomplets (< 3)"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => download(course)}
                    className="border-white/15 text-white"
                  >
                    One-pager
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Experts approuvés</h2>
            <ul className="mt-3 space-y-1">
              {experts.map((e) => (
                <li key={e.id} className="text-sm text-white/75">
                  {`${e.first_name ?? ""} ${e.last_name ?? ""}`.trim()}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
