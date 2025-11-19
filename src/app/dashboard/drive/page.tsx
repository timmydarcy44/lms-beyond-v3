import { Suspense } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import DriveWorkspace from "./workspace";

export default function LearnerDrivePage() {
  return (
    <DashboardShell
      title="Drive"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Drive" },
      ]}
    >
      <Suspense fallback={<DriveSkeleton />}>
        <DriveWorkspace />
      </Suspense>
    </DashboardShell>
  );
}

function DriveSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 rounded-3xl border border-white/10 bg-white/5" />
      <Tabs defaultValue="all">
        <TabsList className="bg-white/5">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="shared">Partagés</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-3xl border border-white/10 bg-white/5" />
        ))}
      </div>
    </div>
  );
}
