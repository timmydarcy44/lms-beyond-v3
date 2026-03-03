import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
      <div className="mb-8">
        <Button
          asChild
          variant="ghost"
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
        >
          <Link href="/dashboard/apprenant">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour dashboard
          </Link>
        </Button>
      </div>

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
