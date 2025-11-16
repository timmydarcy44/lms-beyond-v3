"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseBuilder } from "@/hooks/use-course-builder";

import { CourseMetadataForm } from "./course-metadata-form";
import { CourseLearnerPreview } from "./course-learner-preview";

export function CourseMetadataWorkspace() {
  const reset = useCourseBuilder((state) => state.reset);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8 pb-12">
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Étape 1 — Métadonnées</p>
            <p className="text-sm text-white/70">
              Posez l&apos;ADN de votre formation : titre, récit pédagogique, visuels et promesse. Ces éléments alimentent les pages
              apprenant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  reset();
                })
              }
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
            >
              Réinitialiser
            </Button>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Link href="/dashboard/formateur/formations/new/structure">Passer à la construction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <CourseMetadataForm />
        </div>
        <div className="xl:sticky xl:top-4">
          <CourseLearnerPreview />
        </div>
      </div>
    </div>
  );
}


