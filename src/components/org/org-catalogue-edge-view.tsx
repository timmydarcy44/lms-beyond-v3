"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ExternalLink, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { EdgeOnlineCourse } from "@/lib/queries/edge-online";
import type { OrgLearnerOption } from "@/lib/org/org-formations";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import { OrgFormationsEmpty } from "@/components/org/org-formations-shell";
import { coverRawToDisplayUrl, pickCoverImageFromItem } from "@/lib/formation-cover";
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

function courseCoverUrl(course: EdgeOnlineCourse): string {
  const fromSnap = pickCoverImageFromItem({
    cover_image: course.image,
    builder_snapshot: course.builder_snapshot,
  } as Record<string, unknown>);
  return coverRawToDisplayUrl({
    raw: fromSnap || course.image || "",
    image: course.image,
  });
}

export function OrgCatalogueEdgeView({
  courses,
  variant = "light",
  orgId,
  learners = [],
  enableAssign = false,
}: {
  courses: EdgeOnlineCourse[];
  variant?: "light" | "dark";
  orgId?: string;
  learners?: OrgLearnerOption[];
  enableAssign?: boolean;
}) {
  const isDark = variant === "dark";
  const [theme, setTheme] = useState<string>("all");
  const [openFor, setOpenFor] = useState<EdgeOnlineCourse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const themes = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) {
      const name = String(c.categoryName || "").trim();
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [courses]);

  const filtered = useMemo(() => {
    if (theme === "all") return courses;
    return courses.filter((c) => String(c.categoryName || "").trim() === theme);
  }, [courses, theme]);

  const filteredLearners = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter((l) => {
      const hay = `${l.full_name ?? ""} ${l.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [learners, query]);

  const assign = () => {
    if (!openFor || !orgId || selected.size === 0) return;
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
            allowCatalogueAssign: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Assignation impossible");
        toast.success("Formation assignée", {
          description: `${selected.size} collaborateur(s) inscrit(s).`,
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
        title="Catalogue EDGE indisponible"
        description="Aucune formation publiée n’a pu être chargée pour le moment."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className={cn("max-w-2xl text-sm", isDark ? "text-white/55" : "text-black/55")}>
          Formations du catalogue EDGE Online. Assignez-les à vos collaborateurs — vos formations
          internes restent privées.
        </p>
        <Link
          href={EDGE_ONLINE_APP_SURFACE_PATH}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
            isDark ? "bg-white text-black" : "bg-[#007AFF] text-white",
          )}
        >
          Ouvrir EDGE Online
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {themes.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par thématique">
          <button
            type="button"
            onClick={() => setTheme("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              theme === "all"
                ? isDark
                  ? "bg-white text-black"
                  : "bg-[#1D1D1F] text-white"
                : isDark
                  ? "bg-white/5 text-white/65 hover:bg-white/10"
                  : "bg-black/[0.05] text-black/60 hover:bg-black/[0.08]",
            )}
          >
            Toutes ({courses.length})
          </button>
          {themes.map((t) => {
            const count = courses.filter((c) => String(c.categoryName || "").trim() === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  theme === t
                    ? isDark
                      ? "bg-white text-black"
                      : "bg-[#1D1D1F] text-white"
                    : isDark
                      ? "bg-white/5 text-white/65 hover:bg-white/10"
                      : "bg-black/[0.05] text-black/60 hover:bg-black/[0.08]",
                )}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course) => {
          const cover = courseCoverUrl(course);
          const showImg = cover && !brokenImages.has(course.id) && !cover.includes("placeholder-course");
          return (
            <div
              key={course.id}
              className={cn(
                "overflow-hidden rounded-2xl border transition",
                isDark
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-black/10 bg-white shadow-sm",
              )}
            >
              <Link
                href={`${EDGE_ONLINE_APP_SURFACE_PATH}/formations/${course.slug || course.id}`}
                className="block"
              >
                <div
                  className={cn(
                    "aspect-[16/9] overflow-hidden",
                    isDark ? "bg-gradient-to-br from-violet-900/40 to-black" : "bg-black/[0.04]",
                  )}
                >
                  {showImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() =>
                        setBrokenImages((prev) => {
                          const next = new Set(prev);
                          next.add(course.id);
                          return next;
                        })
                      }
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold uppercase tracking-wider text-white/35">
                      {course.categoryName || "EDGE"}
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4 pb-2">
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider",
                      isDark ? "text-white/40" : "text-black/40",
                    )}
                  >
                    {course.categoryName || "EDGE"}
                  </p>
                  <h3
                    className={cn(
                      "text-base font-semibold leading-snug hover:underline",
                      isDark ? "text-white" : "text-[#1D1D1F]",
                    )}
                  >
                    {course.title}
                  </h3>
                  {course.excerpt ? (
                    <p className={cn("line-clamp-2 text-sm", isDark ? "text-white/50" : "text-black/50")}>
                      {course.excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
              {enableAssign && orgId ? (
                <div className="px-4 pb-4">
                  <Button
                    type="button"
                    className={cn(
                      "w-full rounded-full",
                      isDark ? "bg-white text-black hover:bg-white/90" : "",
                    )}
                    onClick={() => {
                      setOpenFor(course);
                      setSelected(new Set());
                      setQuery("");
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assigner cette formation
                  </Button>
                </div>
              ) : null}
            </div>
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
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredLearners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun collaborateur trouvé. Ajoutez des salariés pour les assigner.
              </p>
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
    </div>
  );
}
