"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, User, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearnerAppointment {
  learner_id: string;
  learner_name: string;
  learner_email: string;
  learner_class?: string;
  total_appointments: number;
  upcoming_appointments: number;
  past_appointments: number;
  next_appointment?: string;
  last_appointment?: string;
}

export function AppointmentsGridView({ superAdminId }: { superAdminId: string }) {
  const supabase = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState<LearnerAppointment[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, [supabase]);

  const fetchAppointments = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Récupérer tous les rendez-vous avec les infos des apprenants
      const { data: appointmentsData, error } = await supabase
        .from("appointments")
        .select(`
          id,
          learner_id,
          start_time,
          status,
          learner:profiles!appointments_learner_id_fkey(id, full_name, email)
        `)
        .eq("super_admin_id", superAdminId)
        .order("start_time", { ascending: false });

      if (error) throw error;

      // Grouper par apprenant
      const learnersMap = new Map<string, LearnerAppointment>();

      const now = new Date();

      (appointmentsData || []).forEach((apt: any) => {
        const learnerId = apt.learner_id;
        const appointmentTime = new Date(apt.start_time);
        const isPast = appointmentTime < now;

        if (!learnersMap.has(learnerId)) {
          learnersMap.set(learnerId, {
            learner_id: learnerId,
            learner_name: apt.learner?.full_name || "Inconnu",
            learner_email: apt.learner?.email || "",
            learner_class: undefined, // À récupérer depuis les notes ou un champ dédié
            total_appointments: 0,
            upcoming_appointments: 0,
            past_appointments: 0,
            next_appointment: undefined,
            last_appointment: undefined,
          });
        }

        const learner = learnersMap.get(learnerId)!;
        learner.total_appointments++;

        if (isPast) {
          learner.past_appointments++;
          if (!learner.last_appointment || appointmentTime > new Date(learner.last_appointment)) {
            learner.last_appointment = apt.start_time;
          }
        } else {
          learner.upcoming_appointments++;
          if (!learner.next_appointment || appointmentTime < new Date(learner.next_appointment)) {
            learner.next_appointment = apt.start_time;
          }
        }
      });

      // Récupérer les classes depuis les notes des rendez-vous
      const { data: appointmentsWithNotes } = await supabase
        .from("appointments")
        .select("learner_id, learner_notes")
        .eq("super_admin_id", superAdminId)
        .not("learner_notes", "is", null);

      (appointmentsWithNotes || []).forEach((apt: any) => {
        const learner = learnersMap.get(apt.learner_id);
        if (learner && apt.learner_notes) {
          // Extraire la classe depuis les notes (format: "Classe: BTS MCO" ou juste le texte)
          const classMatch = apt.learner_notes.match(/Classe:\s*([^\n]+)/i) || 
                            apt.learner_notes.match(/(BTS\s+(?:MCO|NDRC|GPME|Communication))/i);
          if (classMatch && !learner.learner_class) {
            learner.learner_class = classMatch[1].trim();
          }
        }
      });

      setLearners(Array.from(learnersMap.values()));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const handleLearnerClick = (learnerId: string) => {
    router.push(`/super/agenda/rendez-vous/${learnerId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (learners.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Aucun rendez-vous pour le moment</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {learners.map((learner) => (
        <Card
          key={learner.learner_id}
          className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-300"
          onClick={() => handleLearnerClick(learner.learner_id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  {learner.learner_name}
                </CardTitle>
                <p className="text-sm text-gray-500">{learner.learner_email}</p>
              </div>
              <Badge
                variant={learner.upcoming_appointments > 0 ? "default" : "secondary"}
                className={cn(
                  learner.upcoming_appointments > 0
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                )}
              >
                {learner.total_appointments} RDV
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {learner.learner_class && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Classe:</span>
                <span className="font-medium text-gray-900">{learner.learner_class}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">À venir</p>
                <p className="text-lg font-semibold text-blue-600">
                  {learner.upcoming_appointments}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Passés</p>
                <p className="text-lg font-semibold text-gray-600">
                  {learner.past_appointments}
                </p>
              </div>
            </div>

            {learner.next_appointment && (
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                <Calendar className="h-4 w-4" />
                <span>
                  Prochain: {format(new Date(learner.next_appointment), "d MMM yyyy à HH:mm", { locale: fr })}
                </span>
              </div>
            )}

            {learner.last_appointment && !learner.next_appointment && (
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                <Clock className="h-4 w-4" />
                <span>
                  Dernier: {format(new Date(learner.last_appointment), "d MMM yyyy", { locale: fr })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

