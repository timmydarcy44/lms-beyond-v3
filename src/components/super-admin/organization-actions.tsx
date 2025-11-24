"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { restrictOrganizationAction, deleteOrganizationAction } from "@/app/super/organisations/[orgId]/actions";
import { useRouter } from "next/navigation";

type OrganizationActionsProps = {
  organizationId: string;
  isRestricted?: boolean;
};

export function OrganizationActions({ organizationId, isRestricted = false }: OrganizationActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestricting, setIsRestricting] = useState(false);

  const handleRestrict = async () => {
    if (!confirm("Êtes-vous sûr de vouloir restreindre cette organisation ? Les utilisateurs ne pourront plus y accéder.")) {
      return;
    }

    setIsRestricting(true);
    try {
      const result = await restrictOrganizationAction(organizationId, !isRestricted);
      if (result.success) {
        toast.success(isRestricted ? "Organisation dérestreinte" : "Organisation restreinte");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la restriction");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsRestricting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette organisation ? Cette action est irréversible.")) {
      return;
    }

    if (!confirm("CONFIRMATION FINALE : Supprimer définitivement cette organisation et toutes ses données ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOrganizationAction(organizationId);
      if (result.success) {
        toast.success("Organisation supprimée");
        router.push("/super/organisations");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestrict}
        disabled={isRestricting}
        className={isRestricted ? "border-orange-300 text-orange-700 hover:bg-orange-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
      >
        {isRestricted ? (
          <>
            <Unlock className="h-4 w-4 mr-2" />
            Dérestreindre
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Restreindre
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer
      </Button>
    </div>
  );
}









