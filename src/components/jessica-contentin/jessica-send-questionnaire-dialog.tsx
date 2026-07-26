"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

export type SendQuestionnaireContact = {
  id?: string;
  label?: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileId?: string | null;
  patientId?: string | null;
};

type QuestionnaireOption = {
  slug: string;
  title: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaires: QuestionnaireOption[];
  defaultSlug?: string;
  /** Contact prérempli (fiche client) */
  contact?: SendQuestionnaireContact | null;
  /** Liste CRM pour le dropdown */
  contacts?: SendQuestionnaireContact[];
};

export function JessicaSendQuestionnaireDialog({
  open,
  onOpenChange,
  questionnaires,
  defaultSlug,
  contact,
  contacts = [],
}: Props) {
  const [slug, setSlug] = useState(defaultSlug ?? questionnaires[0]?.slug ?? "");
  const [contactId, setContactId] = useState("");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [lastName, setLastName] = useState(contact?.lastName ?? "");
  const [profileId, setProfileId] = useState<string | null>(contact?.profileId ?? null);
  const [patientId, setPatientId] = useState<string | null>(contact?.patientId ?? null);
  const [sending, setSending] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const sortedQuestionnaires = useMemo(
    () => [...questionnaires].sort((a, b) => a.title.localeCompare(b.title, "fr")),
    [questionnaires],
  );

  const sortedContacts = useMemo(
    () =>
      [...contacts]
        .filter((c) => c.email?.includes("@"))
        .sort((a, b) => (a.label || a.email).localeCompare(b.label || b.email, "fr")),
    [contacts],
  );

  useEffect(() => {
    if (!open) return;
    setSlug(defaultSlug ?? questionnaires[0]?.slug ?? "");
    setLastLink(null);
    if (contact?.email) {
      setContactId(contact.id ?? "");
      setEmail(contact.email);
      setFirstName(contact.firstName ?? "");
      setLastName(contact.lastName ?? "");
      setProfileId(contact.profileId ?? null);
      setPatientId(contact.patientId ?? null);
    } else {
      setContactId("");
      setEmail("");
      setFirstName("");
      setLastName("");
      setProfileId(null);
      setPatientId(null);
    }
  }, [open, defaultSlug, questionnaires, contact]);

  const onPickContact = (id: string) => {
    setContactId(id);
    if (!id) {
      setProfileId(null);
      setPatientId(null);
      return;
    }
    const c = sortedContacts.find((x) => x.id === id);
    if (!c) return;
    setEmail(c.email);
    setFirstName(c.firstName ?? "");
    setLastName(c.lastName ?? "");
    setProfileId(c.profileId ?? null);
    setPatientId(c.patientId ?? null);
  };

  const handleSend = async (linkOnly: boolean) => {
    if (!slug) {
      toast.error("Choisissez un questionnaire");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Choisissez un client ou saisissez un email");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/jessica-questionnaires/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireSlug: slug,
          email: email.trim(),
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          cabinetPatientId: patientId,
          profileId,
          linkOnly,
        }),
      });
      const json = (await res.json()) as { error?: string; link?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec");
      if (json.link) setLastLink(json.link);
      if (linkOnly) {
        await navigator.clipboard.writeText(json.link ?? "");
        toast.success("Lien copié");
      } else {
        toast.success("Questionnaire envoyé par email");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer un questionnaire</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Questionnaire</Label>
            <select
              className={cn(jessicaSuper.input, "w-full")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              {sortedQuestionnaires.map((q) => (
                <option key={q.slug} value={q.slug}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          {sortedContacts.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Client CRM</Label>
              <select
                className={cn(jessicaSuper.input, "w-full")}
                value={contactId}
                onChange={(e) => onPickContact(e.target.value)}
              >
                <option value="">Choisir un client…</option>
                {sortedContacts.map((c) => (
                  <option key={c.id ?? c.email} value={c.id ?? ""}>
                    {c.label || `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email} —{" "}
                    {c.email}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Ou saisir une adresse email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setContactId("");
                setProfileId(null);
                setPatientId(null);
              }}
              className={jessicaSuper.input}
              placeholder="email@exemple.fr"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Prénom (optionnel)</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={jessicaSuper.input}
            />
          </div>

          {lastLink ? (
            <p className="break-all rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">{lastLink}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className={jessicaSuper.cta}
              disabled={sending}
              onClick={() => void handleSend(false)}
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Envoyer (Resend)
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={sending}
              onClick={() => void handleSend(true)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copier le lien
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
