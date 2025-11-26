"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Euro, ShoppingBag, FileText, Calendar, Mail, Phone, User, Plus, Loader2, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { JessicaUserDetails } from "@/lib/queries/jessica-users";
import type { JessicaResource } from "@/lib/queries/jessica-resources";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type UserDetailsClientProps = {
  userDetails: JessicaUserDetails;
  availableResources: JessicaResource[];
};

export function UserDetailsClient({ userDetails, availableResources }: UserDetailsClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAssigning, setIsAssigning] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Couleurs de branding Jessica Contentin
  const bgColor = "#FFFFFF";
  const surfaceColor = "#F8F5F0";
  const textColor = "#2F2A25";
  const primaryColor = "#C6A664";
  const secondaryColor = "#E6D9C6";

  const handleAssignResource = async (catalogItemId: string) => {
    console.log("[UserDetailsClient] ====== handleAssignResource START ======");
    console.log("[UserDetailsClient] userId:", userDetails.id);
    console.log("[UserDetailsClient] catalogItemId:", catalogItemId);
    console.log("[UserDetailsClient] userDetails:", userDetails);
    
    setIsAssigning(true);
    try {
      const requestBody = {
        userId: userDetails.id,
        catalogItemId,
      };
      console.log("[UserDetailsClient] Request body:", requestBody);
      console.log("[UserDetailsClient] Sending request to /api/admin/assign-resource");
      
      const response = await fetch("/api/admin/assign-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[UserDetailsClient] Response status:", response.status);
      console.log("[UserDetailsClient] Response ok:", response.ok);
      
      const data = await response.json();
      console.log("[UserDetailsClient] Response data:", data);
      console.log("[UserDetailsClient] ====== handleAssignResource END ======");

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'assignation");
      }

      toast.success("Ressource assignée avec succès ! Un email a été envoyé au client.");
      
      // Recharger la page pour mettre à jour les données
      window.location.reload();
    } catch (error: any) {
      console.error("[UserDetailsClient] Error assigning resource:", error);
      toast.error(error.message || "Erreur lors de l'assignation de la ressource");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeResource = async (catalogItemId: string, purchaseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer l'accès à cette ressource ?")) {
      return;
    }

    setRevokingId(purchaseId);
    try {
      const response = await fetch("/api/admin/revoke-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userDetails.id,
          catalogItemId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du retrait de l'accès");
      }

      toast.success("Accès retiré avec succès");
      
      // Recharger la page pour mettre à jour les données
      window.location.reload();
    } catch (error: any) {
      console.error("[UserDetailsClient] Error revoking resource:", error);
      toast.error(error.message || "Erreur lors du retrait de l'accès");
    } finally {
      setRevokingId(null);
    }
  };

  // Filtrer les ressources déjà assignées
  const assignedResourceIds = new Set(userDetails.purchases.map(p => p.catalogItemId));
  const availableToAssign = availableResources.filter(r => !assignedResourceIds.has(r.id));

  console.log("[UserDetailsClient] Component render:", {
    availableResourcesCount: availableResources.length,
    assignedResourceIds: Array.from(assignedResourceIds),
    availableToAssignCount: availableToAssign.length,
    availableToAssign: availableToAssign.map(r => ({ id: r.id, title: r.title })),
  });

  return (
    <div className="space-y-6">
      {/* Bouton Assigner une ressource */}
      <Card
        className="rounded-2xl border-2"
        style={{
          borderColor: secondaryColor,
          backgroundColor: bgColor,
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: textColor }}>
                Assigner une ressource
              </h3>
              <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                Ouvrir l'accès à une ressource pour ce client
              </p>
            </div>
            {availableToAssign.length > 0 ? (
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isAssigning || availableToAssign.length === 0}
                  className="rounded-full px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: "white",
                  }}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assignation...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Assigner une ressource
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="max-h-[400px] overflow-y-auto"
                style={{
                  backgroundColor: bgColor,
                  borderColor: secondaryColor,
                }}
              >
                {availableToAssign.length === 0 ? (
                  <div className="px-4 py-2 text-sm" style={{ color: textColor, opacity: 0.7 }}>
                    Toutes les ressources sont déjà assignées
                  </div>
                ) : (
                  availableToAssign.map((resource) => {
                    console.log("[UserDetailsClient] Rendering dropdown item:", { resourceId: resource.id, resourceTitle: resource.title });
                    
                    return (
                      <DropdownMenuItem
                        key={resource.id}
                        onSelect={(e) => {
                          console.log("[UserDetailsClient] ====== onSelect TRIGGERED ======");
                          console.log("[UserDetailsClient] Resource ID:", resource.id);
                          console.log("[UserDetailsClient] Resource Title:", resource.title);
                          console.log("[UserDetailsClient] Event:", e);
                          
                          // Empêcher la fermeture automatique du dropdown
                          e.preventDefault();
                          
                          // Fermer manuellement le dropdown
                          setDropdownOpen(false);
                          
                          // Appeler directement la fonction d'assignation
                          console.log("[UserDetailsClient] Calling handleAssignResource...");
                          handleAssignResource(resource.id);
                        }}
                        className="cursor-pointer"
                        style={{
                          color: textColor,
                        }}
                      >
                        <div className="flex flex-col w-full">
                          <span className="font-medium">{resource.title}</span>
                          <span className="text-xs opacity-70">
                            {resource.item_type === "module" ? "Module" :
                             resource.item_type === "ressource" ? "Ressource" :
                             resource.item_type === "test" ? "Test" :
                             resource.item_type === "parcours" ? "Parcours" : resource.item_type}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            ) : (
              <div className="px-4 py-2 text-sm" style={{ color: textColor, opacity: 0.7 }}>
                Toutes les ressources sont déjà assignées
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="rounded-2xl border-2"
          style={{
            borderColor: secondaryColor,
            backgroundColor: bgColor,
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Euro className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: textColor, opacity: 0.7 }}
                >
                  CA généré
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {userDetails.totalRevenue.toFixed(2)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="rounded-2xl border-2"
          style={{
            borderColor: secondaryColor,
            backgroundColor: bgColor,
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <ShoppingBag className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: textColor, opacity: 0.7 }}
                >
                  Nombre d'achats
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: textColor }}
                >
                  {userDetails.purchaseCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="rounded-2xl border-2"
          style={{
            borderColor: secondaryColor,
            backgroundColor: bgColor,
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <FileText className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: textColor, opacity: 0.7 }}
                >
                  Tests réalisés
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: textColor }}
                >
                  {userDetails.testCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations utilisateur */}
      <Card
        className="rounded-2xl border-2"
        style={{
          borderColor: secondaryColor,
          backgroundColor: bgColor,
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: textColor }}>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" style={{ color: textColor, opacity: 0.5 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: textColor, opacity: 0.7 }}>
                  Email
                </p>
                <p className="text-base" style={{ color: textColor }}>
                  {userDetails.email}
                </p>
              </div>
            </div>
            {userDetails.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5" style={{ color: textColor, opacity: 0.5 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: textColor, opacity: 0.7 }}>
                    Téléphone
                  </p>
                  <p className="text-base" style={{ color: textColor }}>
                    {userDetails.phone}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5" style={{ color: textColor, opacity: 0.5 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: textColor, opacity: 0.7 }}>
                  Date d'inscription
                </p>
                <p className="text-base" style={{ color: textColor }}>
                  {format(new Date(userDetails.createdAt), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour Achats et Tests */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="rounded-full p-1"
          style={{ backgroundColor: surfaceColor }}
        >
          <TabsTrigger
            value="overview"
            className="rounded-full px-6"
            style={{
              backgroundColor: activeTab === "overview" ? primaryColor : "transparent",
              color: activeTab === "overview" ? "white" : textColor,
            }}
          >
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger
            value="purchases"
            className="rounded-full px-6"
            style={{
              backgroundColor: activeTab === "purchases" ? primaryColor : "transparent",
              color: activeTab === "purchases" ? "white" : textColor,
            }}
          >
            Achats ({userDetails.purchases.length})
          </TabsTrigger>
          <TabsTrigger
            value="tests"
            className="rounded-full px-6"
            style={{
              backgroundColor: activeTab === "tests" ? primaryColor : "transparent",
              color: activeTab === "tests" ? "white" : textColor,
            }}
          >
            Tests ({userDetails.testResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Derniers achats */}
            <Card
              className="rounded-2xl border-2"
              style={{
                borderColor: secondaryColor,
                backgroundColor: bgColor,
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: textColor }}>Derniers achats</CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.purchases.slice(0, 5).length === 0 ? (
                  <p style={{ color: textColor, opacity: 0.7 }}>
                    Aucun achat pour le moment
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userDetails.purchases.slice(0, 5).map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: surfaceColor }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate" style={{ color: textColor }}>
                              {purchase.title}
                            </p>
                            {purchase.accessStatus === "manually_granted" && (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                                style={{
                                  backgroundColor: `${primaryColor}20`,
                                  color: primaryColor,
                                }}
                              >
                                Assigné
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                            {format(new Date(purchase.purchasedAt), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold" style={{ color: primaryColor }}>
                            {purchase.price.toFixed(2)}€
                          </p>
                          {purchase.accessStatus === "manually_granted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeResource(purchase.catalogItemId, purchase.id)}
                              disabled={revokingId === purchase.id}
                              className="h-8 w-8 p-0"
                              style={{ color: "#EF4444" }}
                            >
                              {revokingId === purchase.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Derniers tests */}
            <Card
              className="rounded-2xl border-2"
              style={{
                borderColor: secondaryColor,
                backgroundColor: bgColor,
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: textColor }}>Derniers tests</CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.testResults.slice(0, 5).length === 0 ? (
                  <p style={{ color: textColor, opacity: 0.7 }}>
                    Aucun test réalisé pour le moment
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userDetails.testResults.slice(0, 5).map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: surfaceColor }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: textColor }}>
                            {test.testTitle}
                          </p>
                          <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                            {format(new Date(test.completedAt), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        {test.percentage !== undefined && (
                          <p className="font-bold ml-4" style={{ color: primaryColor }}>
                            {test.percentage.toFixed(0)}%
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6">
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: secondaryColor,
              backgroundColor: bgColor,
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: textColor }}>
                Historique des achats ({userDetails.purchases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userDetails.purchases.length === 0 ? (
                <p style={{ color: textColor, opacity: 0.7 }}>
                  Aucun achat pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {userDetails.purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center gap-4 p-4 rounded-lg border-2"
                      style={{
                        borderColor: secondaryColor,
                        backgroundColor: surfaceColor,
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg" style={{ color: textColor }}>
                            {purchase.title}
                          </h3>
                          {purchase.accessStatus === "manually_granted" && (
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${primaryColor}20`,
                                color: primaryColor,
                              }}
                            >
                              Assigné manuellement
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span
                            className="px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: `${primaryColor}20`,
                              color: primaryColor,
                            }}
                          >
                            {purchase.itemType === "ressource" ? "Ressource" :
                             purchase.itemType === "module" ? "Module" :
                             purchase.itemType === "test" ? "Test" : purchase.itemType}
                          </span>
                          <span style={{ color: textColor, opacity: 0.7 }}>
                            {format(new Date(purchase.purchasedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                            {purchase.price.toFixed(2)}€
                          </p>
                          <p className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
                            {purchase.status === "completed" ? "Payé" : purchase.status}
                          </p>
                        </div>
                        {purchase.accessStatus === "manually_granted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeResource(purchase.catalogItemId, purchase.id)}
                            disabled={revokingId === purchase.id}
                            className="rounded-full"
                            style={{
                              borderColor: "#EF4444",
                              color: "#EF4444",
                            }}
                          >
                            {revokingId === purchase.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Retrait...
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Retirer
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="mt-6">
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: secondaryColor,
              backgroundColor: bgColor,
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: textColor }}>
                Résultats des tests ({userDetails.testResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userDetails.testResults.length === 0 ? (
                <p style={{ color: textColor, opacity: 0.7 }}>
                  Aucun test réalisé pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {userDetails.testResults.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center gap-4 p-4 rounded-lg border-2"
                      style={{
                        borderColor: secondaryColor,
                        backgroundColor: surfaceColor,
                      }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1" style={{ color: textColor }}>
                          {test.testTitle}
                        </h3>
                        <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                          {format(new Date(test.completedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        {test.percentage !== undefined && (
                          <>
                            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                              {test.percentage.toFixed(0)}%
                            </p>
                            {test.score !== undefined && (
                              <p className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
                                Score: {test.score}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

