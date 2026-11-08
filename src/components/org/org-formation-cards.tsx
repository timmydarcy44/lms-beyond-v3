"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { BookOpen, Loader2, UserPlus } from "lucide-react";
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

function statusLabel(status: string) {
  if (status === "published" || status === "active") return "Disponible";
  if (status === "scheduled") return "Programmé";
  return "Brouillon";
}

export function OrgFormationCards({
  courses,
  learners,
  orgId,
  emptyTitle,
  emptyDescription,
  showAssign = true,
  badgeFor,
}: {
  courses: OrgFormationListItem[];
  learners: OrgLearnerOption[];
  orgId: string;
  emptyTitle: string;
  emptyDescription: string;
  showAssign?: boolean;
  badgeFor?: (course: OrgFormationListItem) => string | null;
}) {
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
        toast.success("Assignation réussie", {
          description: `${selected.size} collaborateur(s).`,
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
      <OrgFormationsEmpty variant="dark" title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => {
          const badge = badgeFor?.(course);
          return (
            <article
              key={course.id}
              className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]"
            >
              <div className="relative aspect-[16/10] bg-gradient-to-br from-[#2a2150] to-[#0b0a12]">
                {course.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.coverImage}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-10 w-10 text-violet-300/70" />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {statusLabel(course.status)}
                  </span>
                  {badge ? (
                    <span className="rounded-full bg-violet-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {badge}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="line-clamp-2 text-base font-semibold text-white">{course.title}</h3>
                  {course.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-white/55">{course.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-white/40">
                      {course.enrollmentsCount} inscrit(s)
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {showAssign ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-white/20 bg-transparent text-white"
                      onClick={() => {
                        setOpenFor(course);
                        setSelected(new Set());
                        setQuery("");
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assigner
                    </Button>
                  ) : null}
                  <Button asChild className="rounded-full bg-violet-600 hover:bg-violet-500">
                    <Link href={`/dashboard/entreprise/formations/creer?courseId=${course.id}`}>
                      Ouvrir
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={Boolean(openFor)} onOpenChange={(o) => !o && setOpenFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assigner — {openFor?.title}</DialogTitle>
            <DialogDescription>
              Sélectionnez les collaborateurs de votre organisation à inscrire.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un collaborateur…"
            className="mb-3"
          />
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {filteredLearners.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun collaborateur trouvé.</p>
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
                        <span className="block truncate text-xs text-muted-foreground">
                          {learner.email}
                        </span>
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
