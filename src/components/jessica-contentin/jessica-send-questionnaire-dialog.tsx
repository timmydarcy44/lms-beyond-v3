"use client";

import { useMemo, useState } from "react";
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
  /** Préselection */
  defaultSlug?: string;
  contact?: SendQuestionnaireContact | null;
};

export function JessicaSendQuestionnaireDialog({
  open,
  onOpenChange,
  questionnaires,
  defaultSlug,
  contact,
}: Props) {
  const [slug, setSlug] = useState(defaultSlug ?? questionnaires[0]?.slug ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [sending, setSending] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...questionnaires].sort((a, b) => a.title.localeCompare(b.title, "fr")),
    [questionnaires],
  );

  const resetFromProps = () => {
    setSlug(defaultSlug ?? questionnaires[0]?.slug ?? "");
    setEmail(contact?.email ?? "");
    setFirstName(contact?.firstName ?? "");
    setLastLink(null);
  };

  const handleSend = async (linkOnly: boolean) => {
    if (!slug) {
      toast.error("Choisissez un questionnaire");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Email invalide");
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
          lastName: contact?.lastName ?? null,
          cabinetPatientId: contact?.patientId ?? null,
          profileId: contact?.profileId ?? null,
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetFromProps();
        onOpenChange(v);
      }}
    >
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
              {sorted.map((q) => (
                <option key={q.slug} value={q.slug}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Prénom</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={jessicaSuper.input}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
