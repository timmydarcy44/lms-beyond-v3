import type { Metadata } from "next";
import { SuperTrainingCoursesManager } from "@/components/super-admin/super-training-courses-manager";

export const metadata: Metadata = {
  title: "Gestion des formations | Super Admin",
  description: "Administrer le catalogue formations EDGE Business.",
};

export const dynamic = "force-dynamic";

export default function SuperFormationsPage() {
  return <SuperTrainingCoursesManager />;
}
