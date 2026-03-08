"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ClassementRow = {
  pos: number;
  club: string;
  pts: number;
  diff: string;
  isClub?: boolean;
  relegate?: boolean;
};

type ClassementResponse = {
  classement: ClassementRow[];
  updatedAt: string;
  groupe: string;
  source: string;
};

export function ClassementWidget() {
  const [data, setData] = useState<ClassementResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/classement");
        if (!response.ok) return;
        const json = (await response.json()) as ClassementResponse;
        setData(json);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Classement N3 Normandie</div>
          <span className="text-xs text-white/40">Mis à jour</span>
        </div>
        <div className="mt-4 text-xs text-white/40">Chargement du classement…</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Classement N3 Normandie</div>
        <span className="text-xs text-white/40">Mis à jour</span>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-left text-xs text-white/70">
          <thead className="bg-white/5 text-[10px] uppercase text-white/40">
            <tr>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Club</th>
              <th className="px-2 py-2">Pts</th>
              <th className="px-2 py-2">+/-</th>
            </tr>
          </thead>
          <tbody>
            {data.classement.map((row) => (
              <tr
                key={row.club}
                className={cn(
                  "border-t border-white/5",
                  row.isClub && "bg-[#C8102E]/20 border border-[#C8102E]/40 font-bold text-white",
                  !row.isClub && row.pos === 1 && "bg-green-500/10 text-green-300/70",
                  !row.isClub && row.pos >= 12 && "bg-red-500/10 text-red-300/70"
                )}
              >
                <td className="px-2 py-2">{row.pos}</td>
                <td className="px-2 py-2">{row.club}</td>
                <td className="px-2 py-2">{row.pts}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-between">
                    <span>{row.diff}</span>
                    {row.isClub && <ArrowUpRight className="h-3 w-3 text-white/70" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-white/30">↑ Promotion N2  ↓ Relégation R1</div>
    </div>
  );
}
