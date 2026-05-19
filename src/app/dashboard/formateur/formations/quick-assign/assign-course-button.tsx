"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupRow = { id: string; name: string; members_count?: number };
type OrgRow = { id: string; name?: string | null };
type LearnerRow = { id: string; full_name: string | null; email: string | null };

export function AssignCourseButton({
  courseId,
  courseTitle,
  trigger,
}: {
  courseId: string;
  courseTitle: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"groups" | "orgs" | "individual" | "email">("groups");
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedOrgId, setSelectedOrgId] = useState<string>("none");
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<Set<string>>(new Set());
  const [learnerQuery, setLearnerQuery] = useState("");
  const [learnerOrgFilter, setLearnerOrgFilter] = useState<string>("all");
  const [directEmail, setDirectEmail] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    const run = async () => {
      setLoadingLists(true);
      try {
        const [groupsRes, orgsRes] = await Promise.all([
          fetch("/api/formateur/groups").then((r) => r.json()).catch(() => ({ groups: [] })),
          fetch("/api/formateur/organizations").then((r) => r.json()).catch(() => ({ organizations: [] })),
        ]);
        const learnersRes = await fetch("/api/formateur/learners").then((r) => r.json()).catch(() => ({ learners: [] }));
        if (ignore) return;
        setGroups(Array.isArray(groupsRes?.groups) ? groupsRes.groups : []);
        setOrgs(Array.isArray(orgsRes?.organizations) ? orgsRes.organizations : []);
        setLearners(Array.isArray(learnersRes?.learners) ? learnersRes.learners : []);
      } finally {
        if (!ignore) setLoadingLists(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [open]);

  const canSubmit = useMemo(() => {
    if (tab === "groups") return selectedGroupIds.size > 0;
    if (tab === "orgs") return selectedOrgId !== "none";
    if (tab === "email") return directEmail.trim().includes("@");
    return selectedLearnerIds.size > 0;
  }, [directEmail, selectedGroupIds.size, selectedLearnerIds.size, selectedOrgId, tab]);

  const submit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        const payload =
          tab === "groups"
            ? { courseId, groupIds: Array.from(selectedGroupIds) }
            : tab === "orgs"
              ? { courseId, orgId: selectedOrgId }
              : tab === "email"
                ? { courseId, learnerEmail: directEmail.trim() }
              : { courseId, learnerIds: Array.from(selectedLearnerIds) };

        const res = await fetch("/api/courses/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          const msg =
            typeof data?.error === "string" && data.error.trim()
              ? data.error.trim()
              : `Erreur HTTP ${res.status}`;
          toast.error(msg);
          return;
        }

        toast.success("Assignation effectuée", {
          description: data?.message || `Formation assignée : ${courseTitle}`,
        });
        setOpen(false);
        setSelectedGroupIds(new Set());
        setSelectedOrgId("none");
        setSelectedLearnerIds(new Set());
        setLearnerQuery("");
        setLearnerOrgFilter("all");
        setDirectEmail("");
      } catch (e) {
        toast.error("Erreur", {
          description: e instanceof Error ? e.message : "Impossible d’assigner la formation.",
        });
      }
    });
  };

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        role="button"
        tabIndex={0}
        className="inline-flex"
      >
        {trigger}
      </span>

      <Dialog open={open} onOpenChange={(v) => (!isPending ? setOpen(v) : null)}>
        <DialogContent className="max-w-xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle>Assigner “{courseTitle}”</DialogTitle>
            <DialogDescription>
              Choisissez un groupe, une organisation, ou un apprenant individuel.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="groups">Groupes</TabsTrigger>
              <TabsTrigger value="orgs">Organisations</TabsTrigger>
              <TabsTrigger value="individual">Individuel</TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="mt-4 space-y-3">
              {loadingLists ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des groupes…
                </div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-slate-600">Aucun groupe disponible.</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {groups.map((g) => {
                    const checked = selectedGroupIds.has(String(g.id));
                    return (
                      <label
                        key={g.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                      >
                        <span className="flex items-center gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              setSelectedGroupIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(String(g.id))) next.delete(String(g.id));
                                else next.add(String(g.id));
                                return next;
                              });
                            }}
                            disabled={isPending}
                          />
                          <span className="font-medium">{g.name}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          {typeof g.members_count === "number" ? `${g.members_count} membres` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orgs" className="mt-4 space-y-3">
              {orgs.length === 0 && !loadingLists ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">Aucune organisation liée à votre compte.</p>
                  <Button type="button" variant="secondary" onClick={() => setTab("email")} disabled={isPending}>
                    Assignation directe par email
                  </Button>
                </div>
              ) : null}

              <Label>Organisation</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId} disabled={isPending || loadingLists}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={loadingLists ? "Chargement…" : "Sélectionner une organisation"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name ?? o.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOrgId !== "none" ? (
                <>
                  <p className="text-xs text-slate-500">Apprenants de cette organisation</p>
                  <OrgLearnersList
                    orgId={selectedOrgId}
                    disabled={isPending}
                    onPick={(ids) => {
                      setSelectedLearnerIds(new Set(ids));
                      setTab("individual");
                      setLearnerOrgFilter(selectedOrgId);
                    setLearnerQuery("");
                    }}
                  />
                </>
              ) : (
                <p className="text-xs text-slate-500">Choisissez une organisation pour voir ses apprenants.</p>
              )}
            </TabsContent>

            <TabsContent value="email" className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label>Email apprenant</Label>
                <Input
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  placeholder="email@domaine.com"
                  className="rounded-xl"
                  disabled={isPending}
                />
                <p className="text-xs text-slate-500">
                  Utilisez ce mode si aucune organisation n’est liée à votre compte.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="individual" className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                <div className="space-y-2">
                  <Label>Filtrer par organisation</Label>
                  <Select value={learnerOrgFilter} onValueChange={setLearnerOrgFilter} disabled={isPending || loadingLists}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.name ?? o.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rechercher un apprenant</Label>
                  <Input
                    value={learnerQuery}
                    onChange={(e) => setLearnerQuery(e.target.value)}
                    placeholder="Nom ou email…"
                    className="rounded-xl"
                    disabled={isPending}
                  />
                </div>
              </div>

              <LearnersPicker
                orgId={learnerOrgFilter === "all" ? null : learnerOrgFilter}
                learners={learners}
                query={learnerQuery}
                selectedIds={selectedLearnerIds}
                onToggle={(id) => {
                  setSelectedLearnerIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
                disabled={isPending}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="button" onClick={submit} disabled={!canSubmit || isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LearnersPicker({
  orgId,
  learners,
  query,
  selectedIds,
  onToggle,
  disabled,
}: {
  orgId: string | null;
  learners: LearnerRow[];
  query: string;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  disabled: boolean;
}) {
  const [orgLearners, setOrgLearners] = useState<LearnerRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setOrgLearners(null);
      return;
    }
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetch(`/api/formateur/learners?orgId=${encodeURIComponent(orgId)}`)
          .then((r) => r.json())
          .catch(() => ({ learners: [] }));
        if (ignore) return;
        setOrgLearners(Array.isArray(data?.learners) ? data.learners : []);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [orgId]);

  const base = orgId ? (orgLearners ?? []) : learners;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? base.filter((l) => String(l.full_name ?? "").toLowerCase().includes(q) || String(l.email ?? "").toLowerCase().includes(q))
    : base;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des apprenants…
      </div>
    );
  }

  if (!filtered.length) {
    return <p className="text-sm text-slate-600">Aucun apprenant trouvé.</p>;
  }

  return (
    <div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
      {filtered.map((l) => {
        const id = String(l.id);
        const checked = selectedIds.has(id);
        return (
          <label key={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
            <span className="flex items-center gap-3">
              <Checkbox checked={checked} onCheckedChange={() => onToggle(id)} disabled={disabled} />
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-800">{l.full_name ?? l.email ?? id}</span>
                {l.email ? <span className="block truncate text-xs text-slate-500">{l.email}</span> : null}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function OrgLearnersList({
  orgId,
  disabled,
  onPick,
}: {
  orgId: string;
  disabled: boolean;
  onPick: (ids: string[]) => void;
}) {
  const [rows, setRows] = useState<LearnerRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetch(`/api/formateur/learners?orgId=${encodeURIComponent(orgId)}`)
          .then((r) => r.json())
          .catch(() => ({ learners: [] }));
        if (ignore) return;
        setRows(Array.isArray(data?.learners) ? data.learners : []);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (!rows.length) return <p className="text-sm text-slate-600">Aucun apprenant dans cette organisation.</p>;

  return (
    <div className="max-h-48 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
      {rows.map((l) => (
        <button
          key={l.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick([String(l.id)])}
          className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <span className="truncate">{l.full_name ?? l.email ?? l.id}</span>
          <span className="text-xs text-slate-500">Sélectionner</span>
        </button>
      ))}
    </div>
  );
}


