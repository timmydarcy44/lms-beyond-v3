"use client";

import { useState } from "react";

export function ProfileAnswer({ token, response }: { token: string; response: string | null }) {
  const [current, setCurrent] = useState(response);
  const [error, setError] = useState("");

  async function answer(next: "interested" | "declined") {
    setError("");
    const result = await fetch(`/api/cfa/profil/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: next }),
    });
    const data = await result.json();
    if (!result.ok) {
      setError(data.error || "La réponse n'a pas pu être enregistrée.");
      return;
    }
    setCurrent(next);
  }

  if (current === "interested") return <p className="mt-8 text-sm font-extrabold text-[#0E7A52]">Vous souhaitez rencontrer ce profil. Byound School en est informé.</p>;
  if (current === "declined") return <p className="mt-8 text-sm font-extrabold text-[#5C6370]">Vous avez indiqué que ce profil ne convient pas pour le moment.</p>;

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <button type="button" className="h-11 rounded-full bg-[#14A37F] px-4 text-sm font-extrabold text-[#04140C]" onClick={() => void answer("interested")}>Je souhaite le rencontrer</button>
      <button type="button" className="h-11 rounded-full border border-[#D9D3C7] px-4 text-sm font-extrabold" onClick={() => void answer("declined")}>Pas pour le moment</button>
      {error ? <p className="w-full text-sm text-[#B42318]">{error}</p> : null}
    </div>
  );
}
