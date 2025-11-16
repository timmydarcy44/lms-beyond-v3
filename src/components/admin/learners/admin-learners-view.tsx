"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AdminLearner } from "@/lib/queries/admin";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<NonNullable<AdminLearner["status"]>, { label: string; tone: string }> = {
  actif: { label: "Actif", tone: "bg-emerald-500/10 text-emerald-200" },
  "en attente": { label: "En attente", tone: "bg-amber-500/10 text-amber-200" },
  suspendu: { label: "Suspendu", tone: "bg-rose-500/10 text-rose-200" },
};

type FlashMessage = {
  type: "success" | "error";
  title: string;
  message: string;
};

type AdminLearnersViewProps = {
  learners: AdminLearner[];
  flash?: FlashMessage;
};

export function AdminLearnersView({ learners, flash }: AdminLearnersViewProps) {
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const totals = learners.reduce(
      (
        acc: Record<NonNullable<AdminLearner["status"]>, number>,
        learner,
      ) => {
        const status = learner.status ?? "actif";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      { actif: 0, "en attente": 0, suspendu: 0 },
    );

    const groupSet = new Set<string>();
    learners.forEach((learner) => {
      learner.groups.forEach((group) => groupSet.add(group.name));
    });

    return [
      { label: "Apprenants actifs", value: totals.actif, hint: `${totals.actif} sur ${learners.length}` },
      { label: "En attente d'accès", value: totals["en attente"], hint: "invitation envoyée" },
      { label: "Suspendus", value: totals.suspendu, hint: "à réactiver" },
      { label: "Groupes actifs", value: groupSet.size, hint: `${groupSet.size} groupes` },
    ];
  }, [learners]);

  const filteredLearners = useMemo(() => {
    if (!query.trim()) return learners;
    const lc = query.toLowerCase();
    return learners.filter((learner) => {
      return (
        learner.fullName.toLowerCase().includes(lc) ||
        (learner.email ?? "").toLowerCase().includes(lc) ||
        learner.groups.some((group) => group.name.toLowerCase().includes(lc))
      );
    });
  }, [learners, query]);

  return (
    <AdminPageScaffold
      title="Apprenants"
      subtitle="Invitez, segmentez et accompagnez vos cohortes en quelques clics."
    >
      <Card className="border-white/10 bg-gradient-to-br from-[#18181b]/80 via-[#11111f]/85 to-[#050505]/75">
        <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          {flash ? (
            <div className="md:col-span-2 xl:col-span-4">
              <Alert
                className={cn(
                  "border-white/20 bg-white/10 text-white",
                  flash.type === "success"
                    ? "border-emerald-400/40 bg-emerald-500/10"
                    : "border-rose-400/40 bg-rose-500/10",
                )}
              >
                <AlertTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                  {flash.title}
                </AlertTitle>
                <AlertDescription className="text-sm text-white/70">{flash.message}</AlertDescription>
              </Alert>
            </div>
          ) : null}
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              <p className="text-xs text-white/50">{item.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">Gestion des apprenants</CardTitle>
            <p className="text-sm text-white/60">Ajoutez de nouveaux membres manuellement ou importez un fichier Excel.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Link href="/admin/apprenants/new">Ajouter un apprenant</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:bg-white/10 hover:text-white"
            >
              Importer un fichier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              <Badge className="rounded-full bg-white/10 px-3 py-1 text-white">Tous ({filteredLearners.length})</Badge>
              <Badge className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">Actifs</Badge>
              <Badge className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">En attente</Badge>
              <Badge className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-200">Suspendus</Badge>
            </div>
            <Input
              placeholder="Rechercher un apprenant…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="max-w-xs border-white/10 bg-black/30 text-white placeholder:text-white/40"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/10 text-left text-xs uppercase tracking-[0.3em] text-white/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Nom</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Groupes</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Créé le</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-black/15">
                {filteredLearners.map((learner) => {
                  const status = learner.status ?? "actif";
                  const badge = STATUS_BADGE[status];
                  const createdAt = learner.createdAt
                    ? new Date(learner.createdAt).toLocaleDateString("fr-FR")
                    : "-";

                  return (
                    <tr key={learner.id} className="transition hover:bg-white/5">
                      <td className="px-5 py-4 text-sm font-semibold text-white">{learner.fullName}</td>
                      <td className="px-5 py-4 text-xs text-white/60">{learner.email ?? "-"}</td>
                      <td className="px-5 py-4 text-xs text-white/60">
                        {learner.groups.length === 0 ? "-" : learner.groups.map((group) => group.name).join(", ")}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={`${badge.tone} px-3 py-1 text-[10px] uppercase tracking-[0.3em]`}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-white/60">{createdAt}</td>
                      <td className="px-5 py-4 text-right text-xs text-white/60">
                        <button className="rounded-full border border-white/30 px-3 py-1 uppercase tracking-[0.3em] text-white/70 transition hover:border-white hover:text-white">
                          Gérer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredLearners.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-white/60">
                <p>Aucun apprenant ne correspond à vos critères de recherche.</p>
                <p className="text-xs text-white/40">Modifiez vos filtres ou ajoutez un nouvel apprenant.</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </AdminPageScaffold>
  );
}


