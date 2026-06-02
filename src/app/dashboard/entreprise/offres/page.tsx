"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { cn } from "@/lib/utils";

type InternalFormation = {
  id: string;
  title: string;
  status: string;
  raw_status: string;
  created_at: string | null;
};

type EdgeItem = {
  id: string;
  title: string;
  tier: string;
  description: string;
  badge: string;
  available: boolean;
};

export default function EntrepriseOffresPage() {
  const [tab, setTab] = useState<"internes" | "edge">("internes");
  const [loading, setLoading] = useState(true);
  const [internal, setInternal] = useState<InternalFormation[]>([]);
  const [edge, setEdge] = useState<EdgeItem[]>([]);
  const [edgeTier, setEdgeTier] = useState(1);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/entreprise/offres", { credentials: "include" });
        const json = await res.json();
        if (res.ok) {
          setInternal(json.internal_formations ?? []);
          setEdge(json.edge_catalogue ?? []);
          setEdgeTier(json.edge_tier ?? 1);
          setOrgName(json.organisation?.name ?? "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusClass = (status: string) => {
    if (status === "Actif") return "bg-emerald-50 text-emerald-700";
    if (status === "Archivé") return "bg-gray-100 text-gray-500";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Formations & Parcours</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">Mes Offres</h1>
            {orgName ? <p className="mt-1 text-sm text-gray-500">{orgName}</p> : null}
          </div>
          <Link
            href="/dashboard/formateur/parcours/new"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500"
          >
            <Plus size={16} />
            Créer une formation
          </Link>
        </header>

        <div className="mb-6 flex gap-2">
          {(
            [
              { key: "internes" as const, label: "Formations internes" },
              { key: "edge" as const, label: "Catalogue EDGE" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                tab === t.key
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
        ) : tab === "internes" ? (
          internal.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-4 font-semibold text-gray-900">Aucune formation interne</p>
              <p className="mt-2 text-sm text-gray-500">
                Créez votre première formation pour vos collaborateurs.
              </p>
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
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900">{f.title}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        statusClass(f.status),
                      )}
                    >
                      {f.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {f.updated_at
                      ? `Mis à jour le ${new Date(f.updated_at).toLocaleDateString("fr-FR")}`
                      : "Parcours interne"}
                  </p>
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
      </main>
    </div>
  );
}
