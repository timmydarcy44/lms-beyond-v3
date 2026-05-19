"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MemberRow = {
  user_id: string;
  role: string;
  email: string;
  full_name: string;
};

const roleLabel = (role: string) => {
  if (role === "admin") return "Administrateur";
  if (role === "trainer" || role === "instructor") return "Formateur";
  if (role === "student" || role === "learner") return "Apprenant";
  if (role === "tutor") return "Tuteur / référent";
  return role;
};

type UiOrgRole = "admin" | "trainer" | "student" | "tutor" | "handicap_referent";

function splitCsvLine(line: string, sep: string): string[] {
  return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
}

type BulkMemberRow = { email: string; first_name: string; last_name: string; role: UiOrgRole };

function parseOrgMemberBulkPaste(raw: string): BulkMemberRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (!lines.length) return [];

  const sep =
    lines[0].includes(";") && (!lines[0].includes(",") || lines[0].split(";").length >= lines[0].split(",").length)
      ? ";"
      : ",";

  const headerCells = splitCsvLine(lines[0], sep).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const looksLikeHeader = headerCells.some((h) => h === "email" || h === "mail");

  const pickIdx = (names: string[], cells: string[]) => {
    for (let i = 0; i < cells.length; i++) {
      const n = cells[i].toLowerCase().replace(/\s+/g, "_");
      if (names.includes(n)) return i;
    }
    return -1;
  };

  let headerRow = headerCells;
  let bodyLines = lines;
  if (looksLikeHeader) {
    bodyLines = lines.slice(1);
  } else {
    headerRow = ["email", "first_name", "last_name", "role"];
  }

  const idxEmail = pickIdx(["email", "mail", "e-mail"], headerRow);
  const idxFirst = pickIdx(["first_name", "prenom", "prénom", "firstname"], headerRow);
  const idxLast = pickIdx(["last_name", "nom", "lastname"], headerRow);
  const idxRole = pickIdx(["role", "rôle", "fonction"], headerRow);

  const normalizeRole = (cell: string): UiOrgRole => {
    const r = cell.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (r === "admin" || r === "administrateur") return "admin";
    if (r === "trainer" || r === "formateur" || r === "instructor") return "trainer";
    if (r === "student" || r === "learner" || r === "apprenant") return "student";
    if (r === "tutor" || r === "tuteur") return "tutor";
    if (
      r.includes("handicap") ||
      r === "referent_handicap" ||
      r === "referenthandicap" ||
      r === "rh_handicap"
    ) {
      return "handicap_referent";
    }
    return "student";
  };

  const out: BulkMemberRow[] = [];
  for (const line of bodyLines) {
    const cells = splitCsvLine(line, sep);
    const email = ((idxEmail >= 0 ? cells[idxEmail] : cells[0]) ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    const roleRaw = (idxRole >= 0 ? cells[idxRole] : cells[3]) ?? "student";
    out.push({
      email,
      first_name: ((idxFirst >= 0 ? cells[idxFirst] : cells[1]) ?? "").trim(),
      last_name: ((idxLast >= 0 ? cells[idxLast] : cells[2]) ?? "").trim(),
      role: normalizeRole(roleRaw),
    });
  }
  return out;
}

export function OrganizationManageTabs({
  organizationId,
  organizationName,
  members,
}: {
  organizationId: string;
  organizationName: string;
  members: MemberRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"admins" | "trainers" | "students">("admins");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [role, setRole] = useState<UiOrgRole>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const rows = useMemo(() => {
    const normalized = members.map((m) => ({
      ...m,
      role:
        m.role === "instructor"
          ? "trainer"
          : m.role === "learner"
            ? "student"
            : m.role === "tutor"
              ? "tutor"
              : m.role,
    }));
    if (tab === "admins") return normalized.filter((m) => m.role === "admin");
    if (tab === "trainers")
      return normalized.filter((m) => m.role === "trainer" || m.role === "tutor");
    return normalized.filter((m) => m.role === "student");
  }, [members, tab]);

  const handleAdd = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/organisations/${organizationId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          role,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          tempPassword: tempPassword.trim() || undefined,
          attachSchoolId: true,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "ADD_MEMBER_FAILED");

      toast.success("Membre ajouté", { description: `${trimmed} • ${roleLabel(role)}` });
      setEmail("");
      setFirstName("");
      setLastName("");
      setTempPassword("");
      router.refresh();
    } catch (e) {
      toast.error("Erreur", { description: e instanceof Error ? e.message : "Impossible d'ajouter le membre" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <TabsList className="rounded-full bg-slate-100">
          <TabsTrigger value="admins" className="rounded-full px-4">
            Administrateurs
          </TabsTrigger>
          <TabsTrigger value="trainers" className="rounded-full px-4">
            Formateurs
          </TabsTrigger>
          <TabsTrigger value="students" className="rounded-full px-4">
            Apprenants
          </TabsTrigger>
        </TabsList>

        <Card className="w-full border-slate-200 bg-white shadow-sm md:w-[720px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">Ajouter un membre</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_170px_auto] md:items-end">
            <div className="space-y-2">
              <Label className="text-slate-700">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Prénom</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Nom</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom"
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Rôle</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UiOrgRole)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value="admin">Administrateur</option>
                <option value="trainer">Formateur</option>
                <option value="student">Apprenant</option>
                <option value="tutor">Tuteur</option>
                <option value="handicap_referent">Référent handicap</option>
              </select>
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={isSubmitting || !email.trim()}
              className={cn(
                "h-11 rounded-2xl px-5 font-semibold text-white",
                "bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-[#9333ea] hover:opacity-95",
              )}
            >
              Ajouter
            </Button>
            <div className="space-y-2 md:col-span-5">
              <Label className="text-slate-700">Mot de passe temporaire (optionnel)</Label>
              <Input
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Laisser vide pour invitation par email"
                className="h-11 rounded-2xl border-slate-200 bg-white"
              />
              <p className="text-xs text-slate-500">
                Organisation: <span className="font-medium text-slate-700">{organizationName}</span> • Si le mot de
                passe est vide, une invitation email est envoyée.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">Import en masse (CSV collé)</CardTitle>
          <p className="text-xs text-slate-500">
            Jusqu&apos;à 400 lignes. Colonnes :{" "}
            <span className="font-mono text-slate-700">
              email, first_name, last_name, role
            </span>
            . Rôles : admin, trainer, student, tutor, handicap_referent (ou formateur, apprenant, référent handicap…).
            Les profils sont rattachés à l&apos;organisation <span className="font-medium">{organizationName}</span>{" "}
            (<span className="font-mono text-slate-600">school_id</span> = id org pour les CFA).
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder={`email@cfa.fr,Jean,Dupont,trainer\nemail2@cfa.fr,Marie,Martin,student`}
            className="rounded-2xl border-slate-200 font-mono text-xs"
          />
          <div className="grid gap-2 md:max-w-md">
            <Label className="text-slate-700">Mot de passe temporaire commun (optionnel)</Label>
            <Input
              value={bulkPassword}
              onChange={(e) => setBulkPassword(e.target.value)}
              placeholder="Sinon invitation email pour chaque ligne"
              className="h-11 rounded-2xl border-slate-200 bg-white"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={bulkSubmitting || !bulkText.trim()}
            onClick={handleBulk}
            className="h-11 w-fit rounded-2xl"
          >
            {bulkSubmitting ? "Import…" : "Lancer l'import"}
          </Button>
        </CardContent>
      </Card>

      <TabsContent value="admins">
        <MembersTable rows={rows} />
      </TabsContent>
      <TabsContent value="trainers">
        <MembersTable rows={rows} />
      </TabsContent>
      <TabsContent value="students">
        <MembersTable rows={rows} />
      </TabsContent>
    </Tabs>
  );
}

function MembersTable({ rows }: { rows: MemberRow[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>User ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                Aucun membre dans cet onglet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((m) => (
              <TableRow key={`${m.user_id}-${m.role}`}>
                <TableCell className="text-slate-900">{m.email || "—"}</TableCell>
                <TableCell className="text-slate-700">{m.full_name || "—"}</TableCell>
                <TableCell className="text-slate-700">{roleLabel(m.role)}</TableCell>
                <TableCell className="max-w-[240px] truncate font-mono text-xs text-slate-600">
                  {m.user_id}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

