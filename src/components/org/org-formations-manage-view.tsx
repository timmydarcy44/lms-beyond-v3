"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import type { OrgFormationListItem, OrgLearnerOption } from "@/lib/org/org-formations";
import { OrgFormationsEmpty } from "@/components/org/org-formations-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function statusLabel(status: string) {
  if (status === "published") return "Publié";
  if (status === "scheduled") return "Programmé";
  return "Brouillon";
}

export function OrgFormationsManageView({
  courses,
  learners,
  orgId,
  basePath,
  variant = "light",
}: {
  courses: OrgFormationListItem[];
  learners: OrgLearnerOption[];
  orgId: string;
  basePath: string;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  const [openFor, setOpenFor] = useState<OrgFormationListItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredLearners = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter((l) => {
      const hay = `${l.full_name ?? ""} ${l.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [learners, query]);

  const assign = () => {
    if (!openFor || selected.size === 0) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/courses/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: openFor.id,
            learnerIds: Array.from(selected),
            orgId,
            scopeOrgOnly: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Assignation impossible");
        toast.success("Apprenants assignés", {
          description: `${selected.size} membre(s) de votre organisation.`,
        });
        setOpenFor(null);
        setSelected(new Set());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur d’assignation");
      }
    });
  };

  if (!courses.length) {
    return (
      <OrgFormationsEmpty
        variant={variant}
        title="Aucune formation organisationnelle"
        description="Créez une formation pour la rendre accessible uniquement aux membres de votre organisation."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
              isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white shadow-sm",
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn("truncate text-base font-semibold", isDark ? "text-white" : "text-[#1D1D1F]")}>
                  {course.title}
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    course.status === "published"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-amber-500/15 text-amber-700",
                  )}
                >
                  {statusLabel(course.status)}
                </span>
              </div>
              <p className={cn("mt-1 text-xs", isDark ? "text-white/45" : "text-black/45")}>
                {course.enrollmentsCount} inscrit(s) · privée à l’organisation
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn("rounded-full", isDark ? "border-white/20 bg-transparent text-white" : "")}
                onClick={() => {
                  setOpenFor(course);
                  setSelected(new Set());
                  setQuery("");
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assigner
              </Button>
              <Button asChild className="rounded-full">
                <Link href={`${basePath}/creer?courseId=${course.id}`}>Éditer</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(openFor)} onOpenChange={(o) => !o && setOpenFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assigner — {openFor?.title}</DialogTitle>
            <DialogDescription>
              Uniquement les apprenants / salariés de votre organisation.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un membre…"
            className="mb-3"
          />
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredLearners.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun membre trouvé.</p>
            ) : (
              filteredLearners.map((learner) => {
                const checked = selected.has(learner.id);
                return (
                  <label
                    key={learner.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(learner.id);
                          else next.delete(learner.id);
                          return next;
                        });
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {learner.full_name || learner.email || learner.id.slice(0, 8)}
                      </span>
                      {learner.email ? (
                        <span className="block truncate text-xs text-muted-foreground">{learner.email}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpenFor(null)}>
              Annuler
            </Button>
            <Button type="button" disabled={selected.size === 0 || isPending} onClick={assign}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assigner ({selected.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
