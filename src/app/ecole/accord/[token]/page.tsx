"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function AccordPage() {
  const params = useParams<{ token: string }>();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setError("");
    const response = await fetch("/api/cfa/accord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "L'accord n'a pas pu être enregistré.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-[#F6F4EF] px-4 py-10 text-[#1A0C04]">
      <article className="mx-auto max-w-xl rounded-[28px] bg-white p-6">
        <h1 className="text-3xl font-extrabold">Transmission de votre profil</h1>
        <p className="mt-4 text-sm leading-6">Byound School souhaite pouvoir transmettre votre profil à des entreprises partenaires : prénom, nom, cursus, disponibilité, motivation, et uniquement les bilans que vous avez déjà choisis de partager. Aucune donnée administrative n'est incluse.</p>
        {done ? <p className="mt-6 text-sm font-extrabold text-[#0E7A52]">Votre accord est enregistré. Vous pouvez le retirer depuis votre candidature.</p> : (
          <button type="button" className="mt-6 h-11 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white" onClick={() => void accept()}>J'accepte</button>
        )}
        {error ? <p className="mt-3 text-sm text-[#B42318]">{error}</p> : null}
      </article>
    </main>
  );
}
