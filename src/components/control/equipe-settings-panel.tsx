"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Member = {
  id: string;
  label: string;
  email: string | null;
  is_pedagogical_manager: boolean;
};

/** Paramètres > Équipe — interrupteur Responsable pédagogique. */
export function EquipeSettingsPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/super/equipe");
        const json = (await res.json()) as { members?: Member[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Chargement impossible");
        setMembers(json.members ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggle(member: Member, next: boolean) {
    setSavingId(member.id);
    try {
      const res = await fetch("/api/super/equipe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: member.id, is_pedagogical_manager: next }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, is_pedagogical_manager: next } : m)),
      );
      toast.success(
        next
          ? `${member.label} est Responsable pédagogique`
          : `Rôle retiré pour ${member.label}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[#262A4A] bg-[#141731] p-6 text-[#F3F4FA]">
      <h2 className="font-[family-name:var(--font-plus-jakarta,inherit)] text-xl font-semibold">
        Équipe
      </h2>
      <p className="mt-1 text-sm text-[#A3A8C7]">
        Désignez les Responsables pédagogiques autorisés à valider une analyse du besoin Qualiopi
        (indicateur 4).
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-[#A3A8C7]">Chargement…</p>
      ) : members.length === 0 ? (
        <p className="mt-4 text-sm text-[#A3A8C7]">Aucun membre d’équipe actif.</p>
      ) : (
        <ul className="mt-5 divide-y divide-[#262A4A]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#F3F4FA]">{m.label}</p>
                {m.email ? (
                  <p className="truncate text-xs text-[#A3A8C7]">{m.email}</p>
                ) : null}
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs text-[#C9D2E8]">
                <span className="hidden sm:inline">Responsable pédagogique</span>
                <span className="sm:hidden">RP</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#6E5BFF]"
                  checked={m.is_pedagogical_manager}
                  disabled={savingId === m.id}
                  onChange={(e) => void toggle(m, e.target.checked)}
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
