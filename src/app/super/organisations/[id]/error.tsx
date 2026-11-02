"use client";

export default function CompteClientError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <p className="text-sm text-[#C9D2E8]">Le compte n'a pas pu être affiché.</p>
      <button type="button" onClick={reset} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Réessayer</button>
    </div>
  );
}
