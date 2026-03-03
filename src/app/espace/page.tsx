import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EspacePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/espace");
  }

  const firstName = String(session.fullName ?? session.email ?? "")
    .trim()
    .split(" ")
    .filter(Boolean)[0];
  const links = [
    { label: "Beyond LMS", href: "/dashboard/student" },
    { label: "Beyond Connect", href: "/dashboard/apprenant" },
    { label: "Beyond Care", href: "/dashboard/care" },
    { label: "Pro - Entreprise", href: "/dashboard/entreprise" },
  ];

  return (
    <div className="min-h-screen bg-[#050B1C] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Hub Admin</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {firstName ? `Bonjour ${firstName}` : "Espace de navigation"}
        </h1>
        <p className="text-sm text-white/70">Tour de controle des suites Beyond.</p>
        <div className="grid gap-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
