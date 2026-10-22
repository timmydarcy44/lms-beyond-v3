"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ExpertPole } from "@/lib/expert/pole-model";

export function ExpertPoleSwitcher({ pole }: { pole: ExpertPole }) {
  const router = useRouter();
  const [pending, setPending] = useState<ExpertPole | null>(null);

  const choose = async (next: ExpertPole) => {
    if (next === pole || pending) return;
    setPending(next);
    const response = await fetch("/api/expert/pole", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pole: next }),
    });
    setPending(null);
    if (response.ok) {
      window.dispatchEvent(new Event("expert-nav-refresh"));
      router.refresh();
    }
  };

  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-[#12141A] p-1" role="group" aria-label="Pôle actif">
      {(["formation", "care"] as const).map((item) => {
        const selected = pole === item;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={selected}
            disabled={pending !== null}
            onClick={() => void choose(item)}
            className={`rounded-full px-3 py-2 text-sm font-extrabold ${selected ? "bg-[#F4F5F7] text-[#07080B]" : "text-[#DADDE4]"}`}
          >
            {item === "formation" ? "Formation" : "Care"}
          </button>
        );
      })}
    </div>
  );
}
