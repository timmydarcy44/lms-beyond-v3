import type { Metadata } from "next";
import { SuperTrainingCoursesManager } from "@/components/super-admin/super-training-courses-manager";

export const metadata: Metadata = {
  title: "Formations Online | Super Admin",
  description: "Administrer les formations accessibles aux particuliers.",
};

export const dynamic = "force-dynamic";

export default function SuperFormationsOnlinePage() {
  return <SuperTrainingCoursesManager catalog="online" />;
}
