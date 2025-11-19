"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";
import { format, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, ArrowLeft, User, Calendar, Clock, Mail, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  subject?: string;
  learner_notes?: string;
  notes?: string;
}

interface LearnerInfo {
  id: string;
  full_name: string;
  email: string;
  class?: string;
}

export function LearnerAppointmentDetail({
  superAdminId,
  learnerId,
}: {
  superAdminId: string;
  learnerId: string;
}) {
  const supabase = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [learnerInfo, setLearnerInfo] = useState<LearnerInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);

  useEffect(() => {
    fetchData();
  }, [supabase, learnerId]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Récupérer les infos de l'apprenant
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", learnerId)
        .single();

      if (profileError) throw profileError;

      // Récupérer tous les rendez-vous de cet apprenant
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("super_admin_id", superAdminId)
        .eq("learner_id", learnerId)
        .order("start_time", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Extraire la classe depuis les notes
      let learnerClass: string | undefined;
      const appointmentWithClass = (appointmentsData || []).find(
        (apt: any) => apt.learner_notes
      );
      if (appointmentWithClass?.learner_notes) {
        const classMatch =
          appointmentWithClass.learner_notes.match(/Classe:\s*([^\n]+)/i) ||
          appointmentWithClass.learner_notes.match(/(BTS\s+(?:MCO|NDRC|GPME|Communication))/i);
        if (classMatch) {
          learnerClass = classMatch[1].trim();
        }
      }

      setLearnerInfo({
        id: profile.id,
        full_name: profile.full_name || "Inconnu",
        email: profile.email || "",
        class: learnerClass,
      });

      setAppointments((appointmentsData || []) as Appointment[]);
      setTotalAppointments((appointmentsData || []).length);
    } catch (error) {
      console.error("Error fetching learner data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const pastAppointments = appointments.filter((apt) =>
    isPast(new Date(apt.start_time))
  );
  const upcomingAppointments = appointments.filter((apt) =>
    isFuture(new Date(apt.start_time))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!learnerInfo) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">Apprenant non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/super/agenda/rendez-vous")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            {learnerInfo.full_name}
          </h1>
          <p className="text-gray-600 text-sm">Détails des rendez-vous</p>
        </div>
      </div>

      {/* Informations de l'apprenant */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Nom complet</p>
                <p className="font-medium text-gray-900">{learnerInfo.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{learnerInfo.email}</p>
              </div>
            </div>
            {learnerInfo.class && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Classe</p>
                  <p className="font-medium text-gray-900">{learnerInfo.class}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Nombre total de rendez-vous</p>
                <p className="font-medium text-gray-900">{totalAppointments}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des rendez-vous */}
      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous</CardTitle>
          <CardDescription>
            {upcomingAppointments.length} à venir, {pastAppointments.length} passés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">
                À venir ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Passés ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucun rendez-vous à venir
                </p>
              ) : (
                upcomingAppointments.map((apt) => (
                  <Card key={apt.id} className="border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {format(new Date(apt.start_time), "EEEE d MMMM yyyy", { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {format(new Date(apt.start_time), "HH:mm", { locale: fr })} -{" "}
                              {format(new Date(apt.end_time), "HH:mm", { locale: fr })}
                            </span>
                          </div>
                          {apt.learner_notes && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-500 mb-1">Message de l'apprenant:</p>
                              <p className="text-sm text-gray-700">{apt.learner_notes}</p>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={
                            apt.status === "confirmed"
                              ? "default"
                              : apt.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {apt.status === "confirmed"
                            ? "Confirmé"
                            : apt.status === "cancelled"
                              ? "Annulé"
                              : apt.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-4">
              {pastAppointments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucun rendez-vous passé
                </p>
              ) : (
                pastAppointments.map((apt) => (
                  <Card key={apt.id} className="border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {format(new Date(apt.start_time), "EEEE d MMMM yyyy", { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {format(new Date(apt.start_time), "HH:mm", { locale: fr })} -{" "}
                              {format(new Date(apt.end_time), "HH:mm", { locale: fr })}
                            </span>
                          </div>
                          {apt.learner_notes && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-500 mb-1">Message de l'apprenant:</p>
                              <p className="text-sm text-gray-700">{apt.learner_notes}</p>
                            </div>
                          )}
                          {apt.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-sm text-gray-500 mb-1">Notes:</p>
                              <p className="text-sm text-gray-700">{apt.notes}</p>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={
                            apt.status === "completed"
                              ? "default"
                              : apt.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {apt.status === "completed"
                            ? "Terminé"
                            : apt.status === "cancelled"
                              ? "Annulé"
                              : apt.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

