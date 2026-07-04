"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, ExternalLink, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeOption = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  status: string;
};

type Props = {
  badgeClassId: string | null;
  badgeName: string;
  onSelect: (badge: { id: string; name: string; imageUrl: string | null }) => void;
  onClear: () => void;
};

export function TrainingOpenBadgePicker({ badgeClassId, badgeName, onSelect, onClear }: Props) {
  const [badges, setBadges] = useState<BadgeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/super/training-courses/open-badges")
      .then((r) => r.json())
      .then((json) => setBadges(json.badges ?? []))
      .finally(() => setLoading(false));
  }, []);

  const selected = badges.find((b) => b.id === badgeClassId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Open Badge</h3>
          <p className="text-xs text-gray-500">Sélectionnez un badge existant ou créez-en un nouveau.</p>
        </div>
        <Link
          href="/super/open-badges/badgeclasses/new"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#635BFF]/25 bg-[#635BFF]/8 px-3 py-2 text-xs font-semibold text-[#635BFF] hover:bg-[#635BFF]/12"
        >
          <Plus className="h-3.5 w-3.5" />
          Créer un badge
          <ExternalLink className="h-3 w-3 opacity-60" />
        </Link>
      </div>

      {(selected || badgeName) && (
        <div className="flex items-center gap-4 rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/5 p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
            {selected?.imageUrl ? (
              <Image src={selected.imageUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Award className="h-8 w-8 text-[#635BFF]" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">{selected?.name ?? badgeName}</p>
            {selected?.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{selected.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-gray-500 hover:text-red-600"
          >
            Retirer
          </button>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500">Badge existant</label>
        <select
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#635BFF]/40"
          value={badgeClassId ?? ""}
          disabled={loading}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) {
              onClear();
              return;
            }
            const badge = badges.find((b) => b.id === id);
            if (badge) onSelect({ id: badge.id, name: badge.name, imageUrl: badge.imageUrl });
          }}
        >
          <option value="">— Sélectionner un Open Badge —</option>
          {badges.map((badge) => (
            <option key={badge.id} value={badge.id}>
              {badge.name} ({badge.status})
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400">
        Après création d&apos;un badge dans l&apos;onglet dédié, revenez ici et rafraîchissez la liste pour le lier à cette formation.
      </p>
      <button
        type="button"
        onClick={() => {
          setLoading(true);
          void fetch("/api/super/training-courses/open-badges")
            .then((r) => r.json())
            .then((json) => setBadges(json.badges ?? []))
            .finally(() => setLoading(false));
        }}
        className={cn("text-xs font-semibold text-[#635BFF] hover:underline", loading && "opacity-50")}
      >
        Rafraîchir la liste des badges
      </button>
    </div>
  );
}
