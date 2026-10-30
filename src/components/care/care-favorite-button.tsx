"use client";

import { useEffect, useState } from "react";

export function CareFavoriteButton({ expertId, name }: { expertId: string; name: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const stored = readLocal();
    setOn(stored.includes(expertId));
    void fetch("/api/care/favorites")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { ids?: string[] } | null) => {
        if (!json?.ids) return;
        setOn(json.ids.includes(expertId));
      })
      .catch(() => undefined);
  }, [expertId]);

  async function toggle() {
    const next = !on;
    setOn(next);
    const local = readLocal().filter((id) => id !== expertId);
    if (next) local.push(expertId);
    localStorage.setItem(STORAGE, JSON.stringify(local));
    await fetch("/api/care/favorites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expertId, on: next }),
    }).catch(() => undefined);
  }

  return (
    <button type="button" className="cf-heart" aria-pressed={on} aria-label={on ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`} onClick={() => void toggle()}>
      {on ? "♥" : "♡"}
    </button>
  );
}

const STORAGE = "care-favorites";

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
