"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";

type BadgeOption = { id: string; name: string };

export function ExpertAssignmentsPanel({
  expertId,
  specialties,
  openBadges,
}: {
  expertId: string;
  specialties: string[] | null;
  openBadges: unknown;
}) {
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeOption[]>([]);
  const [cursus, setCursus] = useState<string[]>(() =>
    CFA_SPECIALIZATIONS.filter((item) => (specialties ?? []).includes(item.label)).map((item) => item.value),
  );
  const [selectedBadges, setSelectedBadges] = useState<string[]>(() => {
    if (!Array.isArray(openBadges)) return [];
    return openBadges
      .map((badge) => (badge && typeof badge === "object" ? String((badge as { id?: string }).id ?? "") : ""))
      .filter(Boolean);
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/super-admin/experts/catalog")
      .then((response) => response.json())
      .then((result) => setBadges(result.badges ?? []))
      .catch(() => setBadges([]));
  }, []);

  function toggle(list: string[], value: string, setList: (next: string[]) => void) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/super/experts/${expertId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_assignments",
          cursus,
          openBadges: badges.filter((badge) => selectedBadges.includes(badge.id)),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      setMessage("Cursus et open badges enregistrés.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#10243f] p-5">
      <h2 className="text-base font-semibold text-[#f8fbff]">Cursus et open badges</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-[#9eb0cc]">Cursus</legend>
          <div className="mt-2 space-y-2">
            {CFA_SPECIALIZATIONS.map((item) => (
              <label key={item.value} className="flex items-center gap-2 text-sm text-[#f8fbff]">
                <input
                  type="checkbox"
                  checked={cursus.includes(item.value)}
                  onChange={() => toggle(cursus, item.value, setCursus)}
                  className="h-4 w-4 accent-[#635BFF]"
                />
                {item.group} — {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-[#9eb0cc]">Open badges</legend>
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
            {badges.length === 0 ? <p className="text-sm text-[#9eb0cc]">Aucun open badge disponible.</p> : null}
            {badges.map((badge) => (
              <label key={badge.id} className="flex items-center gap-2 text-sm text-[#f8fbff]">
                <input
                  type="checkbox"
                  checked={selectedBadges.includes(badge.id)}
                  onChange={() => toggle(selectedBadges, badge.id, setSelectedBadges)}
                  className="h-4 w-4 accent-[#635BFF]"
                />
                {badge.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-[#635BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message ? <p className="text-sm text-[#d5e0f2]">{message}</p> : null}
      </div>
    </section>
  );
}
