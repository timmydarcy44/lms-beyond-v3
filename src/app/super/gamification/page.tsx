import { MediaTrainingSimulator } from "@/components/super-admin/media-training-simulator";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { hasUserFeature } from "@/lib/queries/organization-features";
import { redirect } from "next/navigation";

export default async function GamificationDemoPage() {
  // Les super admins ont toujours accès
  const isSuper = await isSuperAdmin();
  
  // Pour les autres utilisateurs, vérifier si leur organisation a la fonctionnalité
  if (!isSuper) {
    const hasAccess = await hasUserFeature("gamification");
    if (!hasAccess) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen">
      <MediaTrainingSimulator />
    </div>
  );
}

