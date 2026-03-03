import Link from "next/link";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

const normalizeRole = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default async function CareDashboardPage() {
  const { profile } = await getCurrentProfileWithAccess();
  const role = normalizeRole(profile?.role_type || profile?.role);
  const canManageCare =
    role === "admin" ||
    role === "super_admin" ||
    role === "formateur" ||
    role === "mentor" ||
    role === "teacher" ||
    role === "instructor";

  return (
    <div className="min-h-screen bg-[#060B1A] px-6 py-14 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Beyond Care Suite</p>
          <h1 className="text-3xl font-semibold tracking-tight">Espace accompagnement Elite</h1>
          <p className="text-sm text-white/70">
            Suivi avance, prevention, pilotage et interventions Care.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={canManageCare ? "/dashboard/student/studio/beyond-care" : "/espace"}
            className="rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Care</p>
            <p className="mt-2 text-xl font-semibold">Dashboard Beyond Care</p>
            <p className="mt-2 text-sm text-white/70">
              Pilotage du dispositif et des indicateurs de suivi.
            </p>
          </Link>
          <Link
            href={canManageCare ? "/dashboard/beyond-care-elite" : "/espace"}
            className="rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Elite</p>
            <p className="mt-2 text-xl font-semibold">Elite Performance</p>
            <p className="mt-2 text-sm text-white/70">
              Parcours premium d accompagnement et de performance.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

