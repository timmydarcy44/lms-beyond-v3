"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import {
  CONTRIBUTOR_ROLE_HELP,
  CONTRIBUTOR_ROLE_LABELS,
  CONTRIBUTOR_ROLES,
  contributorDisplayName,
  parseContributorProfile,
  type ContributorRole,
} from "@/lib/expert/contributor-profile";

type BadgeOption = { id: string; name: string };

export function ExpertAssignmentsPanel({
  expertId,
  specialties,
  openBadges,
  references,
  headline,
  firstName,
  lastName,
}: {
  expertId: string;
  specialties: string[] | null;
  openBadges: unknown;
  references: unknown;
  headline: string | null;
  firstName: string | null;
  lastName: string | null;
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
  const initialProfile = parseContributorProfile(references, headline);
  const [roles, setRoles] = useState<ContributorRole[]>(initialProfile.roles);
  const [jobTitle, setJobTitle] = useState(initialProfile.jobTitle);
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
    if (roles.length === 0) {
      setMessage("Choisissez Expert, Formateur, ou les deux.");
      return;
    }
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
          roles,
          jobTitle,
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
      <h2 className="text-base font-semibold text-[#f8fbff]">Rôle, légende et cursus</h2>
      <p className="mt-2 text-sm text-[#d5e0f2]">
        {contributorDisplayName(firstName, lastName) || "Nom à préciser"}
        {jobTitle ? ` — ${jobTitle}` : ""}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CONTRIBUTOR_ROLES.map((role) => (
          <label key={role} className="rounded-xl border border-white/10 bg-[#071225] px-3 py-3 text-sm text-[#f8fbff]">
            <span className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => toggle(roles, role, (next) => setRoles(next as ContributorRole[]))}
                className="h-4 w-4 accent-[#635BFF]"
              />
              {CONTRIBUTOR_ROLE_LABELS[role]}
            </span>
            <span className="mt-1 block pl-6 text-xs text-[#9eb0cc]">{CONTRIBUTOR_ROLE_HELP[role]}</span>
          </label>
        ))}
      </div>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#9eb0cc]">
        Poste sous la photo
        <input
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="Responsable commercial hospitalité, Racing 92"
          className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#071225] px-3 text-sm font-normal normal-case tracking-normal text-[#f8fbff] outline-none focus:border-[#635BFF]"
        />
      </label>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
