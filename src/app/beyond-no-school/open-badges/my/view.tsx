"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AuthContext = {
  userId: string;
  orgId: string;
  role: string;
} | null;

type BadgeItem = {
  assessmentId: string;
  badgeClass: { id: string; name: string; imageUrl: string };
  status: string;
  lastUpdatedAt: string;
  note?: string | null;
  assertionId?: string | null;
  assertionUrl?: string | null;
  downloadUrl?: string | null;
};

const statusLabel = (status: string) => {
  switch (status) {
    case "ISSUED":
      return "Émis";
    case "NEEDS_INFO":
      return "Compléments requis";
    case "REJECTED":
      return "Refusé";
    case "APPROVED":
      return "Validé";
    case "SUBMITTED":
    default:
      return "En attente";
  }
};

export default function MyBadgesView({ auth }: { auth: AuthContext }) {
  const [items, setItems] = useState<BadgeItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/earner/badges/my", {
        headers: auth
          ? {
              "x-user-id": auth.userId,
              "x-org-id": auth.orgId,
              "x-user-role": auth.role,
            }
          : undefined,
      });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.items ?? []);
    };
    load();
  }, [auth]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Open Badges</p>
        <h1 className="text-pretty text-3xl font-semibold sm:text-4xl">Mes Badges</h1>
        <p className="text-sm text-white/70">
          Suivez vos demandes et exportez vos badges une fois émis.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
          Aucune demande pour l’instant.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.assessmentId}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{item.badgeClass.name}</p>
                  <p className="text-xs text-white/60">
                    Dernière mise à jour: {new Date(item.lastUpdatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-white/10 text-white">{statusLabel(item.status)}</Badge>
              </div>

              {item.status === "NEEDS_INFO" && item.note ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/70">
                  {item.note}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {item.status === "NEEDS_INFO" ? (
                  <Button
                    className="rounded-full bg-white px-4 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                    onClick={() => {
                      window.location.href = `/beyond-no-school/open-badges/${item.badgeClass.id}/submit`;
                    }}
                  >
                    Compléter
                  </Button>
                ) : null}
                {item.status === "ISSUED" && item.downloadUrl ? (
                  <Button
                    className="rounded-full bg-white px-4 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                    onClick={() => window.open(item.downloadUrl ?? "", "_blank")}
                  >
                    Exporter
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
