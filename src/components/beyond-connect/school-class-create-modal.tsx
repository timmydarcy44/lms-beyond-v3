"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type StudentOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type SchoolClassCreateModalProps = {
  students: StudentOption[];
  schoolId: string | null;
};

export function SchoolClassCreateModal({ students, schoolId }: SchoolClassCreateModalProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [npcAmount, setNpcAmount] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(schoolId);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    setResolvedSchoolId(schoolId);
  }, [schoolId]);

  const filteredStudents = useMemo(() => {
    if (!studentQuery.trim()) return students;
    const query = studentQuery.toLowerCase();
    return students.filter((student) => {
      const fullName = `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [studentQuery, students]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateClass = async () => {
    if (!className.trim() || isSaving) return;
    setIsSaving(true);
    setFormError(null);
    if (!supabase) {
      setIsSaving(false);
      setFormError("Service indisponible.");
      return;
    }
    let finalSchoolId = resolvedSchoolId;
    if (!finalSchoolId) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        setIsSaving(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", userData.user.id)
        .maybeSingle();
      finalSchoolId = profile?.school_id || null;
      setResolvedSchoolId(finalSchoolId);
    }
    if (!finalSchoolId) {
      setFormError("school_id manquant.");
      setIsSaving(false);
      return;
    }
    const payload = {
      name: className.trim(),
      npc_amount: npcAmount ? Number(npcAmount) : null,
      school_id: finalSchoolId,
    };
    console.log("Données classe envoyées:", payload);
    const { data: classRow, error: classError } = await supabase
      .from("school_classes")
      .insert(payload)
      .select("id, name")
      .single();

    if (classError || !classRow) {
      if (classError) {
        toast.error(classError.message);
      }
      if (classError) {
        console.error("Erreur insertion:", classError);
      }
      setFormError(classError?.message || "Impossible de creer la classe.");
      setIsSaving(false);
      return;
    }

    if (selectedStudentIds.length) {
      const enrollments = selectedStudentIds.map((studentId) => {
        console.log("Données de liaison envoyées :", { studentId, classId: classRow.id });
        return {
          class_id: classRow.id,
          student_id: studentId,
        };
      });
      const { error: enrollError } = await supabase.from("class_enrollments").insert(enrollments);
      if (enrollError) {
        setFormError(enrollError.message);
        setIsSaving(false);
        return;
      }
    }

    setDialogOpen(false);
    setClassName("");
    setNpcAmount("");
    setStudentQuery("");
    setSelectedStudentIds([]);
    setIsSaving(false);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white"
      >
        +
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-[28px] border border-white/10 bg-black/80 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <DialogTitle className="sr-only">Créer un cursus</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de création de classe et sélection d'apprenants
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Creer une classe</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <label className="text-xs font-semibold text-white/70">Nom du cursus</label>
            <input
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Mastere Business"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2 text-sm">
            <label className="text-xs font-semibold text-white/70">NPC Amount</label>
            <input
              type="text"
              inputMode="decimal"
              value={npcAmount}
              onChange={(event) => setNpcAmount(event.target.value)}
              placeholder="8000"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2 text-sm">
            <label className="text-xs font-semibold text-white/70">Apprenants</label>
            <input
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
              placeholder="Rechercher un apprenant..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40"
            />
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
              {filteredStudents.length ? (
                filteredStudents.map((student) => {
                  const label = `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Apprenant";
                  return (
                    <label
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80"
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 rounded border-white/20 bg-black text-blue-500"
                      />
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-white/50">Aucun apprenant trouve.</p>
              )}
            </div>
            <p className="text-xs text-white/40">
              {selectedStudentIds.length} apprenant(s) selectionne(s)
            </p>
          </div>
          {formError ? <p className="text-xs text-red-300">{formError}</p> : null}
          <DialogFooter>
            <button
              type="button"
              onClick={handleCreateClass}
              disabled={isSaving}
              className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              {isSaving ? "..." : "Enregistrer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
