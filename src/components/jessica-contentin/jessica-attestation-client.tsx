"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import {
  buildJessicaAttestationBody,
  formatFrenchLongDate,
  guessCivility,
  type JessicaAttestationCivility,
} from "@/lib/jessica-contentin/jessica-attestation-shared";
import { cn } from "@/lib/utils";

export type JessicaAttestationContact = {
  id: string;
  label: string;
  email: string;
  firstName?: string | null;
};

type Props = {
  contacts: JessicaAttestationContact[];
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function JessicaAttestationClient({ contacts }: Props) {
  const [contactId, setContactId] = useState("");
  const [civility, setCivility] = useState<JessicaAttestationCivility>("Madame");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [consultationDate, setConsultationDate] = useState(todayIso());
  const [consultationTime, setConsultationTime] = useState("10:00");
  const [concerning, setConcerning] = useState("");
  const [issuedDate, setIssuedDate] = useState(todayIso());
  const [bodyText, setBodyText] = useState("");
  const [bodyTouched, setBodyTouched] = useState(false);
  const [emailMessage, setEmailMessage] = useState(
    "Veuillez trouver en pièce jointe votre attestation de présence à une consultation.",
  );
  const [sending, setSending] = useState(false);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [contacts],
  );

  const generatedBody = useMemo(
    () =>
      buildJessicaAttestationBody({
        civility,
        fullName: fullName || "……………………",
        consultationDate,
        consultationTime,
        concerning: concerning.trim() || null,
        issuedDate,
      }),
    [civility, fullName, consultationDate, consultationTime, concerning, issuedDate],
  );

  useEffect(() => {
    if (!bodyTouched) setBodyText(generatedBody);
  }, [generatedBody, bodyTouched]);

  const onSelectContact = (id: string) => {
    setContactId(id);
    const c = sortedContacts.find((x) => x.id === id);
    if (!c) return;
    setFullName(c.label);
    setEmail(c.email);
    setCivility(guessCivility(c.firstName, c.label));
    setBodyTouched(false);
  };

  const handleSend = async () => {
    if (!email.includes("@") || !fullName.trim()) {
      toast.error("Choisissez une personne (nom + email)");
      return;
    }
    if (!consultationDate || !consultationTime) {
      toast.error("Indiquez la date et l'heure de consultation");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/jessica-attestation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          civility,
          consultationDate,
          consultationTime,
          concerning: concerning.trim() || null,
          issuedDate,
          bodyOverride: bodyText.trim(),
          emailMessage: emailMessage.trim(),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      toast.success(`Attestation envoyée à ${email.trim()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  const previewBody = bodyText.trim() || generatedBody;

  return (
    <JessicaSuperPage
      title="Attestation de présence"
      subtitle="Créer une attestation, prévisualiser, modifier si besoin, puis envoyer"
      backHref="/super/jessica-administratif"
      backLabel="Administratif"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <section className={cn(jessicaSuper.card, "p-6")}>
          <h2 className="mb-5 text-base font-semibold text-black">Créer une attestation</h2>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Personne</Label>
              <select
                className={cn(jessicaSuper.input, "w-full")}
                value={contactId}
                onChange={(e) => onSelectContact(e.target.value)}
              >
                <option value="">Choisir un client…</option>
                {sortedContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Civilité</Label>
                <select
                  className={cn(jessicaSuper.input, "w-full")}
                  value={civility}
                  onChange={(e) => {
                    setCivility(e.target.value as JessicaAttestationCivility);
                    setBodyTouched(false);
                  }}
                >
                  <option value="Madame">Madame</option>
                  <option value="Monsieur">Monsieur</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Nom complet</Label>
                <Input
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setBodyTouched(false);
                  }}
                  className={jessicaSuper.input}
                  placeholder="Prénom NOM"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email d&apos;envoi</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={jessicaSuper.input}
                placeholder="email@exemple.fr"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Date de consultation</Label>
                <Input
                  type="date"
                  value={consultationDate}
                  onChange={(e) => {
                    setConsultationDate(e.target.value);
                    setBodyTouched(false);
                  }}
                  className={jessicaSuper.input}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={consultationTime}
                  onChange={(e) => {
                    setConsultationTime(e.target.value);
                    setBodyTouched(false);
                  }}
                  className={jessicaSuper.input}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Concerne (optionnel)</Label>
              <Input
                value={concerning}
                onChange={(e) => {
                  setConcerning(e.target.value);
                  setBodyTouched(false);
                }}
                className={jessicaSuper.input}
                placeholder="ex. sa fille Louise"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date d&apos;établissement</Label>
              <Input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className={jessicaSuper.input}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>Contenu (modifiable)</Label>
                {bodyTouched ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-[#8B6F47] hover:underline"
                    onClick={() => {
                      setBodyTouched(false);
                      setBodyText(generatedBody);
                    }}
                  >
                    Régénérer
                  </button>
                ) : null}
              </div>
              <Textarea
                value={bodyText}
                onChange={(e) => {
                  setBodyTouched(true);
                  setBodyText(e.target.value);
                }}
                rows={10}
                className={jessicaSuper.input}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message de l&apos;email</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
                className={jessicaSuper.input}
              />
            </div>

            <Button
              type="button"
              className={jessicaSuper.cta}
              disabled={sending}
              onClick={() => void handleSend()}
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Envoyer
            </Button>
          </div>
        </section>

        <section className={cn(jessicaSuper.card, "overflow-hidden p-0")}>
          <div className="border-b border-black/[0.06] px-5 py-3">
            <p className="text-sm font-semibold text-black">Prévisualisation</p>
          </div>
          <div className="bg-[#F3F0EA] px-4 py-8 sm:px-8">
            <article className="mx-auto min-h-[640px] max-w-[640px] bg-white px-8 py-10 shadow-sm sm:px-12">
              <p className="text-sm font-semibold text-[#2F2A25]">Cabinet de consultation</p>
              <p className="mt-1 text-sm font-semibold text-[#2F2A25]">Madame Jessica CONTENTIN</p>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                Professeure en santé – Psychopédagogue certifiée en neuroéducation
              </p>
              <p className="text-[13px] text-neutral-600">Bretteville-sur-Odon (Calvados)</p>
              <p className="text-[13px] text-neutral-600">SIREN : 981 184 898</p>

              <p className="mt-8 text-[13px] text-[#2F2A25]">
                Fait à Bretteville-sur-Odon, le {formatFrenchLongDate(issuedDate)}.
              </p>

              <h2 className="mt-10 text-center text-[15px] font-bold tracking-wide text-[#2F2A25]">
                ATTESTATION DE PRÉSENCE À UNE CONSULTATION
              </h2>

              <div className="mt-8 space-y-4 whitespace-pre-wrap text-[14px] leading-relaxed text-[#2F2A25]">
                {previewBody}
              </div>

              <div className="mt-16 text-right">
                <p className="text-sm font-semibold text-[#2F2A25]">Madame CONTENTIN</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Professeure en santé et psychopédagogue certifiée
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </JessicaSuperPage>
  );
}
