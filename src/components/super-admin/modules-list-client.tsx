"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import {
  Building2,
  Edit2,
  Eye,
  Route,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type Module = {
  id: string;
  title: string;
  status: string;
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
  creator_id: string;
};

type PathOption = { id: string; title: string };
type PathRelation = { path_id: string; course_id: string };
type OrganizationOption = { id: string; name: string };
type CatalogItemMeta = { id: string; content_id: string; is_active: boolean; item_type: string };
type CatalogAccessMeta = { catalog_item_id: string; organization_id: string; access_status: string };

type ModulesListClientProps = {
  modules: Module[];
  paths: PathOption[];
  pathRelations: PathRelation[];
  organizations: OrganizationOption[];
  catalogItems: CatalogItemMeta[];
  catalogAccess: CatalogAccessMeta[];
};

type ModuleAssignmentDialogProps = {
  module: Module;
  paths: PathOption[];
  assignedPaths: PathOption[];
  organizations: OrganizationOption[];
  assignedOrganizations: { organization: OrganizationOption; access_status: string }[];
  catalogItem?: CatalogItemMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
};

const statusLabels: Record<string, string> = {
  pending_payment: "En attente",
  purchased: "Acheté",
  manually_granted: "Accès manuel",
  free: "Libre",
};

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500/10 text-yellow-200 border-yellow-500/40",
  purchased: "bg-blue-500/10 text-blue-200 border-blue-500/40",
  manually_granted: "bg-emerald-500/10 text-emerald-200 border-emerald-500/40",
  free: "bg-purple-500/10 text-purple-200 border-purple-500/40",
};

function ModuleAssignmentDialog({
  module,
  paths,
  assignedPaths,
  organizations,
  assignedOrganizations,
  catalogItem,
  open,
  onOpenChange,
  onRefresh,
}: ModuleAssignmentDialogProps) {
  const router = useRouter();
  const [selectedPathId, setSelectedPathId] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [isCatalogActive, setIsCatalogActive] = useState(catalogItem?.is_active ?? false);
  const [isTogglingCatalog, setIsTogglingCatalog] = useState(false);
  const [isAssigningPath, setIsAssigningPath] = useState(false);
  const [isAssigningOrg, setIsAssigningOrg] = useState(false);

  const availablePaths = useMemo(
    () => paths.filter((path) => !assignedPaths.some((assigned) => assigned.id === path.id)),
    [paths, assignedPaths],
  );

  const availableOrgs = useMemo(
    () =>
      organizations.filter(
        (org) => !assignedOrganizations.some((assigned) => assigned.organization.id === org.id),
      ),
    [organizations, assignedOrganizations],
  );

  const handleAssignPath = async () => {
    if (!selectedPathId) return;
    setIsAssigningPath(true);
    try {
      const response = await fetch("/api/super-admin/modules/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_to_path",
          moduleId: module.id,
          pathId: selectedPathId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossible d’ajouter le module au parcours");
      }

      toast.success("Module ajouté au parcours");
      setSelectedPathId("");
      onRefresh();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l’ajout au parcours");
    } finally {
      setIsAssigningPath(false);
    }
  };

  const handleRemovePath = async (pathId: string) => {
    try {
      const response = await fetch("/api/super-admin/modules/assign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_from_path",
          moduleId: module.id,
          pathId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossible de retirer le module du parcours");
      }

      toast.success("Module retiré du parcours");
      onRefresh();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du retrait du parcours");
    }
  };

  const handleToggleCatalog = async (checked: boolean) => {
    setIsTogglingCatalog(true);
    try {
      const response = await fetch("/api/super-admin/modules/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_catalog_status",
          moduleId: module.id,
          isActive: checked,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossible de mettre à jour le catalogue");
      }

      setIsCatalogActive(checked);
      toast.success(checked ? "Module activé dans No School" : "Module retiré de No School");
      onRefresh();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
      setIsCatalogActive((prev) => prev);
    } finally {
      setIsTogglingCatalog(false);
    }
  };

  const handleAssignOrganization = async () => {
    if (!selectedOrgId) return;
    setIsAssigningOrg(true);
    try {
      const response = await fetch("/api/super-admin/modules/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_org",
          moduleId: module.id,
          organizationId: selectedOrgId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossible d’accorder l’accès");
      }

      toast.success("Accès accordé à l’organisation");
      setSelectedOrgId("");
      onRefresh();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l’octroi de l’accès");
    } finally {
      setIsAssigningOrg(false);
    }
  };

  const handleRemoveOrganization = async (organizationId: string) => {
    try {
      const response = await fetch("/api/super-admin/modules/assign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_org",
          moduleId: module.id,
          organizationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossible de retirer l’accès");
      }

      toast.success("Accès retiré");
      onRefresh();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du retrait de l’accès");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border border-white/10 bg-[#0b0b0f] text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Gérer le module « {module.title || "Sans titre"} »
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Assigne ce module à des parcours, active-le dans No School et accorde des accès aux organisations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          <section className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Parcours</h3>
                <p className="text-xs text-white/60">
                  Ajoute ce module à un parcours existant. Il apparaîtra instantanément dans la structure.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Select value={selectedPathId} onValueChange={setSelectedPathId}>
                  <SelectTrigger className="h-9 w-full border-white/20 bg-white/10 text-left text-sm text-white md:w-56">
                    <SelectValue placeholder="Choisir un parcours" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0b0f] text-white">
                    {availablePaths.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        Aucun autre parcours
                      </SelectItem>
                    ) : (
                      availablePaths.map((path) => (
                        <SelectItem key={path.id} value={path.id}>
                          {path.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignPath}
                  disabled={!selectedPathId || isAssigningPath || selectedPathId === "__none"}
                  className="h-9 rounded-full bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isAssigningPath ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>

            {assignedPaths.length ? (
              <div className="flex flex-wrap gap-2">
                {assignedPaths.map((path) => (
                  <Badge
                    key={path.id}
                    className="flex items-center gap-2 border-white/20 bg-white/10 text-white"
                  >
                    <Route className="h-3.5 w-3.5 text-white/60" />
                    <span>{path.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePath(path.id)}
                      className="rounded-full bg-white/10 p-1 text-white/70 transition hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50">Aucun parcours lié pour le moment.</p>
            )}
          </section>

  <Separator className="bg-white/10" />

          <section className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <h3 className="text-sm font-semibold">No School</h3>
              <p className="text-xs text-white/60">
                Active ce module dans le catalogue No School pour le rendre disponible aux organisations et au B2C.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="catalog-toggle" className="text-sm text-white/70">
                {isCatalogActive ? "Actif" : "Inactif"}
              </Label>
              <Switch
                id="catalog-toggle"
                checked={isCatalogActive}
                onCheckedChange={handleToggleCatalog}
                disabled={isTogglingCatalog}
              />
            </div>
          </section>

  <Separator className="bg-white/10" />

          <section className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Organisations</h3>
                <p className="text-xs text-white/60">
                  Accorde un accès immédiat à une organisation. L’accès est enregistré comme “Accès manuel”.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="h-9 w-full border-white/20 bg-white/10 text-left text-sm text-white md:w-56">
                    <SelectValue placeholder="Choisir une organisation" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0b0f] text-white">
                    {availableOrgs.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        Toutes les organisations ont déjà accès
                      </SelectItem>
                    ) : (
                      availableOrgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignOrganization}
                  disabled={!selectedOrgId || isAssigningOrg || selectedOrgId === "__none"}
                  className="h-9 rounded-full bg-white/10 px-4 text-sm font-medium text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isAssigningOrg ? "Accès..." : "Accorder"}
                </Button>
              </div>
            </div>

            {assignedOrganizations.length ? (
              <div className="space-y-2">
                {assignedOrganizations.map(({ organization, access_status }) => (
                  <div
                    key={organization.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{organization.name}</p>
                      <Badge className={`${statusColors[access_status] ?? "bg-white/10 text-white"} mt-1 border`}>
                        {statusLabels[access_status] ?? access_status}
                      </Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white/60 hover:bg-white/10 hover:text-white"
                      onClick={() => handleRemoveOrganization(organization.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50">Aucune organisation n’a encore accès à ce module.</p>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModulesListClient({
  modules,
  paths,
  pathRelations,
  organizations,
  catalogItems,
  catalogAccess,
}: ModulesListClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignmentModule, setAssignmentModule] = useState<Module | null>(null);

  const statusConfig: Record<string, { label: string; className: string }> = {
    published: { label: "Publié", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" },
    draft: { label: "Brouillon", className: "border-white/20 bg-white/10 text-white/70" },
    scheduled: { label: "Programmé", className: "border-sky-500/30 bg-sky-500/10 text-sky-200" },
  };

  const catalogItemByModuleId = useMemo(() => {
    const map = new Map<string, CatalogItemMeta>();
    catalogItems.forEach((item) => {
      map.set(item.content_id, item);
    });
    return map;
  }, [catalogItems]);

  const pathsByModule = useMemo(() => {
    const map = new Map<string, PathOption[]>();
    pathRelations.forEach(({ course_id, path_id }) => {
      const path = paths.find((p) => p.id === path_id);
      if (!path) return;
      const current = map.get(course_id) ?? [];
      current.push(path);
      map.set(course_id, current);
    });
    return map;
  }, [pathRelations, paths]);

  const catalogAccessByItemId = useMemo(() => {
    const map = new Map<string, CatalogAccessMeta[]>();
    catalogAccess.forEach((access) => {
      const current = map.get(access.catalog_item_id) ?? [];
      current.push(access);
      map.set(access.catalog_item_id, current);
    });
    return map;
  }, [catalogAccess]);

  const organizationsByModule = useMemo(() => {
    const map = new Map<string, { organization: OrganizationOption; access_status: string }[]>();
    catalogItems.forEach((item) => {
      const accesses = catalogAccessByItemId.get(item.id) ?? [];
      const formatted = accesses
        .map((access) => {
          const org = organizations.find((o) => o.id === access.organization_id);
          if (!org) return null;
          return { organization: org, access_status: access.access_status };
        })
        .filter(Boolean) as { organization: OrganizationOption; access_status: string }[];
      map.set(item.content_id, formatted);
    });
    return map;
  }, [catalogItems, catalogAccessByItemId, organizations]);

  const handleDeleteClick = (module: Module) => {
    setModuleToDelete(module);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!moduleToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${moduleToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      toast.success("Module supprimé");
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer le module");
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshAssignments = () => {
    router.refresh();
  };

  if (modules.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/70">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <Eye className="h-8 w-8 text-white/60" />
        </div>
        <p className="text-sm">Aucun module pour le moment.</p>
        <p className="mt-1 text-xs text-white/50">
          Crée ton premier module pour commencer à bâtir ton univers pedagogy Beyond.
        </p>
        <Button
          asChild
          className="mt-6 rounded-full bg-white text-sm font-medium text-black hover:bg-white/90"
        >
          <Link href="/super/studio/modules/new">Créer un module</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const statusInfo = statusConfig[module.status] ?? statusConfig.draft;
          const assignedPaths = pathsByModule.get(module.id) ?? [];
          const assignedOrgs = organizationsByModule.get(module.id) ?? [];
          const catalogItem = catalogItemByModuleId.get(module.id);

          return (
            <div
              key={module.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-white/20"
            >
              <div className="relative h-48 overflow-hidden border-b border-white/10">
                {module.cover_image ? (
                  <Image
                    src={module.cover_image}
                    alt={module.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/10 to-white/0">
                    <Sparkles className="h-10 w-10 text-white/40" />
                  </div>
                )}
                <Badge className={`absolute right-4 top-4 border px-2.5 py-1 text-xs ${statusInfo.className}`}>
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                      Module
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white">
                      {module.title || "Sans titre"}
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Modifié {formatDistanceToNow(new Date(module.updated_at), { locale: fr })} ago
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Route className="h-3.5 w-3.5 text-white/40" />
                      <span>{assignedPaths.length} parcours</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Sparkles className={`h-3.5 w-3.5 ${catalogItem?.is_active ? "text-emerald-300" : "text-white/40"}`} />
                      <span>
                        {catalogItem?.is_active ? "Actif dans No School" : "Inactif dans No School"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Building2 className="h-3.5 w-3.5 text-white/40" />
                      <span>{assignedOrgs.length} organisation(s)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    onClick={() => setAssignmentModule(module)}
                    className="w-full rounded-full bg-white/10 text-sm font-medium text-white hover:bg-white/20"
                  >
                    Gérer les assignations
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 rounded-full border-white/20 bg-white/5 text-sm text-white hover:bg-white/10"
                    >
                      <Link href={`/super/studio/modules/${module.id}/structure`}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Modifier
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full border-red-500/30 bg-red-500/10 text-sm text-red-200 hover:bg-red-500/20"
                      onClick={() => handleDeleteClick(module)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border border-white/10 bg-[#0b0b0f] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le module</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Cette action est définitive et supprimera l’ensemble du contenu généré pour ce module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {assignmentModule && (
        <ModuleAssignmentDialog
          module={assignmentModule}
          paths={paths}
          assignedPaths={pathsByModule.get(assignmentModule.id) ?? []}
          organizations={organizations}
          assignedOrganizations={organizationsByModule.get(assignmentModule.id) ?? []}
          catalogItem={catalogItemByModuleId.get(assignmentModule.id)}
          open={Boolean(assignmentModule)}
          onOpenChange={(open) => {
            if (!open) {
              setAssignmentModule(null);
            }
          }}
          onRefresh={refreshAssignments}
        />
      )}
    </>
  );
}


