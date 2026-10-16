"use client";

import { useState } from "react";
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

type Segment = "all" | "role" | "single";

type MailImage = {
  id: string;
  filename: string;
  contentBase64: string;
  href: string;
};

export function CrmEmailsClient() {
  const [segment, setSegment] = useState<Segment>("all");
  const [role, setRole] = useState("learner");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [images, setImages] = useState<MailImage[]>([]);
  const [imageHref, setImageHref] = useState("https://www.byound.fr");

  const handleSend = async () => {
    if (!subject.trim() || !title.trim() || !html.trim()) {
      toast.error("Renseignez l'objet, le titre et le message");
      return;
    }
    if (segment === "single" && !email.trim()) {
      toast.error("Indiquez l'email du destinataire");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/super-admin/crm/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          title,
          html,
          images,
          segment,
          role: segment === "role" ? role : undefined,
          email: segment === "single" ? email : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Envoi impossible");
        return;
      }
      toast.success(`Email envoyé à ${json.sent} destinataire(s)`);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

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
      <CardContent className="space-y-5">
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

        {segment === "role" ? (
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

        {segment === "single" ? (
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
          <Label>Objet</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ce que la personne voit dans sa boîte" />
        </div>

        <div className="space-y-2">
          <Label>Titre</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Votre prochaine étape" />
          <p className="text-xs text-gray-500">Affiché en grand et en gras dans le mail, sous le nom Byound.</p>
        </div>

        <div className="space-y-2">
          <Label>Image cliquable</Label>
          <Input value={imageHref} onChange={(event) => setImageHref(event.target.value)} placeholder="https://www.byound.fr" />
          <Input
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
          <p className="text-xs text-gray-500">
            L’image est intégrée dans l’e-mail Resend et ouvre le lien au clic. Le marqueur {"{{image:…}}"} indique sa place dans le message.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={10}
            placeholder="Bonjour,&#10;&#10;Votre message…"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={sending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
        >
          <Send className="mr-2 h-4 w-4" />
          {sending ? "Envoi…" : "Envoyer via Resend"}
        </Button>
      </CardContent>
    </Card>
  );
}
