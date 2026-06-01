"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  disponible: boolean;
};

export default function PraticienDisponibilitesPage() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [date, setDate] = useState("");
  const [debut, setDebut] = useState("09:00");
  const [fin, setFin] = useState("10:00");

  const load = () => {
    void fetch("/api/marketplace/praticien/creneaux")
      .then((r) => r.json())
      .then((j) => setCreneaux((j as { creneaux?: Creneau[] }).creneaux ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const res = await fetch("/api/marketplace/praticien/creneaux", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, heure_debut: debut, heure_fin: fin }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Erreur");
      return;
    }
    toast.success("Créneau ajouté");
    load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/marketplace/praticien/creneaux?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Suppression impossible");
      return;
    }
    load();
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <Link href="/dashboard/praticien" className="text-sm text-violet-400">
        ← Tableau de bord
      </Link>
      <h1 className="mt-4 text-xl font-bold">Mes disponibilités</h1>

      <div className="mt-6 grid max-w-md gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 bg-slate-900" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Début</Label>
            <Input type="time" value={debut} onChange={(e) => setDebut(e.target.value)} className="mt-1 bg-slate-900" />
          </div>
          <div>
            <Label>Fin</Label>
            <Input type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="mt-1 bg-slate-900" />
          </div>
        </div>
        <Button onClick={() => void add()} disabled={!date}>
          Ajouter un créneau
        </Button>
      </div>

      <ul className="mt-8 space-y-2">
        {creneaux.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-2 text-sm"
          >
            <span>
              {c.date} {String(c.heure_debut).slice(0, 5)}–{String(c.heure_fin).slice(0, 5)}
              {!c.disponible && " (réservé)"}
            </span>
            {c.disponible && (
              <button type="button" className="text-red-400" onClick={() => void remove(c.id)}>
                Supprimer
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
