"use client";

import { useState } from "react";

import { COPPER, SF_PRO } from "@/lib/clement-lepley/constants";

export function ClementLepleyContact() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/clement-lepley/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, message }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Envoi impossible.");
      }

      setSuccess(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="bg-[#0a0a0a] px-6 py-24 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2" style={{ fontFamily: SF_PRO }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: COPPER }}>
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Parlons de votre projet
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            Un diagnostic gratuit sur site, un devis personnalisé ou une simple question — Clément
            Lepley vous répond rapidement.
          </p>
          <div className="mt-10 space-y-4 text-sm text-white/70">
            <p>
              <span className="font-medium text-white">E-mail</span>
              <br />
              contact@clementlepley.fr
            </p>
            <p>
              <span className="font-medium text-white">Téléphone</span>
              <br />
              06 00 00 00 00
            </p>
            <p>
              <span className="font-medium text-white">Zone d&apos;intervention</span>
              <br />
              Le Havre et agglomération — Normandie
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
            />
            <input
              required
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
            />
          </div>
          <input
            required
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
          />
          <input
            required
            type="tel"
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
          />
          <textarea
            required
            placeholder="Décrivez votre projet…"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-none rounded-sm border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {loading ? "Envoi…" : "Envoyer ma demande"}
          </button>

          {success ? (
            <p className="text-sm text-emerald-400">Message envoyé — nous vous recontactons rapidement.</p>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}
