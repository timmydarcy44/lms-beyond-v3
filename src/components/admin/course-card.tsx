"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type CourseCardProps = {
  course: {
    id: string;
    title: string;
    status?: string | null;
    slug?: string | null;
    cover_image?: string | null;
  };
  isBeyond?: boolean;
  isPSG?: boolean;
};

export function CourseCard({ course, isBeyond = false, isPSG = false }: CourseCardProps) {
  const router = useRouter();
  
  // Utiliser le slug si disponible, sinon l'ID
  const courseSlug = course.slug || course.id;
  const courseDetailUrl = `/admin/formations/${courseSlug}`;

  const handleAssignToLearner = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/apprenants?assignCourse=${course.id}`);
  };

  const handleAssignToGroup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/groupes?assignCourse=${course.id}`);
  };

  const cardClasses = isBeyond && isPSG
    ? "rounded-lg border-2 border-blue-500/40 bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-red-600/20 overflow-hidden hover:from-blue-600/30 hover:via-blue-500/25 hover:to-red-600/30 transition-all shadow-lg shadow-blue-500/10"
    : isBeyond
    ? "rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 overflow-hidden hover:from-blue-500/20 hover:to-purple-500/20 transition"
    : "rounded-lg border border-white/10 bg-white/5 overflow-hidden hover:bg-white/10 transition";

  const badgeClasses = isBeyond && isPSG
    ? "inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-500/40 to-red-500/40 text-white border border-blue-400/50"
    : isBeyond
    ? "inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-500/30 text-blue-200 border border-blue-400/40"
    : "";

  const coverImage = course.cover_image || 
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";

  return (
    <Link href={courseDetailUrl} className="block">
      <div className={`${cardClasses} cursor-pointer`}>
        {/* Image de couverture */}
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={coverImage}
            alt={course.title}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";
            }}
          />
          {isBeyond && (
            <div className="absolute top-2 right-2">
              <span className={badgeClasses}>Beyond</span>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white mb-2 line-clamp-2">{course.title}</h3>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  course.status === "published"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                }`}
              >
                {course.status === "published" ? "Publié" : "Brouillon"}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            <Button
              onClick={handleAssignToLearner}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assigner à un apprenant
            </Button>
            <Button
              onClick={handleAssignToGroup}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Assigner à un groupe
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

