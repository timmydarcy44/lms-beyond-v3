"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";

export type QualiopiScheduleDeal = {
  id: string;
  company_name: string;
  email?: string | null;
  quoted_course_ids?: string[] | null;
};

type Invitee = { full_name: string; email: string };

export function PipelineQualiopiScheduleOverlay({
  open,
  onOpenChange,
  deal,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: QualiopiScheduleDeal | null;
  onDone: () => void | Promise<void>;
}) {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [invitees, setInvitees] = useState<Invitee[]>([{ full_name: "", email: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCourseId(deal?.quoted_course_ids?.[0] ?? "");
    setCourseName("");
    setScheduledAt("");
    setInvitees([{ full_name: "", email: deal?.email ?? "" }]);
    void fetch("/api/super/training-courses")
      .then((res) => res.json())
      .then((json) => {
        const list = Array.isArray(json.courses) ? json.courses : [];
        setCourses(list.map((item: { id: string; title: string }) => ({ id: item.id, title: item.title })));
      })
      .catch(() => setCourses([]));
  }, [open, deal]);

  const submit = async () => {
    if (!deal?.id) return;
    const selected = courses.find((item) => item.id === courseId);
    const name = courseName.trim() || selected?.title || "";
    const attendees = invitees
      .map((item) => ({ full_name: item.full_name.trim(), email: item.email.trim() }))
      .filter((item) => item.full_name && item.email.includes("@"));
    if (!name) {
      toast.error("Indiquez la formation prévue.");
      return;
    }
    if (attendees.length === 0) {
      toast.error("Ajoutez les collaborateurs invités (nom + email).");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/crm/pipeline/deals/${deal.id}/qualiopi/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId || null,
          course_name: name,
          scheduled_at: scheduledAt || null,
          attendees,
        }),
      });
      const json = await parseFetchJson<{ error?: string; email_sent?: boolean; email_error?: string }>(res);
      if (!res.ok) throw new Error(json.error ?? "Impossible de programmer la formation");
      if (json.email_sent) {
        toast.success("Formation programmée — convention et règlement envoyés");
      } else {
        toast.success("Formation programmée");
        if (json.email_error) toast.error(`Email : ${json.email_error}`);
      }
      onOpenChange(false);
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formation programmée — {deal?.company_name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Qualiopi : on enregistre la session, les stagiaires, puis on envoie automatiquement la convention et le
          règlement intérieur.
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Formation prévue</Label>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Choisir dans le catalogue —</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <Input
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              placeholder="Ou saisir un intitulé libre"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date de formation</Label>
            <Input type="date" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Collaborateurs invités</Label>
            {invitees.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Nom"
                  value={item.full_name}
                  onChange={(event) =>
                    setInvitees((prev) =>
                      prev.map((row, idx) => (idx === index ? { ...row, full_name: event.target.value } : row))
                    )
                  }
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={item.email}
                  onChange={(event) =>
                    setInvitees((prev) =>
                      prev.map((row, idx) => (idx === index ? { ...row, email: event.target.value } : row))
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setInvitees((prev) => prev.filter((_, idx) => idx !== index))}
                  disabled={invitees.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInvitees((prev) => [...prev, { full_name: "", email: "" }])}
            >
              <Plus className="mr-1 h-3 w-3" />
              Ajouter un collaborateur
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Programmer et envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
