import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { EdgeOnlineCourse } from "@/lib/queries/edge-online";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import { OrgFormationsEmpty } from "@/components/org/org-formations-shell";
import { cn } from "@/lib/utils";

export function OrgCatalogueEdgeView({
  courses,
  variant = "light",
}: {
  courses: EdgeOnlineCourse[];
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";

  if (!courses.length) {
    return (
      <OrgFormationsEmpty
        variant={variant}
        title="Catalogue EDGE indisponible"
        description="Aucune formation publiée n’a pu être chargée pour le moment."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className={cn("max-w-2xl text-sm", isDark ? "text-white/55" : "text-black/55")}>
          Formations du catalogue EDGE Online. Les formations créées par votre organisation restent
          privées et n’apparaissent pas ici.
        </p>
        <Link
          href={EDGE_ONLINE_APP_SURFACE_PATH}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
            isDark ? "bg-white text-black" : "bg-[#007AFF] text-white",
          )}
        >
          Ouvrir EDGE Online
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`${EDGE_ONLINE_APP_SURFACE_PATH}/formations/${course.slug || course.id}`}
            className={cn(
              "group overflow-hidden rounded-2xl border transition",
              isDark
                ? "border-white/10 bg-white/[0.03] hover:border-white/25"
                : "border-black/10 bg-white hover:border-black/20 shadow-sm",
            )}
          >
            <div className={cn("aspect-[16/9] bg-cover bg-center", isDark ? "bg-white/5" : "bg-black/[0.04]")}>
              {course.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.image} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <p className={cn("text-[11px] font-semibold uppercase tracking-wider", isDark ? "text-white/40" : "text-black/40")}>
                {course.categoryName || "EDGE"}
              </p>
              <h3 className={cn("text-base font-semibold leading-snug group-hover:underline", isDark ? "text-white" : "text-[#1D1D1F]")}>
                {course.title}
              </h3>
              {course.excerpt ? (
                <p className={cn("line-clamp-2 text-sm", isDark ? "text-white/50" : "text-black/50")}>{course.excerpt}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
