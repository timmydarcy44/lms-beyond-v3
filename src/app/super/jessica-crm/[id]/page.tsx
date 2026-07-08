import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaUserDetails } from "@/lib/queries/jessica-users";
import { getJessicaResources } from "@/lib/queries/jessica-resources";
import { UserDetailsClient } from "@/app/super/gestion-client/[id]/user-details-client";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JessicaCrmClientPage({ params }: PageProps) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (user?.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
    redirect("/super");
  }

  const { id } = await params;
  const [userDetails, resources] = await Promise.all([
    getJessicaUserDetails(id),
    getJessicaResources(),
  ]);

  if (!userDetails) notFound();

  const displayName = formatClientName(userDetails.firstName, userDetails.lastName);

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/super/jessica-crm">
            <Button variant="ghost" className="mb-4" style={{ color: "#C6A664" }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au CRM
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#2F2A25" }}>
            {displayName}
          </h1>
          <p className="text-lg" style={{ color: "#2F2A25", opacity: 0.7 }}>
            {userDetails.email}
            {userDetails.phone ? ` · ${userDetails.phone}` : ""}
          </p>
        </div>
        <UserDetailsClient userDetails={userDetails} availableResources={resources} />
      </div>
    </div>
  );
}
