"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  variant: "particulier" | "entreprise" | "invite";
  signupHref: string;
  signupLabel: string;
  initialEmail?: string;
};

export function EdgeAuthLinkErrorPanel({ variant, signupHref, signupLabel, initialEmail = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [resendState, setResendState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const title =
    variant === "invite"
      ? "Lien d'invitation expiré"
      : "Ce lien a expiré ou a déjà été utilisé";

  const description =
    variant === "invite"
      ? "Demandez une nouvelle invitation à votre responsable RH, ou contactez le support."
      : variant === "entreprise"
        ? "Les liens de confirmation sont valables 24 h. Demandez un nouvel email pour continuer votre inscription entreprise."
        : "Les liens de confirmation sont valables 24 h. Saisissez votre email pour recevoir un nouveau lien d'activation.";

  const handleResend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setResendState("error");
      setResendMessage("Saisissez une adresse email valide.");
      return;
    }

    setResendState("loading");
    setResendMessage(null);

    try {
      const response = await fetch("/api/particuliers/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || "Impossible d'envoyer un nouvel email.");
      }

      setResendState("success");
      setResendMessage(data.message || "Un nouvel email vient de vous être envoyé.");
    } catch (error) {
      setResendState("error");
      setResendMessage(error instanceof Error ? error.message : "Impossible d'envoyer un nouvel email.");
    }
  };

  const showResend = variant === "particulier";

  return (
    <div className="max-w-md text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-white/55">{description}</p>

      {showResend ? (
        <div className="mt-8 space-y-3 text-left">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            autoComplete="email"
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
          />
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendState === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0a0a0a] disabled:opacity-60"
          >
            {resendState === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              "Renvoyer un lien"
            )}
          </button>
          {resendMessage ? (
            <p
              className={`text-center text-[13px] ${
                resendState === "success" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {resendMessage}
              {resendState === "error" && resendMessage.includes("déjà activé") ? (
                <>
                  {" "}
                  <Link href="/particuliers/login" className="underline underline-offset-2">
                    Se connecter
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <a
        href={signupHref}
        className={`inline-flex rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white ${
          showResend ? "mt-4" : "mt-8"
        }`}
      >
        {signupLabel}
      </a>
    </div>
  );
}
