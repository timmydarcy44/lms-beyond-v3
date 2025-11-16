import { getAdminAssignableCatalog } from "@/lib/queries/admin";
import { Store, GraduationCap, Route, PenTool, Library } from "lucide-react";

export default async function AdminNoSchoolPage() {
  const catalog = await getAdminAssignableCatalog();
  const courses = catalog.courses || [];
  const paths = catalog.paths || [];
  const resources = catalog.resources || [];
  const tests = catalog.tests || [];
  const totalItems = courses.length + paths.length + resources.length + tests.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">No School</h1>
          <p className="text-white/60 text-sm">
            Contenu assigné à votre organisation ({totalItems} élément{totalItems > 1 ? "s" : ""})
          </p>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <Store className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun contenu disponible</h3>
          <p className="text-white/60 text-sm">
            Le contenu assigné à votre organisation par le Super Admin apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {courses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Formations ({courses.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <h3 className="text-base font-medium text-white mb-2">{course.title}</h3>
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
                ))}
              </div>
            </div>
          )}

          {paths.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Route className="h-5 w-5" />
                Parcours ({paths.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paths.map((path) => (
                  <div
                    key={path.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <h3 className="text-base font-medium text-white mb-2">{path.title}</h3>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        path.status === "published"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      }`}
                    >
                      {path.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resources.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Library className="h-5 w-5" />
                Ressources ({resources.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <h3 className="text-base font-medium text-white mb-2">{resource.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {resource.type && (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {resource.type}
                        </span>
                      )}
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          resource.status === "published"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        }`}
                      >
                        {resource.status === "published" ? "Publié" : "Brouillon"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Tests ({tests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                  >
                    <h3 className="text-base font-medium text-white mb-2">{test.title}</h3>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        test.status === "published"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      }`}
                    >
                      {test.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


