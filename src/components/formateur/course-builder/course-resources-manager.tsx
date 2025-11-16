"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCourseBuilder } from "@/hooks/use-course-builder";

export function CourseResourcesManager() {
  const resources = useCourseBuilder((state) => state.snapshot.resources);
  const tests = useCourseBuilder((state) => state.snapshot.tests);
  const addResource = useCourseBuilder((state) => state.addResource);
  const updateResource = useCourseBuilder((state) => state.updateResource);
  const removeResource = useCourseBuilder((state) => state.removeResource);
  const addTest = useCourseBuilder((state) => state.addTest);
  const updateTest = useCourseBuilder((state) => state.updateTest);
  const removeTest = useCourseBuilder((state) => state.removeTest);

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Ressources & tests associés</CardTitle>
          <p className="text-sm text-white/60">
            Liez rapidement des supports complémentaires et les évaluations que vos apprenants devront réaliser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={addResource}
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Ressource
          </Button>
          <Button
            onClick={addTest}
            className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            <Plus className="mr-2 h-3.5 w-3.5" /> Test / quiz
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Ressources</h3>
          {resources.length ? (
            resources.map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3">
                  <Input
                    value={resource.title}
                    onChange={(event) => updateResource(resource.id, { title: event.target.value })}
                    placeholder="Titre de la ressource"
                    className="bg-black/30 text-sm text-white placeholder:text-white/30"
                  />
                  <div className="grid gap-2 md:grid-cols-[1fr_160px]">
                    <Input
                      value={resource.url}
                      onChange={(event) => updateResource(resource.id, { url: event.target.value })}
                      placeholder="URL de la ressource"
                      className="bg-black/30 text-sm text-white placeholder:text-white/30"
                    />
                    <Input
                      value={resource.type}
                      onChange={(event) => updateResource(resource.id, { type: event.target.value as typeof resource.type })}
                      placeholder="Type (pdf, vidéo...)"
                      className="bg-black/30 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeResource(resource.id)}
                      className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Retirer
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-3 text-sm text-white/50">
              Ajoutez vos kits, PDF, replays ou supports complémentaires.
            </p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Tests & évaluations</h3>
          {tests.length ? (
            tests.map((test) => (
              <div key={test.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3">
                  <Input
                    value={test.title}
                    onChange={(event) => updateTest(test.id, { title: event.target.value })}
                    placeholder="Titre du test"
                    className="bg-black/30 text-sm text-white placeholder:text-white/30"
                  />
                  <div className="grid gap-2 md:grid-cols-[1fr_160px]">
                    <Input
                      value={test.url}
                      onChange={(event) => updateTest(test.id, { url: event.target.value })}
                      placeholder="Lien vers l'outil d'évaluation"
                      className="bg-black/30 text-sm text-white placeholder:text-white/30"
                    />
                    <Input
                      value={test.type}
                      onChange={(event) => updateTest(test.id, { type: event.target.value as typeof test.type })}
                      placeholder="Type (quiz, diagnostic...)"
                      className="bg-black/30 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeTest(test.id)}
                      className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Retirer
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/15 bg-transparent px-4 py-3 text-sm text-white/50">
              Reliez vos quizzes, évaluations ou auto-diagnostics pour piloter la progression.
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

