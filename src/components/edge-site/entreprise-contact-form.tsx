"use client";

import { useState } from "react";
import { EdgeButton } from "@/components/edge-site/edge-button";

export function EntrepriseContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="mt-8 text-[15px] text-black/40">
        Merci — un conseiller EDGE vous recontacte sous 48h ouvrées.
      </p>
    );
  }

  const fieldClass =
    "mt-2 w-full border border-black/15 bg-white px-4 py-3 text-[14px] text-edge-black outline-none focus:border-edge-red";

  return (
    <form
      className="mt-10 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Nom</span>
        <input required name="nom" className={fieldClass} />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Email professionnel</span>
        <input required type="email" name="email" className={fieldClass} />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Entreprise</span>
        <input required name="entreprise" className={fieldClass} />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Taille équipe</span>
        <select required name="taille" className={fieldClass} defaultValue="">
          <option value="" disabled>
            Sélectionner
          </option>
          <option value="1-10">1–10</option>
          <option value="11-50">11–50</option>
          <option value="51-200">51–200</option>
          <option value="200+">200+</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">Message</span>
        <textarea required name="message" rows={4} className={`${fieldClass} resize-y`} />
      </label>
      <EdgeButton type="submit" ariaLabel="Envoyer la demande">
        Envoyer la demande
      </EdgeButton>
    </form>
  );
}
