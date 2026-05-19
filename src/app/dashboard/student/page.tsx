import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (session?.role === "demo") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-6 py-10 text-white">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-white">Mode Démo</h1>
          <p className="mt-2 text-sm text-slate-400">
            Accédez aux formations apprenants depuis le lien ci-dessous.
          </p>
          <Link
            href="/dashboard/student/learning/formations"
            className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Voir les formations
          </Link>
        </div>
      </div>
    );
  }
  redirect("/dashboard/student/learning/formations");
}

