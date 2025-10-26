"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";
import { Plus, BookOpen } from "lucide-react";

export default function CoursesPage() {
  const sb = createClientComponentClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data, error } = await sb
        .from("courses")
        .select("id, title, description, created_at, cover_url")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data && mounted) setCourses(data);
      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [sb]);

  return (
    <main className="min-h-screen bg-[#252525] text-white p-8">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Mes formations</h1>
          <p className="mt-2 text-white/60">Gérez et créez vos parcours pédagogiques</p>
        </div>
        <Link
          href="/formations/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-white to-zinc-200 text-black font-medium shadow-sm ring-1 ring-white/20 hover:ring-white/40 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-5 w-5" />
          Créer une formation
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Chargement...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20">
          <div className="rounded-full bg-white/5 p-8 mb-4">
            <BookOpen className="h-16 w-16 text-white/30" />
          </div>
          <p className="text-lg text-gray-300 mb-4">Aucune formation pour l'instant.</p>
          <Link
            href="/formations/new"
            className="px-6 py-3 bg-gradient-to-br from-white to-zinc-200 text-black rounded-xl hover:scale-105 transition font-medium"
          >
            Créer ma première formation
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/builder/${course.id}`}
              className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900/60 to-black/80 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all ring-1 ring-white/10 hover:ring-white/20"
            >
              {/* Image de couverture */}
              {course.cover_url ? (
                <div className="relative h-48 w-full">
                  <Image
                    src={course.cover_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-fuchsia-500/20 via-blue-500/20 to-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white/40" />
                </div>
              )}

              {/* Contenu de la carte */}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-white transition line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {course.description || "Aucune description"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(course.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/5">
                    Brouillon
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

