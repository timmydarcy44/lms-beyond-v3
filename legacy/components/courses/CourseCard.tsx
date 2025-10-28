"use client";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "next/navigation";

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
};

export default function CourseCard({
  course,
  onDelete,
  onAssign,
}: {
  course: Course;
  onDelete: (id: string) => void;
  onAssign: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800">
      <div className="aspect-[16/9] bg-black">
        {course.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.cover_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">
            Aucune couverture
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{course.title}</h3>
          {course.category && (
            <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700">
              {course.category}
            </span>
          )}
        </div>

        <p className="text-sm text-neutral-400 line-clamp-2">
          {course.description || "—"}
        </p>

        <div className="flex items-center gap-2">
          <button
            className="text-sm px-3 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800"
            onClick={() => onAssign(course.id)}
          >
            Assigner apprenants / groupes / parcours
          </button>

          <GradientButton
            className="text-sm"
            onClick={() => router.push(`/courses/${course.id}/builder`)}
          >
            Modifier dans le builder
          </GradientButton>
        </div>

        <button
          className="text-sm text-red-400 hover:text-red-300"
          onClick={() => onDelete(course.id)}
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

