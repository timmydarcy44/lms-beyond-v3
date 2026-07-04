"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, Star, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingInstructor } from "@/lib/training-courses/cms-types";
import { TrainingMediaUploader } from "@/components/super-admin/training-cms/training-media-uploader";

type ExpertOption = {
  id: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: string | null;
};

type Props = {
  courseId: string;
  instructors: TrainingInstructor[];
  onChange: (instructors: TrainingInstructor[]) => void;
};

export function TrainingInstructorsPicker({ courseId, instructors, onChange }: Props) {
  const [experts, setExperts] = useState<ExpertOption[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/super/training-courses/experts")
      .then((r) => r.json())
      .then((json) => setExperts(json.experts ?? []))
      .catch(() => setExperts([]));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, []);

  const sorted = useMemo(
    () => [...instructors].sort((a, b) => a.sort_order - b.sort_order),
    [instructors],
  );

  const primary = sorted.find((i) => i.role === "primary");
  const contributors = sorted.filter((i) => i.role !== "primary");

  const filtered = experts.filter((e) => {
    const q = query.toLowerCase();
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    return name.includes(q) || (e.headline ?? "").toLowerCase().includes(q);
  });

  const addExpert = (expert: ExpertOption, role: TrainingInstructor["role"]) => {
    if (instructors.some((i) => i.expert_id === expert.id)) return;
    const next: TrainingInstructor = {
      expert_id: expert.id,
      role,
      sort_order: instructors.length,
      first_name: expert.first_name,
      last_name: expert.last_name,
      headline: expert.headline,
      photo_url: expert.photo_url,
    };
    if (role === "primary" && primary) {
      onChange(
        instructors
          .map((i) => (i.role === "primary" ? { ...i, role: "contributor" as const } : i))
          .concat(next),
      );
    } else {
      onChange([...instructors, next]);
    }
    setOpen(false);
    setQuery("");
  };

  const remove = (expertId: string) => onChange(instructors.filter((i) => i.expert_id !== expertId));

  const setPrimary = (expertId: string) => {
    onChange(
      instructors.map((i) => ({
        ...i,
        role: i.expert_id === expertId ? ("primary" as const) : ("contributor" as const),
      })),
    );
  };

  const updatePhoto = (expertId: string, photoUrl: string) => {
    onChange(instructors.map((i) => (i.expert_id === expertId ? { ...i, photo_url: photoUrl } : i)));
  };

  function InstructorCard({ ins, isPrimary }: { ins: TrainingInstructor; isPrimary?: boolean }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {ins.photo_url ? (
              <Image src={ins.photo_url} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-300">
                {(ins.first_name[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {ins.first_name} {ins.last_name}
                </p>
                <p className="text-sm text-gray-500">{ins.headline ?? "—"}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(ins.expert_id)}
                className="text-gray-400 hover:text-red-600"
                aria-label="Retirer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {isPrimary ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#635BFF]/10 px-2.5 py-1 text-xs font-semibold text-[#635BFF]">
                  <Star className="h-3 w-3" />
                  Intervenant principal
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPrimary(ins.expert_id)}
                  className="text-xs font-medium text-gray-500 hover:text-[#635BFF]"
                >
                  Définir comme principal
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <TrainingMediaUploader
            courseId={courseId}
            value={ins.photo_url ?? ""}
            onChange={(url) => updatePhoto(ins.expert_id, url)}
            label="Photo intervenant"
            kind="instructor"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Intervenant principal</h3>
        {primary ? (
          <div className="mt-3">
            <InstructorCard ins={primary} isPrimary />
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-400">Aucun intervenant principal sélectionné.</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900">Intervenants additionnels</h3>
        <div className="mt-3 space-y-3">
          {contributors.map((ins) => (
            <InstructorCard key={ins.expert_id} ins={ins} />
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-[#635BFF]/40 hover:bg-[#635BFF]/5"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un intervenant
          <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
        </button>

        {open ? (
          <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 p-3">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un expert…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-gray-400">Aucun expert trouvé</li>
              ) : (
                filtered.map((expert) => (
                  <li key={expert.id}>
                    <button
                      type="button"
                      disabled={instructors.some((i) => i.expert_id === expert.id)}
                      onClick={() =>
                        addExpert(expert, primary ? "contributor" : "primary")
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-40"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                        {expert.photo_url ? (
                          <Image src={expert.photo_url} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-300">
                            {(expert.first_name[0] ?? "?").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {expert.first_name} {expert.last_name}
                        </p>
                        <p className="truncate text-xs text-gray-500">{expert.headline ?? "—"}</p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
