import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getJessicaUserDetails } from "@/lib/queries/jessica-users";
import { getJessicaResources } from "@/lib/queries/jessica-resources";
import { UserDetailsClient } from "./user-details-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JessicaUserDetailPage({ params }: UserDetailPageProps) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const [userDetails, resources] = await Promise.all([
    getJessicaUserDetails(id),
    getJessicaResources(),
  ]);

  if (!userDetails) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/super/gestion-client">
            <Button
              variant="ghost"
              className="mb-4"
              style={{ color: "#C6A664" }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: "#2F2A25" }}
          >
            {userDetails.fullName || "Utilisateur sans nom"}
          </h1>
          <p 
            className="text-lg"
            style={{ color: "#2F2A25", opacity: 0.7 }}
          >
            {userDetails.email}
          </p>
        </div>

        {/* Contenu */}
        <UserDetailsClient userDetails={userDetails} availableResources={resources} />
      </div>
    </div>
  );
}

