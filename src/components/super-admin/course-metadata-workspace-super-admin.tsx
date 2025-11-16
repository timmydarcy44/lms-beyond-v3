"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseBuilder } from "@/hooks/use-course-builder";

import { CourseMetadataFormSuperAdmin } from "./course-metadata-form-super-admin";

export function CourseMetadataWorkspaceSuperAdmin() {
  const reset = useCourseBuilder((state) => state.reset);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="space-y-8 pb-12">
      <Card className="border-black bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="max-w-xl space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Étape 1 — Métadonnées</p>
            <p className="text-sm text-gray-700">
              Posez l&apos;ADN de votre module : titre, récit pédagogique, visuels et promesse. Ces éléments alimentent les pages
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
              className="rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Réinitialiser
            </Button>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-md"
            >
              <Link href="/super/studio/modules/new/structure">Passer à la construction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <CourseMetadataFormSuperAdmin />
    </div>
  );
}

