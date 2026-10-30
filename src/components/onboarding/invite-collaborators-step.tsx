"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = {
  organisationId: string;
  companyName: string;
  importedCount: number;
  sansEmail: number;
  senderName: string;
  onBack: () => void;
  onFinish: () => void;
};

export function InviteCollaboratorsStep({
  organisationId,
  companyName,
  importedCount,
  sansEmail,
  senderName,
  onBack,
  onFinish,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const withEmail = Math.max(0, importedCount - sansEmail);
  const count = withEmail > 0 ? withEmail : importedCount;
  const title = count > 0 ? `Invitez vos ${count} collaborateurs` : "Invitez vos collaborateurs";

  const sendInvites = async () => {
    if (when === "later") return;
    if (withEmail === 0) {
      onFinish();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/invite-collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisation_id: organisationId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      onFinish();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-[36px] font-extrabold leading-tight tracking-[-1.2px]">{title}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6B6F7A]">
        Ils reçoivent un email pour activer leur compte. Vous pourrez relancer à tout moment.
      </p>

      <div className="mt-8 rounded-[24px] border border-[#E3E0D8] bg-white p-6">
        <p className="text-[13px] font-extrabold text-[#6B6F7A]">Aperçu de l&apos;email</p>
        <p className="mt-3 text-[14px]">
          <span className="text-[#6B6F7A]">De </span>
          {senderName || "Vous"} via Byound
        </p>
        <p className="mt-1 text-[16px] font-extrabold">{companyName || "Votre entreprise"} vous invite sur Byound</p>
        <p className="mt-4 text-[15px] leading-relaxed text-[#3A3D45]">
          Bonjour {"{prénom}"}
          {message ? `, ${message}` : ". Votre espace est prêt. Activez votre compte pour commencer."}
        </p>
        <span className="mt-5 inline-flex h-12 items-center rounded-full bg-[#6E5BFF] px-5 text-[14px] font-extrabold text-white">
          Activer mon compte
        </span>
        <button type="button" onClick={() => setEditing((value) => !value)} className="mt-4 block text-[14px] font-extrabold text-[#4B3BD1]">
          Personnaliser le message
        </button>
        {editing ? (
          <textarea
            value={message}
            maxLength={600}
            onChange={(event) => setMessage(event.target.value.slice(0, 600))}
            className="mt-3 h-28 w-full rounded-[18px] border border-[#E3E0D8] p-4 text-[15px] outline-none focus:ring-2 focus:ring-[#6E5BFF]"
          />
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["now", "Envoyer maintenant"],
            ["later", "Programmer"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setWhen(id)}
            className={`rounded-[20px] bg-white p-4 text-left text-[15px] font-extrabold ${
              when === id ? "border-2 border-[#07080B]" : "border border-[#E3E0D8]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {when === "later" ? (
        <p className="mt-3 text-[13px] text-[#6B6F7A]">
          La programmation n&apos;est pas encore disponible. Envoyez maintenant, ou passez cette étape.
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Retour" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#E3E0D8] bg-white text-[22px]">
          ‹
        </button>
        <button
          type="button"
          onClick={() => void sendInvites()}
          disabled={loading || when === "later"}
          className="h-14 flex-1 rounded-full bg-[#6E5BFF] text-[16px] font-extrabold text-white disabled:opacity-60"
        >
          {loading ? "Envoi…" : count > 0 ? `Envoyer ${count} invitations` : "Continuer"}
        </button>
      </div>
    </div>
  );
}
