"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "admin_hr" | "manager";

type Row = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
};

type Props = {
  organisationId: string;
  onBack?: () => void;
  onNext: () => void;
};

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function AdminTeamStep({ organisationId, onBack, onNext }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [me, setMe] = useState<{ full_name: string; email: string } | null>(null);
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), email: "", full_name: "", role: "admin_hr" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user?.id) return;
      const email = user.email ?? "";
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      const name = String(p?.full_name ?? user.user_metadata?.full_name ?? "").trim();
      setMe({
        full_name: name || "DRH principal",
        email: String(p?.email ?? email),
      });
    })();
  }, [supabase]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), email: "", full_name: "", role: "admin_hr" },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const submit = async () => {
    const cleaned = rows
      .map((r) => ({
        email: normalizeEmail(r.email),
        full_name: r.full_name.trim(),
        role: r.role,
      }))
      .filter((r) => r.email || r.full_name);

    for (const r of cleaned) {
      if (!r.email || !isValidEmail(r.email)) {
        toast.error("Vérifiez les emails des administrateurs.");
        return;
      }
      if (!r.full_name) {
        toast.error("Renseignez prénom/nom pour chaque administrateur.");
        return;
      }
    }

    // optionnel : rien à inviter
    if (cleaned.length === 0) {
      onNext();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/organisation/${organisationId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admins: cleaned }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; invited?: Array<{ email: string; status: string; error?: string }> ; error?: string; step?: string; detail?: string }
        | null;
      if (!res.ok) {
        const msg = [json?.error, json?.step ? `(${json.step})` : "", json?.detail]
          .filter(Boolean)
          .join(" — ");
        throw new Error(msg || `Erreur (${res.status})`);
      }
      toast.success("Invitations envoyées");
      onNext();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">② Configurez votre équipe RH</h2>
      <p className="mt-2 text-sm text-gray-600">
        Qui aura accès à l&apos;espace administrateur Beyond ?
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Vous (DRH principal)</p>
        <p className="mt-1 text-sm text-emerald-900">
          {me ? `${me.full_name} — ${me.email} — déjà configuré ✅` : "Chargement…"}
        </p>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Ajouter des administrateurs supplémentaires
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Optionnel — ex : RH, managers, assistants.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addRow}>
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un administrateur
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Prénom Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Label className="sr-only">Email</Label>
                    <Input
                      value={r.email}
                      onChange={(e) => updateRow(r.id, { email: e.target.value })}
                      placeholder="email@entreprise.fr"
                    />
                  </TableCell>
                  <TableCell>
                    <Label className="sr-only">Prénom Nom</Label>
                    <Input
                      value={r.full_name}
                      onChange={(e) => updateRow(r.id, { full_name: e.target.value })}
                      placeholder="Prénom Nom"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={r.role} onValueChange={(v) => updateRow(r.id, { role: v as Role })}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Choisir rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin_hr">Admin RH</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(r.id)}>
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          ℹ️ Ils recevront un email d&apos;invitation et auront accès au dashboard RH Beyond.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Licences admin incluses : Core → 3 admins · Grow → 5 admins · Transform → 10
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={!onBack || saving}>
          ← Retour
        </Button>
        <Button type="button" onClick={() => void submit()} disabled={saving}>
          {saving ? "Envoi…" : "Continuer →"}
        </Button>
      </div>
    </section>
  );
}

