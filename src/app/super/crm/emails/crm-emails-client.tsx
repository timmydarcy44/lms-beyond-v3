"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRM_ROLE_LABELS } from "@/lib/crm/crm-shared";
import { fillExpertMail, type ExpertMailTemplate } from "@/lib/expert/expert-mail-templates";

type Segment = "all" | "role" | "single";

type MailImage = {
  id: string;
  filename: string;
  contentBase64: string;
  href: string;
};

type Props = {
  lockedRecipient?: { name: string; email: string };
  expertId?: string;
  templates?: ExpertMailTemplate[];
  variables?: Record<string, string>;
  initialTemplateId?: string | null;
  onSent?: () => void;
};

export function CrmEmailsClient({
  lockedRecipient,
  expertId,
  templates,
  variables,
  initialTemplateId,
  onSent,
}: Props = {}) {
  const [segment, setSegment] = useState<Segment>(lockedRecipient ? "single" : "all");
  const [role, setRole] = useState("learner");
  const [email, setEmail] = useState(lockedRecipient?.email ?? "");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState<"live" | "test" | null>(null);
  const [images, setImages] = useState<MailImage[]>([]);
  const [imageHref, setImageHref] = useState("https://www.byound.fr");
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId ?? null);
  const [templateLabel, setTemplateLabel] = useState("");

  const applyTemplate = (template: ExpertMailTemplate) => {
    const vars = variables ?? {};
    setTemplateId(template.id);
    setTemplateLabel(template.label);
    setSubject(fillExpertMail(template.subject, vars));
    setTitle(fillExpertMail(template.title, vars));
    setHtml(fillExpertMail(template.message, vars));
  };

  useEffect(() => {
    if (!initialTemplateId || !templates?.length) return;
    const template = templates.find((item) => item.id === initialTemplateId);
    if (template) applyTemplate(template);
    // The template is applied when the fiche opens this tab with a preselected model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplateId]);

  const handleSend = async (test = false) => {
    if (!subject.trim() || !title.trim() || !html.trim()) {
      toast.error("Renseignez l'objet, le titre et le message");
      return;
    }
    if (!lockedRecipient && segment === "single" && !email.trim()) {
      toast.error("Indiquez l'email du destinataire");
      return;
    }

    setSending(test ? "test" : "live");
    try {
      const res = await fetch("/api/super-admin/crm/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          title,
          html,
          images,
          segment: lockedRecipient ? "single" : segment,
          role: segment === "role" ? role : undefined,
          email: lockedRecipient?.email || email,
          expertId,
          test,
          templateLabel,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Envoi impossible");
        return;
      }
      toast.success(test ? "Test envoyé sur votre adresse." : `Email envoyé à ${json.sent} destinataire(s)`);
      if (!test) onSent?.();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSending(null);
    }
  };

  const fieldClass = lockedRecipient
    ? "border-[#26304F] bg-[#0B1122] text-white placeholder:text-[#9AA3BD]"
    : undefined;

  const composer = (
    <>
      {templates?.length ? (
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
              className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={{
                background: templateId === template.id ? "#8DB8FF" : "#8DB8FF26",
                color: templateId === template.id ? "#0A0F1E" : "#8DB8FF",
              }}
            >
              {template.label}
            </button>
          ))}
        </div>
      ) : null}

      {lockedRecipient ? (
        <div>
          <p className="text-[13px] text-[#9AA3BD]">Destinataire</p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#26304F] bg-[#0B1122] px-3 py-1.5 text-sm font-semibold text-white">
            {lockedRecipient.name}
            <span className="font-medium text-[#9AA3BD]">{lockedRecipient.email}</span>
          </p>
          <p className="mt-2 text-[13px] text-[#9AA3BD]">Réponse à contact@byound.fr</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Destinataires</Label>
          <Select value={segment} onValueChange={(v) => setSegment(v as Segment)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout le monde (tous les contacts CRM)</SelectItem>
              <SelectItem value="role">Segment par label / rôle</SelectItem>
              <SelectItem value="single">Une personne (email)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!lockedRecipient && segment === "role" ? (
        <div className="space-y-2">
          <Label>Label / rôle</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CRM_ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {!lockedRecipient && segment === "single" ? (
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@exemple.fr"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className={lockedRecipient ? "text-[#9AA3BD]" : undefined}>Objet</Label>
        <Input className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ce que la personne voit dans sa boîte" />
      </div>

      <div className="space-y-2">
        <Label className={lockedRecipient ? "text-[#9AA3BD]" : undefined}>Titre</Label>
        <Input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Votre prochaine étape" />
        <p className={`text-xs ${lockedRecipient ? "text-[#9AA3BD]" : "text-gray-500"}`}>Affiché en grand et en gras dans le mail, sous le nom Byound.</p>
      </div>

      <div className="space-y-2">
        <Label className={lockedRecipient ? "text-[#9AA3BD]" : undefined}>Image cliquable</Label>
        <Input className={fieldClass} value={imageHref} onChange={(event) => setImageHref(event.target.value)} placeholder="https://www.byound.fr" />
        <Input
          className={fieldClass}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 4 * 1024 * 1024) {
              toast.error("Image trop lourde (4 Mo maximum).");
              event.target.value = "";
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const id = `img${Date.now()}`;
              const contentBase64 = String(reader.result ?? "");
              setImages((current) => [...current, { id, filename: file.name, contentBase64, href: imageHref }]);
              setHtml((current) => `${current}${current ? "\n" : ""}{{image:${id}}}`);
            };
            reader.readAsDataURL(file);
            event.target.value = "";
          }}
        />
        <p className={`text-xs ${lockedRecipient ? "text-[#9AA3BD]" : "text-gray-500"}`}>
          L’image est intégrée dans l’e-mail Resend et ouvre le lien au clic. Le marqueur {"{{image:…}}"} indique sa place dans le message.
        </p>
      </div>

      <div className="space-y-2">
        <Label className={lockedRecipient ? "text-[#9AA3BD]" : undefined}>Message</Label>
        <Textarea
          className={fieldClass}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={10}
          placeholder="Bonjour,&#10;&#10;Votre message…"
        />
      </div>

      {lockedRecipient && (title.trim() || html.trim()) ? (
        <div className="rounded-2xl bg-white p-5 text-[#1a1a1a]">
          <p className="text-xs font-semibold text-[#6b6f7a]">Aperçu</p>
          {title.trim() ? <p className="mt-3 text-[28px] font-bold leading-tight">{title}</p> : null}
          <div className="mt-4 space-y-3 text-[16px] leading-relaxed">
            {html.split("\n\n").filter((part) => part.trim()).map((part) => (
              <p key={part}>{part}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {lockedRecipient ? (
          <button
            type="button"
            onClick={() => void handleSend(true)}
            disabled={sending !== null}
            className="rounded-full border border-[#26304F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {sending === "test" ? "Envoi…" : "M'envoyer un test"}
          </button>
        ) : null}
        <Button
          onClick={() => void handleSend(false)}
          disabled={sending !== null}
          className={lockedRecipient ? "rounded-full bg-[#6E5BFF] text-white hover:bg-[#6E5BFF]" : "bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto"}
        >
          <Send className="mr-2 h-4 w-4" />
          {sending === "live" ? "Envoi…" : "Envoyer via Resend"}
        </Button>
      </div>
    </>
  );

  if (lockedRecipient) {
    return <div className="space-y-5">{composer}</div>;
  }

  return (
    <Card className="border-gray-200 shadow-sm max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Mail className="h-5 w-5 text-emerald-600" />
          Campagne email (Resend)
        </CardTitle>
        <CardDescription>
          Envoyez un email à tous les contacts, à un segment (label / rôle) ou à une personne.
          Nécessite <code className="text-xs">RESEND_API_KEY</code>.
          En test, utilisez <code className="text-xs">RESEND_USE_SANDBOX=1</code> ou retirez{" "}
          <code className="text-xs">RESEND_FROM_EMAIL</code> pour expédier via{" "}
          <code className="text-xs">onboarding@resend.dev</code> (domaine non vérifié requis sur resend.com).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{composer}</CardContent>
    </Card>
  );
}
