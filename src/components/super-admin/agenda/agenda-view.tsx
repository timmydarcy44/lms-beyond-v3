"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, X, Mail, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AppointmentSlot {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
  is_recurring: boolean;
  recurring_pattern?: string;
}

interface Appointment {
  id: string;
  slot_id?: string;
  learner_id: string;
  learner_name?: string;
  learner_email?: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  subject?: string;
  notes?: string;
  learner_notes?: string;
}

export function AgendaView({ superAdminId }: { superAdminId: string }) {
  const supabase = useSupabase();
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);

  // Formulaire pour créer une plage horaire
  const [slotForm, setSlotForm] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "17:00",
    duration: 30,
    isRecurring: false,
    recurringPattern: "weekly",
  });

  // Formulaire pour créer un rendez-vous
  const [appointmentForm, setAppointmentForm] = useState({
    learnerEmail: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    duration: 30,
    subject: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate, supabase]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Récupérer les dates de début et fin de la semaine
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      
      // Début de la semaine à 00:00:00
      const startOfWeekDate = new Date(weekStart);
      startOfWeekDate.setHours(0, 0, 0, 0);
      
      // Fin de la semaine à 23:59:59
      const endOfWeekDate = new Date(weekEnd);
      endOfWeekDate.setHours(23, 59, 59, 999);

      // Récupérer les plages horaires pour toute la semaine
      const { data: slotsData } = await supabase
        .from("appointment_slots")
        .select("*")
        .eq("super_admin_id", superAdminId)
        .gte("start_time", startOfWeekDate.toISOString())
        .lte("start_time", endOfWeekDate.toISOString())
        .order("start_time", { ascending: true });

      // Récupérer les rendez-vous avec les infos des apprenants pour toute la semaine
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select(`
          *,
          learner:profiles!appointments_learner_id_fkey(id, full_name, email)
        `)
        .eq("super_admin_id", superAdminId)
        .gte("start_time", startOfWeekDate.toISOString())
        .lte("start_time", endOfWeekDate.toISOString())
        .order("start_time", { ascending: true });

      setSlots(slotsData || []);
      setAppointments(
        (appointmentsData || []).map((apt: any) => ({
          ...apt,
          learner_name: apt.learner?.full_name || "Inconnu",
          learner_email: apt.learner?.email || "",
        }))
      );
    } catch (error) {
      console.error("Error fetching agenda data:", error);
      toast.error("Erreur lors du chargement de l'agenda");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!supabase) return;

    try {
      const selectedDate = new Date(`${slotForm.startDate}T00:00:00`);
      
      // Générer tous les créneaux de 30 minutes pour la journée
      // Matin : 9h, 9h30, 10h, 10h30, 11h, 11h30, 12h (pas 12h30 - pause déjeuner)
      // Après-midi : 13h, 13h30, 14h, 14h30, 15h, 15h30, 16h, 16h30
      const slotsToCreate: Array<{
        super_admin_id: string;
        start_time: string;
        end_time: string;
        duration_minutes: number;
        is_available: boolean;
        is_recurring: boolean;
        recurring_pattern: string | null;
      }> = [];
      
      // Créneaux du matin (9h à 12h)
      const morningSlots = [
        { hour: 9, minute: 0 },
        { hour: 9, minute: 30 },
        { hour: 10, minute: 0 },
        { hour: 10, minute: 30 },
        { hour: 11, minute: 0 },
        { hour: 11, minute: 30 },
        { hour: 12, minute: 0 },
      ];
      
      morningSlots.forEach(({ hour, minute }) => {
        const startTime = new Date(selectedDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);
        
        slotsToCreate.push({
          super_admin_id: superAdminId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: 30,
          is_available: true,
          is_recurring: slotForm.isRecurring,
          recurring_pattern: slotForm.isRecurring ? slotForm.recurringPattern : null,
        });
      });
      
      // Créneaux de l'après-midi (13h à 16h30)
      const afternoonSlots = [
        { hour: 13, minute: 0 },
        { hour: 13, minute: 30 },
        { hour: 14, minute: 0 },
        { hour: 14, minute: 30 },
        { hour: 15, minute: 0 },
        { hour: 15, minute: 30 },
        { hour: 16, minute: 0 },
        { hour: 16, minute: 30 },
      ];
      
      afternoonSlots.forEach(({ hour, minute }) => {
        const startTime = new Date(selectedDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);
        
        slotsToCreate.push({
          super_admin_id: superAdminId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: 30,
          is_available: true,
          is_recurring: slotForm.isRecurring,
          recurring_pattern: slotForm.isRecurring ? slotForm.recurringPattern : null,
        });
      });

      // Insérer tous les créneaux en une seule fois
      const { error } = await supabase.from("appointment_slots").insert(slotsToCreate);

      if (error) throw error;

      toast.success(`${slotsToCreate.length} créneaux créés avec succès`);
      setShowSlotDialog(false);
      fetchData();
    } catch (error: any) {
      console.error("Error creating slots:", error);
      toast.error(error.message || "Erreur lors de la création des créneaux");
    }
  };

  const handleToggleSlotAvailability = async (slotId: string, isAvailable: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from("appointment_slots")
        .update({ is_available: !isAvailable })
        .eq("id", slotId);

      if (error) throw error;

      toast.success(`Plage horaire ${!isAvailable ? "ouverte" : "fermée"}`);
      fetchData();
    } catch (error: any) {
      console.error("Error toggling slot:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleCreateAppointment = async () => {
    if (!supabase) return;

    try {
      // Trouver l'apprenant par email
      const { data: learner } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", appointmentForm.learnerEmail)
        .single();

      if (!learner) {
        toast.error("Aucun utilisateur trouvé avec cet email");
        return;
      }

      const startDateTime = new Date(`${appointmentForm.startDate}T${appointmentForm.startTime}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + appointmentForm.duration);

      const { error } = await supabase.from("appointments").insert({
        super_admin_id: superAdminId,
        learner_id: learner.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: "confirmed",
        subject: appointmentForm.subject || null,
        notes: appointmentForm.notes || null,
      });

      if (error) throw error;

      // Envoyer une notification de confirmation
      await sendAppointmentNotification(learner.id, startDateTime, "confirmation");

      toast.success("Rendez-vous créé avec succès");
      setShowAppointmentDialog(false);
      setAppointmentForm({
        learnerEmail: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        duration: 30,
        subject: "",
        notes: "",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast.error(error.message || "Erreur lors de la création du rendez-vous");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!supabase) return;

    try {
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (!appointment) return;

      // Supprimer le rendez-vous (pas juste le marquer comme annulé, pour libérer le créneau)
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      // Envoyer une notification d'annulation
      if (appointment.learner_id) {
        await sendAppointmentNotification(appointment.learner_id, new Date(appointment.start_time), "cancellation");
      }

      toast.success("Rendez-vous annulé et créneau libéré");
      fetchData();
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast.error("Erreur lors de l'annulation");
    }
  };

  const sendAppointmentNotification = async (
    learnerId: string,
    appointmentTime: Date,
    type: "confirmation" | "reminder" | "cancellation"
  ) => {
    try {
      const response = await fetch("/api/agenda/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          appointmentTime: appointmentTime.toISOString(),
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de la notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="slots">Plages horaires</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Navigation du calendrier */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            >
              Semaine précédente
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMM", { locale: fr })} -{" "}
              {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale: fr })}
            </h2>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              Semaine suivante
            </Button>
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayAppointments = appointments.filter((apt) =>
                isSameDay(new Date(apt.start_time), day)
              );
              const daySlots = slots.filter((slot) => isSameDay(new Date(slot.start_time), day));

              return (
                <Card
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[200px]",
                    isToday(day) && "border-blue-500 border-2"
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900">
                      {format(day, "EEE d", { locale: fr })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={cn(
                          "rounded-lg border p-2 text-xs",
                          apt.status === "confirmed" && "border-green-500 bg-green-50",
                          apt.status === "cancelled" && "border-red-500 bg-red-50",
                          apt.status === "pending" && "border-yellow-500 bg-yellow-50"
                        )}
                      >
                        <div className="font-semibold">{format(new Date(apt.start_time), "HH:mm")}</div>
                        <div className="text-gray-600">{apt.learner_name}</div>
                        {apt.subject && <div className="text-gray-500">{apt.subject}</div>}
                        <div className="mt-1 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => handleCancelAppointment(apt.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {daySlots.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {daySlots.filter((s) => s.is_available).length} créneaux disponibles
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowAppointmentDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un rendez-vous
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="slots" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Plages horaires</h2>
            <Button onClick={() => setShowSlotDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une plage horaire
            </Button>
          </div>

          <div className="space-y-4">
            {slots.map((slot) => (
              <Card key={slot.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {format(new Date(slot.start_time), "d MMM yyyy à HH:mm", { locale: fr })} -{" "}
                        {format(new Date(slot.end_time), "HH:mm", { locale: fr })}
                      </div>
                      <div className="text-sm text-gray-600">
                        Durée : {slot.duration_minutes} minutes
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slot.is_available ? "default" : "secondary"}>
                      {slot.is_available ? "Disponible" : "Fermé"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSlotAvailability(slot.id, slot.is_available)}
                    >
                      {slot.is_available ? "Fermer" : "Ouvrir"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {slots.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-600">
                Aucune plage horaire créée
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog pour créer une plage horaire */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une plage horaire</DialogTitle>
            <DialogDescription>
              Définissez une nouvelle plage horaire disponible pour les rendez-vous
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={slotForm.startDate}
                  onChange={(e) => setSlotForm({ ...slotForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Durée (minutes)</Label>
                <Input
                  type="number"
                  value={slotForm.duration}
                  onChange={(e) => setSlotForm({ ...slotForm, duration: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSlotDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSlot}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer un rendez-vous */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un rendez-vous</DialogTitle>
            <DialogDescription>
              Ajoutez un rendez-vous manuellement pour un apprenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email de l&apos;apprenant</Label>
              <Input
                type="email"
                value={appointmentForm.learnerEmail}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, learnerEmail: e.target.value })}
                placeholder="apprenant@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={appointmentForm.startDate}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={appointmentForm.startTime}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                value={appointmentForm.duration}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, duration: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Sujet (optionnel)</Label>
              <Input
                value={appointmentForm.subject}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, subject: e.target.value })}
                placeholder="Sujet du rendez-vous"
              />
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                placeholder="Notes internes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateAppointment}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

