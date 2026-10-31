"use client";

import { useState } from "react";
import { LinkedInBadgeShareButton } from "@/components/apprenant/linkedin-badge-share-button";
import type { WalletEvidenceChoice } from "@/lib/openbadges/v3/wallet-privacy";

type Props = {
  assertionId: string;
  isPublic: boolean;
  deliverablesShared: boolean;
  evidence: WalletEvidenceChoice[];
  badgeName: string;
  level?: number | null;
  shareUrl: string;
};

export function BadgeWalletPrivacy({ assertionId, isPublic, deliverablesShared, evidence, badgeName, level, shareUrl }: Props) {
  const [publicBadge, setPublicBadge] = useState(isPublic);
  const [shared, setShared] = useState(deliverablesShared);
  const [items, setItems] = useState(evidence);
  const [pending, setPending] = useState<string | null>(null);

  async function update(path: string, body: Record<string, unknown>, key: string) {
    setPending(key);
    const response = await fetch(`/api/earner/badges/assertions/${assertionId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(null);
    return response.ok;
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs text-black/70">
        <input
          type="checkbox"
          checked={publicBadge}
          disabled={pending === "public"}
          onChange={async (event) => {
            const next = event.target.checked;
            setPublicBadge(next);
            const ok = await update("visibility", { isPublic: next }, "public");
            if (!ok) setPublicBadge(!next);
          }}
        />
        Badge public
      </label>
      <label className="flex items-start gap-2 text-xs text-black/70">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={shared}
          disabled={pending === "company"}
          onChange={async (event) => {
            const next = event.target.checked;
            setShared(next);
            const ok = await update("company-share", { shared: next }, "company");
            if (!ok) setShared(!next);
          }}
        />
        <span>
          J&apos;accepte que mes livrables soient visibles par les entreprises
          <span className="mt-1 block text-black/45">Une entreprise connectée les voit sur la page du badge. Les résultats des tests restent privés.</span>
        </span>
      </label>
      {items.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-xs text-black/50">Livrables visibles sur la page publique</legend>
          {items.map((item) => (
            <label key={item.index} className="flex items-center gap-2 text-xs text-black/70">
              <input
                type="checkbox"
                checked={item.public}
                disabled={pending === `evidence-${item.index}`}
                onChange={async (event) => {
                  const next = event.target.checked;
                  setItems((current) => current.map((entry) => entry.index === item.index ? { ...entry, public: next } : entry));
                  const ok = await update("evidence", { index: item.index, public: next }, `evidence-${item.index}`);
                  if (!ok) {
                    setItems((current) => current.map((entry) => entry.index === item.index ? { ...entry, public: !next } : entry));
                  }
                }}
              />
              {item.name}
            </label>
          ))}
        </fieldset>
      ) : null}
      {publicBadge ? (
        <LinkedInBadgeShareButton badgeName={badgeName} level={level} shareUrl={shareUrl} variant="wallet-light" />
      ) : (
        <p className="text-xs text-black/45">Le partage LinkedIn s'affiche quand le badge est public.</p>
      )}
    </div>
  );
}
