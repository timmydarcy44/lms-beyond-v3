"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Eye, Circle } from "lucide-react";
import { LearnerAssignmentModal } from "@/components/formateur/learner-assignment-modal";
import { GroupAssignmentModal } from "@/components/formateur/group-assignment-modal";
import type { FormateurLearner, FormateurGroup } from "@/lib/queries/formateur";
import type { AssignableContent } from "@/lib/queries/formateur";

type LearnerAssignmentClientProps = {
  learners: FormateurLearner[];
  groups: FormateurGroup[];
  assignableContent: AssignableContent;
};

export function LearnerAssignmentClient({
  learners,
  groups,
  assignableContent,
}: LearnerAssignmentClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<FormateurLearner | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<FormateurGroup | null>(null);
  const [isLearnerModalOpen, setIsLearnerModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vérifier le statut de connexion des apprenants
  useEffect(() => {
    if (!mounted || learners.length === 0) return;

    const fetchOnlineStatus = async () => {
      try {
        const learnerIds = learners.map((l) => l.id).join(",");
        const response = await fetch(`/api/learners/online-status?learnerIds=${learnerIds}`);
        if (response.ok) {
          const data = await response.json();
          setOnlineStatus(data.onlineStatus || {});
        }
      } catch (error) {
        console.error("[learner-assignment] Error fetching online status:", error);
      }
    };

    fetchOnlineStatus();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchOnlineStatus, 10000);
    return () => clearInterval(interval);
  }, [mounted, learners]);

  const handleOpenLearnerModal = (learner: FormateurLearner) => {
    setSelectedLearner(learner);
    setIsLearnerModalOpen(true);
  };

  const handleCloseLearnerModal = () => {
    setIsLearnerModalOpen(false);
    setSelectedLearner(null);
  };

  const handleOpenGroupModal = (group: FormateurGroup) => {
    setSelectedGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setSelectedGroup(null);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="grid w-full grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <div className="h-9 rounded-md bg-background" />
          <div className="h-9 rounded-md" />
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-white/10 bg-white/5">
                <CardContent className="p-6">
                  <div className="h-20 animate-pulse rounded bg-white/10" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="learners" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="learners">
            Apprenants ({learners.length})
          </TabsTrigger>
          <TabsTrigger value="groups">
            Groupes ({groups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learners" className="space-y-4">
          {learners.length === 0 ? (
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <UserPlus className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-sm text-white/60">Aucun apprenant disponible</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {learners.map((learner) => (
                <Card
                  key={learner.id}
                  className="group border border-white/10 bg-gradient-to-br from-[#1f2937]/70 via-[#111827]/80 to-[#020617]/80 transition hover:border-white/20 hover:bg-white/5 cursor-pointer"
                  onClick={() => router.push(`/dashboard/formateur/apprenants/${learner.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Statut de connexion au-dessus du nom */}
                          <div className="mb-1.5">
                            {onlineStatus[learner.id] ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
                                <span>En ligne</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-white/40">
                                <Circle className="h-2 w-2 fill-white/40 text-white/40" />
                                <span>Hors ligne</span>
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-white">
                            {learner.full_name ?? "Apprenant sans nom"}
                          </h3>
                          <p className="mt-1 text-sm text-white/60">{learner.email ?? "Email non renseigné"}</p>
                        </div>
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center text-white font-semibold text-sm">
                          {learner.full_name
                            ? learner.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "?"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Badge className="rounded-full bg-emerald-500/20 text-emerald-200 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                          Actif
                        </Badge>
                        <div className="ml-auto flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/formateur/apprenants/${learner.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLearnerModal(learner);
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assigner
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {groups.length === 0 ? (
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-sm text-white/60">Aucun groupe disponible</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="group border border-white/10 bg-gradient-to-br from-[#1f2937]/70 via-[#111827]/80 to-[#020617]/80 transition hover:border-white/20 hover:bg-white/5"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                          <p className="mt-1 text-sm text-white/60">{group.members_count} membre{group.members_count > 1 ? "s" : ""}</p>
                        </div>
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0072FF] flex items-center justify-center text-white font-semibold text-sm">
                          <Users className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Badge className="rounded-full bg-blue-500/20 text-blue-200 px-3 py-1 text-xs uppercase tracking-[0.3em]">
                          Groupe
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto border-white/20 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => handleOpenGroupModal(group)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assigner
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedLearner && (
        <LearnerAssignmentModal
          open={isLearnerModalOpen}
          onOpenChange={setIsLearnerModalOpen}
          learner={selectedLearner}
          content={assignableContent}
        />
      )}

      {selectedGroup && (
        <GroupAssignmentModal
          open={isGroupModalOpen}
          onOpenChange={setIsGroupModalOpen}
          group={selectedGroup}
          content={assignableContent}
        />
      )}
    </>
  );
}

