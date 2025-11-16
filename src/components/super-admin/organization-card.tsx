"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar } from "lucide-react";
import Image from "next/image";

type Organization = {
  id: string;
  name: string;
  slug?: string | null;
  memberCount: number;
  createdAt?: string | null;
  logo?: string | null;
};

type OrganizationCardProps = {
  organization: Organization;
};

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const href = `/super/organisations/${organization.id}`;

  return (
    <Link
      href={href}
      className="block h-full no-underline"
      prefetch={true}
    >
      <Card className="h-full border-gray-200 bg-gradient-to-br from-white to-blue-50/20 shadow-sm transition hover:border-gray-300 hover:shadow-md cursor-pointer overflow-hidden group">
        {/* Cover avec logo */}
        <div className="relative h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {organization.logo ? (
            <Image
              src={organization.logo}
              alt={`${organization.name} logo`}
              fill
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Building2 className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
        </div>
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                {organization.name}
              </CardTitle>
              {organization.slug && (
                <p className="text-xs text-gray-500 font-mono">/{organization.slug}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{organization.memberCount} membre{organization.memberCount !== 1 ? "s" : ""}</span>
          </div>
          {organization.createdAt && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>
                Créée le {new Date(organization.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          )}
          <div className="pt-2">
            <span className="text-xs text-gray-600 hover:text-gray-900">
              Voir les détails →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}




