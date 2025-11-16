"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AdminGroup } from "@/lib/queries/admin";
import { cn } from "@/lib/utils";

type FlashMessage = {
  type: "success" | "error";
  title: string;
  message: string;
};

type AdminGroupsViewProps = {
  groups: AdminGroup[];
  flash?: FlashMessage;
};

export function AdminGroupsView({ groups, flash }: AdminGroupsViewProps) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    const lc = query.toLowerCase();
    return groups.filter((group) => {
      return (
        group.name.toLowerCase().includes(lc) ||
        group.members.some((member) => member.name.toLowerCase().includes(lc)) ||
        (group.orgName ?? "").toLowerCase().includes(lc)
      );
    });
  }, [groups, query]);

  return (
    <AdminPageScaffold
      title="Groupes d'apprenants"
      subtitle="Structurez vos classes, assignez des mentors et planifiez les sessions en cohérence."
    >
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">Aperçu des groupes</CardTitle>
            <p className="text-sm text-white/60">Créez des espaces de travail, assignez des apprenants et suivez l'activité.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Link href="/admin/groupes/new">Créer un groupe</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:bg-white/10 hover:text-white"
            >
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {flash ? (
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
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              <Badge className="rounded-full bg-white/10 px-3 py-1 text-white">Tous ({filteredGroups.length})</Badge>
              <Badge className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-100">En session</Badge>
              <Badge className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">Autonomie</Badge>
            </div>
            <Input
              placeholder="Rechercher un groupe…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="max-w-xs border-white/10 bg-black/30 text-white placeholder:text-white/40"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="group relative overflow-hidden border border-white/10 bg-gradient-to-br from-[#18181b]/90 via-[#11111f]/85 to-[#050505]/80"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#00C6FF]/10 opacity-0 transition group-hover:opacity-100" />
                <CardContent className="relative space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                        Référent · {group.ownerName ?? "-"}
                      </p>
                      {group.orgName ? (
                        <p className="text-xs uppercase tracking-[0.3em] text-white/30">Organisation · {group.orgName}</p>
                      ) : null}
                    </div>
                    <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                      {group.members.length} apprenant(s)
                    </Badge>
                  </div>
                  {group.description ? <p className="text-sm text-white/60">{group.description}</p> : null}
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Membres</p>
                    <div className="flex flex-wrap gap-2">
                      {group.members.length === 0 ? (
                        <span className="text-white/40">Aucun membre</span>
                      ) : (
                        group.members.map((member) => (
                          <span key={member.id} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                            {member.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{group.sessions ?? 0} sessions planifiées</span>
                    <button className="rounded-full border border-white/30 px-3 py-1 uppercase tracking-[0.3em] text-white/70 transition hover:border-white hover:text-white">
                      Gérer
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminPageScaffold>
  );
}


