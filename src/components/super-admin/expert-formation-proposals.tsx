"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { FormationProposal } from "@/lib/expert/formation-proposals";

const STATUS: Record<FormationProposal["status"], string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Refusée",
};

const STATUS_CLASS: Record<FormationProposal["status"], string> = {
  pending: "bg-[#F6E7C8] text-[#7A5410]",
  approved: "bg-[#DDF6EA] text-[#0C6B45]",
  rejected: "bg-[#FDE4E4] text-[#9B2C2C]",
};

function linesOf(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").replace(/^#{1,3}\s*/, "").trim())
    .filter(Boolean);
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={index} className="font-semibold text-[#10233F]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function Prose({ value }: { value: string }) {
  return (
    <div className="space-y-3">
      {linesOf(value).map((line, index) => (
        <p key={index}>
          <Inline text={line} />
        </p>
      ))}
    </div>
  );
}

function BulletList({ value }: { value: string }) {
  const lines = linesOf(value);
  if (lines.length < 2) return <Prose value={value} />;
  return (
    <ul className="space-y-2.5">
      {lines.map((line, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6E5BFF]" />
          <span>
            <Inline text={line} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-[#F6F8FC] px-4 py-4">
      <h4 className="text-sm font-semibold text-[#10233F]">{label}</h4>
      <div className="mt-3 text-sm leading-relaxed text-[#3C4C68]">{children}</div>
    </section>
  );
}

function chips(value: string) {
  return linesOf(value)
    .flatMap((line) => line.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function FormationSheet({ proposal, onClose }: { proposal: FormationProposal; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const publics = chips(proposal.audience);
  const price = proposal.priceEur != null ? `${proposal.priceEur.toLocaleString("fr-FR")} €` : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[#050914]/75 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="formation-proposal-title"
        className="flex max-h-[min(92vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white text-[#10233F] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#E6EAF2] px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[proposal.status]}`}>
              {STATUS[proposal.status]}
            </span>
            <h3 id="formation-proposal-title" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-[28px]">
              {proposal.title}
            </h3>
            {price ? <p className="mt-2 text-lg font-semibold text-[#10233F]">{price}</p> : null}
            {proposal.formats.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {proposal.formats.map((format) => (
                  <span key={format} className="rounded-full bg-[#EEEBFF] px-3 py-1 text-xs font-semibold text-[#4B3BD1]">
                    {format}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-[#10233F] px-4 py-2 text-sm font-semibold text-white"
          >
            Fermer
          </button>
        </header>
        <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {proposal.presentation.trim() ? (
            <Section label="Description">
              <Prose value={proposal.presentation} />
            </Section>
          ) : null}
          {proposal.objectives.trim() ? (
            <Section label="Objectifs pédagogiques">
              <BulletList value={proposal.objectives} />
            </Section>
          ) : null}
          {proposal.prerequisites.trim() ? (
            <Section label="Prérequis">
              <BulletList value={proposal.prerequisites} />
            </Section>
          ) : null}
          {publics.length ? (
            <Section label="Publics">
              <div className="flex flex-wrap gap-2">
                {publics.map((item) => (
                  <span key={item} className="rounded-full border border-[#E1E6F0] bg-white px-3 py-1 text-xs font-semibold text-[#10233F]">
                    {item}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}
          {proposal.content.trim() ? (
            <Section label="Contenu">
              <BulletList value={proposal.content} />
            </Section>
          ) : null}
        </div>
      </article>
    </div>,
    document.body,
  );
}

export function ExpertFormationProposals({ proposals }: { proposals: FormationProposal[] }) {
  const [open, setOpen] = useState<FormationProposal | null>(null);

  return (
    <section className="rounded-[28px] border border-[#1A2340] bg-[#111831]">
      <div className="border-b border-[#1A2340] px-6 py-5">
        <h2 className="text-[18px] font-extrabold text-white">Propositions de formation</h2>
      </div>
      <div className="p-6">
        {proposals.length === 0 ? (
          <p className="text-sm text-[#9AA3BD]">Aucune proposition de formation.</p>
        ) : (
          <ul className="space-y-3">
            {proposals.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1A2340] bg-[#0B1122] px-4 py-3">
                <div>
                  <p className="text-sm font-extrabold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-[#9AA3BD]">
                    {STATUS[item.status]}
                    {item.priceEur != null ? ` · ${item.priceEur.toLocaleString("fr-FR")} €` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(item)}
                  className="rounded-full bg-[#07080B] px-4 py-2 text-sm font-semibold text-white"
                >
                  Voir la formation
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open ? <FormationSheet proposal={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
