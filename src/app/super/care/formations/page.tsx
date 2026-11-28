import type { Metadata } from "next";
import { SuperTrainingCoursesManager } from "@/components/super-admin/super-training-courses-manager";

export const metadata: Metadata = {
  title: "Formations Care | Byound Control",
};

export const dynamic = "force-dynamic";

export default function SuperCareFormationsPage() {
  return <SuperTrainingCoursesManager catalog="care" />;
}
