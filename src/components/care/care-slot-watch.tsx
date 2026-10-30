"use client";

import { useState } from "react";

export function CareSlotWatch({ expertId }: { expertId: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await fetch("/api/care/slot-watch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expertId, email }),
    });
    if (!res.ok) {
      setError("Indiquez un email valide.");
      return;
    }
    setDone(true);
  }

  if (done) return <p className="cf-watch-done">On vous prévient dès qu&apos;un créneau s&apos;ouvre.</p>;

  return (
    <form className="cf-watch" onSubmit={(event) => void submit(event)}>
      <p>Pas de créneau en ligne · Rendez-vous sur demande</p>
      <label className="cf-sr" htmlFor={`watch-${expertId}`}>
        Email pour être prévenu
      </label>
      <input id={`watch-${expertId}`} type="email" required value={email} placeholder="Votre email" onChange={(event) => setEmail(event.target.value)} />
      <button type="submit">Être prévenu</button>
      {error ? <p>{error}</p> : null}
    </form>
  );
}
