"use client";

import { PROPOSAL_FIELD_LABEL, type SeoProposalField, type SeoProposalRecord } from "@/lib/seo/proposals";
import type { SeoDraftFields } from "@/lib/seo/draft";

function asText(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
}

function faqLines(value: unknown) {
  if (!Array.isArray(value)) return asText(value);
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const row = item as { question?: string; answer?: string };
      return `${row.question ?? ""}\n${row.answer ?? ""}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function applyProposalToDraft(draft: SeoDraftFields, proposal: SeoProposalRecord): SeoDraftFields {
  if (proposal.field === "title") return { ...draft, title: asText(proposal.new_value) };
  if (proposal.field === "meta_description") return { ...draft, meta_description: asText(proposal.new_value) };
  if (proposal.field === "ai_summary") return { ...draft, ai_summary: asText(proposal.new_value) };
  if (proposal.field === "faq" && Array.isArray(proposal.new_value)) {
    return {
      ...draft,
      faq: proposal.new_value.map((item) => {
        const row = item as { question?: string; answer?: string };
        return { question: row.question ?? "", answer: row.answer ?? "" };
      }),
    };
  }
  return draft;
}

export function SeoProposalPanel({
  proposals,
  onAccept,
  onIgnore,
  onAcceptAll,
  batch,
}: {
  proposals: SeoProposalRecord[];
  onAccept: (proposal: SeoProposalRecord) => void;
  onIgnore: (proposal: SeoProposalRecord) => void;
  onAcceptAll?: () => void;
  batch?: { index: number; total: number; onNext: () => void } | null;
}) {
  const pending = proposals.filter((item) => item.status === "pending");
  if (!pending.length && !batch) return null;
  return (
    <section className="rounded-[24px] border border-[#6E5BFF] bg-[#161B3A] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#EEF1F8]">Propositions de Byound AI</h3>
          <p className="mt-1 text-sm text-[#AEB6CC]">Acceptez ou ignorez chaque champ. Rien n’est publié tant que vous ne cliquez pas sur Publier.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pending.length && onAcceptAll ? (
            <button
              type="button"
              onClick={onAcceptAll}
              className="h-9 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Accepter tout pour cette page
            </button>
          ) : null}
          {batch ? (
            <button
              type="button"
              onClick={batch.onNext}
              className="h-9 rounded-full border border-[#6E5BFF] px-4 text-sm font-semibold text-[#EEF1F8] outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
            >
              Suivante ({batch.index + 1}/{batch.total})
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {pending.map((item) => {
          const oldText = item.field === "faq" ? faqLines(item.old_value) : asText(item.old_value);
          const newText = item.field === "faq" ? faqLines(item.new_value) : asText(item.new_value);
          return (
            <article key={item.id} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4">
              <p className="text-sm font-medium text-[#EEF1F8]">{PROPOSAL_FIELD_LABEL[item.field as SeoProposalField] ?? item.field}</p>
              {oldText ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#D6334A] line-through decoration-[#D6334A]">{oldText}</p>
              ) : (
                <p className="mt-2 text-sm text-[#5D6785]">(vide)</p>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#1F9D57]">{newText}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onAccept(item)}
                  className="h-8 rounded-full bg-[#0E2A1D] px-3 text-xs font-semibold text-[#1F9D57] outline-none focus-visible:ring-2 focus-visible:ring-[#1F9D57]"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  onClick={() => onIgnore(item)}
                  className="h-8 rounded-full bg-[#0B1122] px-3 text-xs font-semibold text-[#AEB6CC] outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
                >
                  Ignorer
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
