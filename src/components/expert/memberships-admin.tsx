"use client";

import { useEffect, useState } from "react";

import type { ExpertPole } from "@/lib/expert/pole-model";

type Row = {
  id: string;
  expert_id: string;
  pole: ExpertPole;
  status: "active" | "pending" | "suspended";
  joined_at: string | null;
};

export function MembershipsAdmin({
  experts,
  superAdmin,
  fixedPole,
}: {
  experts: Array<{ id: string; name: string }>;
  superAdmin: boolean;
  fixedPole?: ExpertPole;
}) {
  const [pole, setPole] = useState<ExpertPole>(fixedPole ?? "formation");
  const [rows, setRows] = useState<Row[]>([]);
  const [expertId, setExpertId] = useState(experts[0]?.id ?? "");
  const [managerId, setManagerId] = useState("");
  const [message, setMessage] = useState("");

  const load = async (next = pole) => {
    const response = await fetch(`/api/expert/memberships?pole=${next}`);
    const json = (await response.json()) as { memberships?: Row[]; error?: string };
    setRows(json.memberships ?? []);
    setMessage(json.error ?? "");
  };

  useEffect(() => {
    void load(pole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pole]);

  const add = async () => {
    const response = await fetch("/api/expert/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expertId, pole, status: "pending" }),
    });
    const json = (await response.json()) as { error?: string };
    setMessage(json.error ?? "Appartenance enregistrée");
    await load();
  };

  const setStatus = async (row: Row, status: Row["status"]) => {
    const response = await fetch("/api/expert/memberships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, pole: row.pole, status }),
    });
    const json = (await response.json()) as { error?: string };
    setMessage(json.error ?? "Statut mis à jour");
    await load();
  };

  const addManager = async () => {
    const response = await fetch("/api/expert/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "manager", userId: managerId, pole }),
    });
    const json = (await response.json()) as { error?: string };
    setMessage(json.error ?? "Responsable enregistré");
  };

  const nameOf = (id: string) => experts.find((expert) => expert.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#07080B]">
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-3xl font-extrabold">Appartenances</h1>
      {message ? <p className="text-sm">{message}</p> : null}
      {fixedPole ? null : (
        <div className="flex gap-2">
          {(["formation", "care"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setPole(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${pole === item ? "bg-[#07080B] text-white" : "border"}`}>
              {item === "formation" ? "Formation" : "Care"}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <select className="rounded-xl border px-3 py-2" value={expertId} onChange={(event) => setExpertId(event.target.value)}>
          {experts.map((expert) => (
            <option key={expert.id} value={expert.id}>
              {expert.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void add()} className="rounded-full bg-[#07080B] px-4 py-2 text-sm font-semibold text-white">
          Ajouter au pôle
        </button>
      </div>
      <ul className="space-y-3">
        {rows.filter((row) => row.pole === pole).map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
            <span>
              <span className="block font-semibold">{nameOf(row.expert_id)}</span>
              <span className="text-sm text-[#3A3D45]">
                {row.pole} · {row.status}
              </span>
            </span>
            <select className="rounded-xl border px-3 py-2" value={row.status} onChange={(event) => void setStatus(row, event.target.value as Row["status"])}>
              <option value="pending">En attente</option>
              <option value="active">Active</option>
              <option value="suspended">Suspendue</option>
            </select>
          </li>
        ))}
      </ul>
      {superAdmin ? (
        <div className="flex flex-wrap gap-2">
          <input className="rounded-xl border px-3 py-2" placeholder="Id utilisateur du responsable" value={managerId} onChange={(event) => setManagerId(event.target.value)} />
          <button type="button" onClick={() => void addManager()} className="rounded-full border px-4 py-2 text-sm font-semibold">
            Nommer le responsable du pôle
          </button>
        </div>
      ) : null}
    </div>
    </div>
  );
}
