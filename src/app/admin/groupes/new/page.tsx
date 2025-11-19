import type { ReactNode } from "react";

import Link from "next/link";

import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminAssignableCatalog, getAdminLearners } from "@/lib/queries/admin";
import { cn } from "@/lib/utils";

import { createGroupAction } from "./actions";

type SearchParams = {
  error?: string;
};

export default async function AdminCreateGroupPage({ searchParams }: { searchParams?: SearchParams }) {
  const [assignable, learners] = await Promise.all([getAdminAssignableCatalog(), getAdminLearners()]);
  const errorMessage = searchParams?.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <AdminPageScaffold title="Nouveau groupe" subtitle="Structurez une cohorte et assignez-lui ses premiers contenus.">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#00C6FF]/25 via-[#8E2DE2]/25 to-[#FF6FD8]/25 px-8 py-12 text-center shadow-[0_0_120px_-40px_rgba(142,45,226,0.55)]">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#00C6FF55,_transparent_55%)] opacity-70" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[60%] -translate-x-1/2 bg-[radial-gradient(circle,_#FF6FD844,_transparent_65%)] blur-3xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">Cohorte dédiée</p>
          <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Composez votre nouveau groupe</h2>
          <p className="mt-4 mx-auto max-w-2xl text-sm text-white/70">
            Réunissez vos apprenants, assignez les contenus stratégiques et préparez un suivi haute intensité dès aujourd'hui.
          </p>
        </div>

        {errorMessage ? (
          <Alert className="border-rose-400/40 bg-rose-500/10 text-white">
            <AlertTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Erreur</AlertTitle>
            <AlertDescription className="text-sm text-white/70">{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form action={createGroupAction} className="space-y-10">
          <Card className="border-white/10 bg-gradient-to-br from-[#10101a]/85 via-[#0c1524]/85 to-[#050510]/80 text-white shadow-[0_25px_80px_-40px_rgba(0,198,255,0.35)]">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white shadow-lg shadow-[#8E2DE2]/40">
                  Étape 01
                </Badge>
                <CardTitle className="text-lg font-semibold">Informations générales</CardTitle>
              </div>
              <p className="text-sm text-white/60">
                Donnez un nom clair et rattachez ce groupe à l'organisation concernée.
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50" htmlFor="name">
                  Nom du groupe
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Groupe Innovation & IA"
                  required
                  className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
                />
              </div>
              {assignable.organizations.length ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50" htmlFor="organizationId">
                    Organisation
                  </label>
                  <select
                    id="organizationId"
                    name="organizationId"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white shadow-inner shadow-black/20 focus:outline-none focus:ring-2 focus:ring-[#00C6FF]/60"
                    defaultValue={assignable.organizations[0]?.id ?? ""}
                  >
                    {assignable.organizations.map((org) => (
                      <option key={org.id} value={org.id} className="bg-[#050505]">
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-[#10101a]/85 via-[#0c1024]/85 to-[#050510]/80 text-white shadow-[0_25px_80px_-40px_rgba(142,45,226,0.35)]">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white shadow-lg shadow-[#8E2DE2]/40">
                  Étape 02
                </Badge>
                <CardTitle className="text-lg font-semibold">Apprenants du groupe</CardTitle>
              </div>
              <p className="text-sm text-white/60">
                Sélectionnez les apprenants qui composeront ce groupe. Vous pourrez en ajouter ou en retirer plus tard.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {learners.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {learners.map((learner) => (
                    <label
                      key={learner.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/30"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="learners"
                          value={learner.id}
                          className="h-4 w-4 rounded border-white/40 bg-black/40 text-[#00C6FF] focus:ring-[#00C6FF]"
                        />
                        <div>
                          <p className="font-semibold text-white">{learner.fullName}</p>
                          <p className="text-xs text-white/50">{learner.email ?? "-"}</p>
                        </div>
                      </div>
                      {((learner as any).groups?.length ?? 0) > 0 ? (
                        <Badge className="bg-white/10 text-white/70">{((learner as any).groups?.length ?? 0)} groupe(s)</Badge>
                      ) : null}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/50">
                  Aucun apprenant n'est disponible. Créez d'abord des apprenants depuis l'onglet dédié.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-[#10101a]/85 via-[#14102c]/85 to-[#050510]/80 text-white shadow-[0_25px_80px_-40px_rgba(255,111,216,0.35)]">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white shadow-lg shadow-[#8E2DE2]/40">
                  Étape 03
                </Badge>
                <CardTitle className="text-lg font-semibold">Contenus partagés avec le groupe</CardTitle>
              </div>
              <p className="text-sm text-white/60">
                Les apprenants sélectionnés recevront immédiatement les contenus choisis et apparaîtront dans les suivis associés.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <AssignableSection
                title="Formations"
                emptyLabel="Aucune formation disponible"
                items={assignable.courses.map((course) => ({
                  id: course.id,
                  label: course.title,
                  badge: course.status ? <Badge className="bg-white/10 text-white/70">{course.status}</Badge> : null,
                  name: "courses",
                }))}
              />

              <AssignableSection
                title="Parcours"
                emptyLabel="Aucun parcours disponible"
                items={assignable.paths.map((path) => ({
                  id: path.id,
                  label: path.title,
                  badge: path.status ? <Badge className="bg-white/10 text-white/70">{path.status}</Badge> : null,
                  name: "paths",
                }))}
              />

              <AssignableSection
                title="Ressources"
                emptyLabel="Aucune ressource disponible"
                items={assignable.resources.map((resource) => ({
                  id: resource.id,
                  label: resource.title,
                  badge: resource.type ? <Badge className="bg-white/10 text-white/70 capitalize">{resource.type}</Badge> : null,
                  name: "resources",
                }))}
              />

              <AssignableSection
                title="Tests"
                emptyLabel="Aucun test disponible"
                items={assignable.tests.map((test) => ({
                  id: test.id,
                  label: test.title,
                  badge: test.status ? <Badge className="bg-white/10 text-white/70">{test.status}</Badge> : null,
                  name: "tests",
                }))}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-white/10 bg-white/5 px-6 py-6 text-xs text-white/60">
              <p>
                Chaque contenu sélectionné sera automatiquement partagé avec les apprenants choisis. Les progrès pourront être
                suivis dans les dashboards formateur et admin.
              </p>
            </CardFooter>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-4">
            <Button
              asChild
              variant="outline"
              className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:border-white hover:text-white"
            >
              <Link href="/admin/groupes">Annuler</Link>
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[#8E2DE2]/30"
            >
              Créer le groupe
            </Button>
          </div>
        </form>
      </div>
    </AdminPageScaffold>
  );
}

type AssignableSectionProps = {
  title: string;
  emptyLabel: string;
  items: {
    id: string;
    label: string;
    badge?: ReactNode;
    name: string;
  }[];
};

function AssignableSection({ title, emptyLabel, items }: AssignableSectionProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/50">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{title}</p>
        <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">{items.length} disponible(s)</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-white/30",
            )}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name={item.name}
                value={item.id}
                className="h-4 w-4 rounded border-white/40 bg-black/40 text-[#00C6FF] focus:ring-[#00C6FF]"
              />
              <span className="text-white/80">{item.label}</span>
            </div>
            {item.badge}
          </label>
        ))}
      </div>
    </div>
  );
}

