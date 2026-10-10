"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

import type { ByoundProgramFacts } from "@/lib/byound-school/program-facts";

const rows = [
  ["Format", "format"],
  ["Prochaine rentrée", "nextIntake"],
  ["Durée", "duration"],
  ["Volume", "volume"],
  ["Rythme", "rhythm"],
  ["Lieu", "location"],
  ["Niveau", "level"],
  ["Places disponibles", "seatsAvailable"],
] as const;

export function ProgramFactsCard({ facts }: { facts: ByoundProgramFacts }) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [lead, setLead] = useState({ lastName: "", firstName: "", email: "", phone: "" });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const isMobile = () => mobileQuery.matches;
    if (!isMobile()) setOpen(true);

    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (isMobile()) {
        if (y > 24 && Math.abs(y - last) > 4) setOpen(false);
        last = y;
        return;
      }
      if (y < 12) setOpen(true);
      else if (Math.abs(y - last) > 4) setOpen(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function requestPdf(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/ecole/program-brochure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, specialization: facts.specialization }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Téléchargement impossible.");
      setFormOpen(false);
      window.open(String(result.downloadUrl), "_blank", "noopener,noreferrer");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Téléchargement impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="pointer-events-auto w-[min(320px,calc(100vw-2.5rem))] space-y-3">
          <div className="rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-[0_16px_40px_rgba(7,11,31,0.12)]">
            <dl className="space-y-3.5">
              {rows.map(([label, key]) => (
                <div key={key} className="flex items-start justify-between gap-4 text-sm">
                  <dt className="shrink-0 text-black/45">{label}</dt>
                  <dd className="text-right font-semibold leading-snug text-[#070b1f]">{facts[key]}</dd>
                </div>
              ))}
            </dl>

            <Link
              href={facts.candidaterHref}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3b82f6] px-5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
            >
              Candidater
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setFormError(
                  facts.programPdfUrl ? "" : "Le programme n’est pas encore disponible au téléchargement.",
                );
                setFormOpen(true);
              }}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-[#f4f7fb] px-5 text-sm font-semibold text-[#3b82f6] transition hover:bg-[#ebf2fb]"
            >
              <Download className="h-4 w-4" />
              Télécharger le programme en PDF
            </button>
          </div>

          <details className="rounded-[24px] border border-black/[0.08] bg-white px-5 py-3 text-sm shadow-sm">
            <summary className="cursor-pointer list-none font-medium text-[#070b1f] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f1ff] text-xs">
                    ♿️
                  </span>
                  Accessibilité PSH
                </span>
                <span className="text-lg leading-none text-black/30">+</span>
              </span>
            </summary>
            <p className="mt-3 pb-1 text-sm leading-relaxed text-black/55">
              Locaux accessibles aux personnes en situation de handicap. Nos outils (LMS) sont
              également neuro-adaptatifs.
            </p>
          </details>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto inline-flex h-14 items-center gap-3 rounded-full bg-[#070b1f] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(7,11,31,0.28)] transition hover:-translate-y-0.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b82f6] text-xs">
            i
          </span>
          Infos & candidature
        </button>
      )}
      {formOpen ? (
        <div
          className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-[#070b1f]/55 p-4 sm:items-center"
          onClick={() => setFormOpen(false)}
        >
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => void requestPdf(event)}
            className="w-full max-w-md rounded-[28px] bg-white p-6 text-[#070b1f] shadow-2xl"
          >
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Télécharger le programme</h2>
            <p className="mt-1 text-sm text-black/55">
              Indiquez vos coordonnées pour recevoir la fiche du cursus.
            </p>
            <div className="mt-5 grid gap-3">
              {(
                [
                  ["lastName", "Nom", "text"],
                  ["firstName", "Prénom", "text"],
                  ["email", "Adresse mail", "email"],
                  ["phone", "Téléphone", "tel"],
                ] as const
              ).map(([key, label, type]) => (
                <label key={key} className="text-sm font-medium">
                  {label}
                  <input
                    required
                    type={type}
                    autoComplete={key === "email" ? "email" : key === "phone" ? "tel" : key === "firstName" ? "given-name" : "family-name"}
                    value={lead[key]}
                    onChange={(event) => setLead({ ...lead, [key]: event.target.value })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-black/10 bg-[#f7f8fb] px-3 text-sm font-normal outline-none focus:border-[#3b82f6]"
                  />
                </label>
              ))}
            </div>
            {formError ? <p className="mt-3 text-sm text-rose-600">{formError}</p> : null}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="h-11 flex-1 rounded-full border border-black/10 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !facts.programPdfUrl}
                className="h-11 flex-1 rounded-full bg-[#3b82f6] text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Envoi…" : "Télécharger"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
