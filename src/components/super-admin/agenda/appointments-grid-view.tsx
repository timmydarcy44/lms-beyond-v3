"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, User, Calendar, Clock, Mail, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isContentinEmail } from "@/lib/utils/contentin-theme";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppointmentListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  startTime: string;
  endTime: string;
  status: string;
  isAnonymous: boolean;
}

/**
 * Extrait le nom, prénom et email depuis les données d'un rendez-vous
 */
function extractAppointmentInfo(apt: any): { firstName: string; lastName: string; email: string } {
  // Si le rendez-vous a un learner_id, utiliser les données du profil
  if (apt.learner_id && apt.learner) {
    const fullName = apt.learner.full_name || "";
    const nameParts = fullName.split(" ").filter((p: string) => p.length > 0);
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: apt.learner.email || "",
    };
  }

  // Sinon, extraire depuis les champs pour les rendez-vous anonymes
  let firstName = "";
  let lastName = "";
  let email = "";

  // Extraire depuis subject (format: "Prénom Nom - Classe" ou "Prénom Nom")
  if (apt.subject) {
    // Essayer d'abord avec le format "Prénom Nom - Classe"
    const subjectMatch = apt.subject.match(/^(.+?)\s+-\s+/);
    if (subjectMatch) {
      const namePart = subjectMatch[1].trim();
      const nameParts = namePart.split(" ").filter((p: string) => p.length > 0);
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      }
    } else {
      // Si pas de tiret, prendre tout le subject comme nom
      const nameParts = apt.subject.trim().split(" ").filter((p: string) => p.length > 0);
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      }
    }
  }

  // Si pas de nom trouvé dans subject, essayer dans notes ou learner_notes
  if (!firstName && !lastName) {
    const notesText = apt.notes || apt.learner_notes || "";
    
    // Chercher un pattern "Prénom Nom" au début des notes (format: "Prénom NOM" ou "Prénom Nom")
    // Essayer plusieurs patterns
    const patterns = [
      /^([A-Z][a-z]+(?:\s+[A-Z][A-Z]+)+)/, // "Prénom NOM" (ex: "Timmy DARCY")
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/, // "Prénom Nom" (ex: "Meline LADIRAY")
      /Nom[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i, // "Nom: Prénom Nom"
    ];
    
    for (const pattern of patterns) {
      const nameMatch = notesText.match(pattern);
      if (nameMatch) {
        const nameParts = nameMatch[1].trim().split(" ").filter((p: string) => p.length > 0);
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(" ");
          break;
        }
      }
    }
  }

  // Extraire l'email depuis notes ou learner_notes
  const notesText = apt.notes || apt.learner_notes || "";
  const emailMatch = notesText.match(/Email:\s*([^\n\s]+)/i);
  if (emailMatch) {
    email = emailMatch[1].trim();
  }

  // Si pas d'email trouvé dans les notes, essayer depuis subject ou autres champs
  if (!email) {
    const allText = `${apt.subject || ""} ${apt.notes || ""} ${apt.learner_notes || ""}`;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch2 = allText.match(emailRegex);
    if (emailMatch2) {
      email = emailMatch2[1];
    }
  }

  return {
    firstName: firstName || "",
    lastName: lastName || "",
    email: email || "",
  };
}

interface LearnerDetail {
  firstName: string;
  lastName: string;
  email: string;
  isAnonymous: boolean;
  allAppointments: AppointmentListItem[];
  totalAppointments: number;
  upcomingAppointments: AppointmentListItem[];
  pastAppointments: AppointmentListItem[];
  nextAppointment: AppointmentListItem | null;
}

export function AppointmentsGridView({ superAdminId }: { superAdminId: string }) {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<LearnerDetail | null>(null);
  const [showLearnerModal, setShowLearnerModal] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
    fetchAppointments();
  }, [supabase]);

  const isContentin = isContentinEmail(userEmail);

  const fetchAppointments = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Récupérer tous les rendez-vous avec les infos des apprenants (si disponibles)
      const { data: appointmentsData, error } = await supabase
        .from("appointments")
        .select(`
          id,
          learner_id,
          start_time,
          end_time,
          status,
          subject,
          notes,
          learner_notes,
          learner:profiles!appointments_learner_id_fkey(id, full_name, email)
        `)
        .eq("super_admin_id", superAdminId)
        .order("start_time", { ascending: false });

      if (error) throw error;

      // Transformer les données en liste simple
      const appointmentsList: AppointmentListItem[] = (appointmentsData || []).map((apt: any) => {
        const info = extractAppointmentInfo(apt);
        return {
          id: apt.id,
          firstName: info.firstName,
          lastName: info.lastName,
          email: info.email,
          startTime: apt.start_time,
          endTime: apt.end_time,
          status: apt.status,
          isAnonymous: !apt.learner_id,
        };
      });

      setAppointments(appointmentsList);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={cn("h-8 w-8 animate-spin", isContentin ? "text-[#A0522D]" : "text-gray-600")} />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className={cn(
        "rounded-lg border p-12 text-center",
        isContentin 
          ? "border-[#D2B48C] bg-[#E8E8D3]" 
          : "border-gray-200 bg-white"
      )}>
        <User className={cn("mx-auto h-12 w-12 mb-4", isContentin ? "text-[#A0522D]" : "text-gray-400")} />
        <p className={isContentin ? "text-[#8B4513]" : "text-gray-600"}>Aucun rendez-vous pour le moment</p>
      </div>
    );
  }

  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => new Date(apt.startTime) >= now);
  const pastAppointments = appointments.filter(apt => new Date(apt.startTime) < now);

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={isContentin ? "border-[#D2B48C] bg-[#E8E8D3]" : ""}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={cn("text-sm mb-1", isContentin ? "text-[#A0522D]" : "text-gray-600")}>Total</p>
              <p className={cn("text-2xl font-bold", isContentin ? "text-[#8B4513]" : "text-gray-900")}>{appointments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={isContentin ? "border-[#D2B48C] bg-[#E8E8D3]" : ""}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={cn("text-sm mb-1", isContentin ? "text-[#A0522D]" : "text-gray-600")}>À venir</p>
              <p className={cn("text-2xl font-bold", isContentin ? "text-[#D4AF37]" : "text-blue-600")}>{upcomingAppointments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={isContentin ? "border-[#D2B48C] bg-[#E8E8D3]" : ""}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={cn("text-sm mb-1", isContentin ? "text-[#A0522D]" : "text-gray-600")}>Passés</p>
              <p className={cn("text-2xl font-bold", isContentin ? "text-[#8B4513]" : "text-gray-600")}>{pastAppointments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des rendez-vous */}
      <Card className={isContentin ? "border-[#D2B48C] bg-[#E8E8D3]" : ""}>
          <CardHeader>
          <CardTitle className={cn("text-xl font-semibold", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
            Liste des rendez-vous
                </CardTitle>
        </CardHeader>
        <CardContent>
          {/* En-tête du tableau (masqué sur mobile) */}
          <div className={cn(
            "hidden md:grid md:grid-cols-6 gap-4 pb-3 mb-3 border-b",
            isContentin ? "border-[#D2B48C]" : "border-gray-200"
          )}>
            <div className={cn("text-xs font-semibold uppercase tracking-wider", isContentin ? "text-[#A0522D]" : "text-gray-500")}>
              Nom & Prénom
            </div>
            <div className={cn("text-xs font-semibold uppercase tracking-wider", isContentin ? "text-[#A0522D]" : "text-gray-500")}>
              Email
            </div>
            <div className={cn("text-xs font-semibold uppercase tracking-wider", isContentin ? "text-[#A0522D]" : "text-gray-500")}>
              Date
            </div>
            <div className={cn("text-xs font-semibold uppercase tracking-wider", isContentin ? "text-[#A0522D]" : "text-gray-500")}>
              Heure
            </div>
            <div className={cn("text-xs font-semibold uppercase tracking-wider", isContentin ? "text-[#A0522D]" : "text-gray-500")}>
              Statut
            </div>
            <div className={cn("text-xs font-semibold uppercase tracking-wider", isContentin ? "text-[#A0522D]" : "text-gray-500")}>
              Actions
            </div>
          </div>
          <div className="space-y-4">
            {appointments.map((apt) => {
              const appointmentDate = new Date(apt.startTime);
              const isPast = appointmentDate < now;
              const isUpcoming = !isPast;

              return (
                <div
                  key={apt.id}
                  onClick={() => {
                    // Grouper tous les rendez-vous de cet apprenant (par email ou nom)
                    const learnerKey = apt.email || `${apt.firstName} ${apt.lastName}`.trim();
                    const learnerAppointments = appointments.filter(a => 
                      (a.email && a.email === apt.email) || 
                      (!a.email && `${a.firstName} ${a.lastName}`.trim() === `${apt.firstName} ${apt.lastName}`.trim())
                    );
                    
                    const now = new Date();
                    const upcoming = learnerAppointments.filter(a => new Date(a.startTime) >= now);
                    const past = learnerAppointments.filter(a => new Date(a.startTime) < now);
                    const next = upcoming.length > 0 
                      ? upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
                      : null;

                    setSelectedLearner({
                      firstName: apt.firstName,
                      lastName: apt.lastName,
                      email: apt.email,
                      isAnonymous: apt.isAnonymous,
                      allAppointments: learnerAppointments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
                      totalAppointments: learnerAppointments.length,
                      upcomingAppointments: upcoming,
                      pastAppointments: past,
                      nextAppointment: next,
                    });
                    setShowLearnerModal(true);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer",
                    isContentin
                      ? isUpcoming
                        ? "border-[#D4AF37]/50 bg-[#F5F5DC]/50 hover:bg-[#F5F5DC]"
                        : "border-[#D2B48C] bg-[#E8E8D3]/50 hover:bg-[#E8E8D3]"
                      : isUpcoming
                        ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                        : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
                  )}
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Nom et Prénom */}
                    <div className="flex items-start gap-2">
                      <User className={cn("h-4 w-4 flex-shrink-0 mt-0.5", isContentin ? "text-[#A0522D]" : "text-gray-400")} />
                      <div className="min-w-0">
                        <p className={cn("text-sm font-semibold", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                          {apt.firstName || apt.lastName ? `${apt.firstName} ${apt.lastName}`.trim() : "Non renseigné"}
                        </p>
                        {apt.isAnonymous && (
                          <Badge variant="outline" className={cn("text-xs mt-1", isContentin ? "border-[#D2B48C] text-[#A0522D]" : "")}>
                            Anonyme
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-2">
                      <Mail className={cn("h-4 w-4 flex-shrink-0 mt-0.5", isContentin ? "text-[#A0522D]" : "text-gray-400")} />
                      <p className={cn("text-sm break-all", isContentin ? "text-[#8B4513]" : "text-gray-700")}>{apt.email || "Non renseigné"}</p>
                    </div>

                    {/* Date */}
                    <div className="flex items-start gap-2">
                      <Calendar className={cn("h-4 w-4 flex-shrink-0 mt-0.5", isContentin ? "text-[#A0522D]" : "text-gray-400")} />
                      <p className={cn("text-sm font-medium", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                        {format(appointmentDate, "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>

                    {/* Heure */}
                    <div className="flex items-start gap-2">
                      <Clock className={cn("h-4 w-4 flex-shrink-0 mt-0.5", isContentin ? "text-[#A0522D]" : "text-gray-400")} />
                      <p className={cn("text-sm font-medium", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                        {format(appointmentDate, "HH:mm", { locale: fr })}
                      </p>
                    </div>

                    {/* Statut */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isUpcoming ? "default" : "secondary"}
                        className={cn(
                          isContentin
                            ? isUpcoming
                              ? "bg-[#D4AF37]/20 text-[#8B4513] border-[#D4AF37]"
                              : "bg-[#D2B48C]/20 text-[#8B4513] border-[#D2B48C]"
                            : isUpcoming
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                        )}
                      >
                        {isUpcoming ? "À venir" : "Passé"}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const fullName = apt.firstName || apt.lastName ? `${apt.firstName} ${apt.lastName}`.trim() : "cet apprenant";
                          if (confirm(`Êtes-vous sûr de vouloir supprimer le rendez-vous de ${fullName} ?`)) {
                            try {
                              const { error } = await supabase
                                .from("appointments")
                                .delete()
                                .eq("id", apt.id);
                              
                              if (error) throw error;
                              
                              toast.success("Rendez-vous supprimé avec succès");
                              fetchAppointments();
                            } catch (error: any) {
                              console.error("Error deleting appointment:", error);
                              toast.error("Erreur lors de la suppression du rendez-vous");
                            }
                          }
                        }}
                        className={cn(
                          "h-8 w-8 p-0",
                          isContentin
                            ? "text-[#A0522D] hover:text-[#8B4513] hover:bg-[#E8E8D3]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
          </CardContent>
        </Card>

        {/* Modal de détails de l'apprenant */}
        <Dialog open={showLearnerModal} onOpenChange={setShowLearnerModal}>
          <DialogContent className={cn(
            "max-w-2xl max-h-[90vh] overflow-y-auto",
            isContentin ? "bg-[#F5F5DC] border-[#D2B48C]" : "bg-white"
          )}>
            <DialogHeader>
              <DialogTitle className={cn("text-xl font-semibold", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                Informations de l'apprenant
              </DialogTitle>
              <DialogDescription className={isContentin ? "text-[#A0522D]" : "text-gray-600"}>
                Détails et historique des rendez-vous
              </DialogDescription>
            </DialogHeader>
            
            {selectedLearner && (
              <div className="space-y-6 py-4">
                {/* Informations personnelles */}
                <div className={cn(
                  "rounded-lg border p-4",
                  isContentin ? "border-[#D2B48C] bg-[#E8E8D3]" : "border-gray-200 bg-gray-50"
                )}>
                  <h3 className={cn("text-lg font-semibold mb-4", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={cn("text-sm font-medium mb-1", isContentin ? "text-[#A0522D]" : "text-gray-600")}>Nom complet</p>
                      <p className={cn("text-base", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                        {selectedLearner.firstName || selectedLearner.lastName 
                          ? `${selectedLearner.firstName} ${selectedLearner.lastName}`.trim() 
                          : "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium mb-1", isContentin ? "text-[#A0522D]" : "text-gray-600")}>Email</p>
                      <p className={cn("text-base", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                        {selectedLearner.email || "Non renseigné"}
                      </p>
                    </div>
                    {selectedLearner.isAnonymous && (
                      <div className="md:col-span-2">
                        <Badge variant="outline" className={cn(isContentin ? "border-[#D2B48C] text-[#A0522D]" : "")}>
                          Réservation anonyme
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiques */}
                <div className={cn(
                  "rounded-lg border p-4",
                  isContentin ? "border-[#D2B48C] bg-[#E8E8D3]" : "border-gray-200 bg-gray-50"
                )}>
                  <h3 className={cn("text-lg font-semibold mb-4", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                    Statistiques
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                        {selectedLearner.totalAppointments}
                      </p>
                      <p className={cn("text-sm", isContentin ? "text-[#A0522D]" : "text-gray-600")}>Total</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", isContentin ? "text-[#D4AF37]" : "text-blue-600")}>
                        {selectedLearner.upcomingAppointments.length}
                      </p>
                      <p className={cn("text-sm", isContentin ? "text-[#A0522D]" : "text-gray-600")}>À venir</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", isContentin ? "text-[#8B4513]" : "text-gray-600")}>
                        {selectedLearner.pastAppointments.length}
                      </p>
                      <p className={cn("text-sm", isContentin ? "text-[#A0522D]" : "text-gray-600")}>Passés</p>
                    </div>
                  </div>
                </div>

                {/* Prochain rendez-vous */}
                {selectedLearner.nextAppointment && (
                  <div className={cn(
                    "rounded-lg border p-4",
                    isContentin ? "border-[#D4AF37] bg-[#F5F5DC]" : "border-blue-200 bg-blue-50"
                  )}>
                    <h3 className={cn("text-lg font-semibold mb-3", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                      Prochain rendez-vous
                    </h3>
                    <div className="flex items-center gap-4">
                      <Calendar className={cn("h-5 w-5", isContentin ? "text-[#A0522D]" : "text-gray-600")} />
                      <div>
                        <p className={cn("font-medium", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                          {format(new Date(selectedLearner.nextAppointment.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                        </p>
                        <p className={cn("text-sm", isContentin ? "text-[#A0522D]" : "text-gray-600")}>
                          {format(new Date(selectedLearner.nextAppointment.startTime), "HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Historique des rendez-vous */}
                <div className={cn(
                  "rounded-lg border p-4",
                  isContentin ? "border-[#D2B48C] bg-[#E8E8D3]" : "border-gray-200 bg-gray-50"
                )}>
                  <h3 className={cn("text-lg font-semibold mb-4", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                    Historique des rendez-vous ({selectedLearner.allAppointments.length})
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedLearner.allAppointments.map((apt) => {
                      const aptDate = new Date(apt.startTime);
                      const isPast = aptDate < new Date();
                      return (
                        <div
                          key={apt.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            isContentin
                              ? isPast
                                ? "border-[#D2B48C] bg-[#F5F5DC]/50"
                                : "border-[#D4AF37] bg-[#F5F5DC]"
                              : isPast
                                ? "border-gray-200 bg-gray-50"
                                : "border-blue-200 bg-blue-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className={cn("h-4 w-4", isContentin ? "text-[#A0522D]" : "text-gray-600")} />
                            <div>
                              <p className={cn("text-sm font-medium", isContentin ? "text-[#8B4513]" : "text-gray-900")}>
                                {format(aptDate, "d MMM yyyy", { locale: fr })} à {format(aptDate, "HH:mm", { locale: fr })}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={isPast ? "secondary" : "default"}
                            className={cn(
                              isContentin
                                ? isPast
                                  ? "bg-[#D2B48C]/20 text-[#8B4513] border-[#D2B48C]"
                                  : "bg-[#D4AF37]/20 text-[#8B4513] border-[#D4AF37]"
                                : isPast
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-blue-100 text-blue-800"
                            )}
                          >
                            {isPast ? "Passé" : "À venir"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowLearnerModal(false)}
                className={cn(
                  isContentin
                    ? "border-[#D2B48C] text-[#8B4513] hover:bg-[#E8E8D3]"
                    : ""
                )}
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
