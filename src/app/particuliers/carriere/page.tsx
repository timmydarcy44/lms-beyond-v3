"use client";

import React, { useEffect, useMemo, useState } from "react";

type DiscScores = { D: number; I: number; S: number; C: number };

export default function ParticuliersCarrierePage() {
  const [firstName, setFirstName] = useState("Joe");
  const [resultLabel, setResultLabel] = useState("Profil Influent");
  const [scores, setScores] = useState<DiscScores>({ D: 0, I: 0, S: 0, C: 0 });

  useEffect(() => {
    try {
      const storedName = sessionStorage.getItem("particulierFirstName");
      if (storedName) setFirstName(storedName);
      const stored = sessionStorage.getItem("particulierDiscResult");
      if (stored) {
        const parsed = JSON.parse(stored) as {
          label?: string;
          scores?: DiscScores;
        };
        if (parsed?.label) setResultLabel(parsed.label);
        if (parsed?.scores) setScores(parsed.scores);
      }
    } catch {
      // ignore
    }
  }, []);

  const chartData = useMemo(
    () => [
      { key: "D", label: "Dominance", value: scores.D, color: "#EF4444" },
      { key: "I", label: "Influence", value: scores.I, color: "#F59E0B" },
      { key: "S", label: "Stabilité", value: scores.S, color: "#10B981" },
      { key: "C", label: "Conformité", value: scores.C, color: "#3B82F6" },
    ],
    [scores]
  );

  const displayName = firstName || "Joe";
  const shortLabel = resultLabel.replace(/^Profil\s+/i, "");

  return (
    <div className="min-h-screen bg-white text-black">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16 font-['Inter']">
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          Félicitations {displayName}, ton profil {shortLabel} va t&apos;aider à...
        </h1>
        <p className="mt-3 text-[14px] text-black/70">
          Ton résultat principal : <span className="font-semibold">{resultLabel}</span>
        </p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
          <div className="text-[12px] text-black/60">Histogramme comportemental</div>
          <div className="mt-4 flex h-24 items-end gap-3">
            {chartData.map((item) => {
              const maxScore = Math.max(scores.D, scores.I, scores.S, scores.C, 1);
              const height = Math.round((item.value / maxScore) * 80);
              return (
                <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${height}px`,
                      background: item.color,
                    }}
                  />
                  <div className="text-[10px] font-semibold text-black/70">{item.label}</div>
                  <div className="text-[11px] font-semibold text-black">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
