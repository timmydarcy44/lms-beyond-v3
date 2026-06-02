"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type InternalFormation = {
  id: string;
  title: string;
  status: string;
  raw_status: string;
  updated_at: string | null;
};

type EdgeItem = {
  id: string;
  title: string;
  tier: string;
  description: string;
  badge: string;
  available: boolean;
};

export function OffresFormationsSection() {
  const [loading, setLoading] = useState(true);
  const [internal, setInternal] = useState<InternalFormation[]>([]);
  const [edge, setEdge] = useState<EdgeItem[]>([]);
  const [edgeTier, setEdgeTier] = useState(1);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/entreprise/offres", { credentials: "include" });
        const json = await res.json();
        if (res.ok) {
          setInternal(json.internal_formations ?? []);
          setEdge(json.edge_catalogue ?? []);
          setEdgeTier(json.edge_tier ?? 1);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [subTab, setSubTab] = useState<"internes" | "edge">("internes");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-500">Formations internes et catalogue EDGE</p>
        <Link
          href="/dashboard/formateur/parcours/new"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500"
        >
          <Plus size={16} />
          Créer une formation
        </Link>
      </div>

      <div className="flex gap-2">
        {(
          [
            { key: "internes" as const, label: "Formations internes" },
            { key: "edge" as const, label: "Catalogue EDGE" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSubTab(t.key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              subTab === t.key
                ? "bg-violet-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : subTab === "internes" ? (
        internal.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 font-semibold text-gray-900">Aucune formation interne</p>
            <p className="mt-2 text-sm text-gray-500">Créez votre première formation pour vos collaborateurs.</p>
            <Link
              href="/dashboard/formateur/parcours/new"
              className="mt-6 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Créer une formation →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {internal.map((f) => (
              <div
                key={f.id}
                className="rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
              >
                <p className="font-bold text-gray-900">{f.title}</p>
                <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                  {f.status}
                </span>
                <Link
                  href={`/dashboard/formateur/parcours/${f.id}`}
                  className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:text-violet-500"
                >
                  Gérer le parcours →
                </Link>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {edge.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
                !item.available && "opacity-60",
              )}
            >
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                {item.badge}
              </span>
              <p className="mt-3 font-bold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm text-gray-500">{item.description}</p>
              {item.available ? (
                <a
                  href="https://edgebs.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-violet-600 hover:text-violet-500"
                >
                  Découvrir sur EDGE →
                </a>
              ) : (
                <p className="mt-4 text-xs text-gray-400">
                  Disponible avec Beyond {item.tier} (votre niveau : {edgeTier})
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
