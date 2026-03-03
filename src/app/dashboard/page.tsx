import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type ProfileAccessRow = {
  id: string;
  email: string | null;
  role: string | null;
  role_type: string | null;
  access_lms: boolean | null;
  access_connect: boolean | null;
  access_care: boolean | null;
  access_pro: boolean | null;
  school_id: string | null;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default async function DashboardPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const service = await getServiceRoleClientOrFallback();
  if (!service) {
    redirect("/login");
  }

  const profileSelect =
    "id, email, role, role_type, access_lms, access_connect, access_care, access_pro, school_id";
  const { data: byId } = await service
    .from("profiles")
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  let profile = (byId as ProfileAccessRow | null) ?? null;
  if (!profile && user.email) {
    const { data: byEmail } = await service
      .from("profiles")
      .select(profileSelect)
      .eq("email", user.email)
      .limit(10);
    const rows = (byEmail as ProfileAccessRow[] | null) ?? [];
    profile = rows.find((row) => row.id === user.id) ?? rows[0] ?? null;
  }

  const role = normalize(profile?.role || profile?.role_type);
  const isAdmin = role === "admin" || role === "super_admin";
  const isMentor = role === "mentor";
  const hasLms = profile?.access_lms === true;
  const hasConnect = profile?.access_connect !== false;
  const hasCare = profile?.access_care === true;
  const hasPro = profile?.access_pro === true;

  const sidebarLinks = [
    { label: "Mon profil Beyond", href: "/dashboard/apprenant" },
    { label: "Mes tests", href: "/dashboard/apprenant" },
    ...(hasLms ? [{ label: "Ma formation", href: "/dashboard/student/learning" }] : []),
    ...(hasLms && (isAdmin || isMentor) ? [{ label: "Studio", href: "/dashboard/student/studio" }] : []),
    ...(hasCare ? [{ label: "Mon suivi", href: "/dashboard/student/studio/beyond-care" }] : []),
  ];

  const cards = [
    {
      key: "connect",
      title: "Beyond Connect",
      href: "/dashboard/apprenant",
      enabled: hasConnect,
      description: "Profil, tests de personnalite et matching.",
    },
    {
      key: "lms",
      title: "Beyond LMS",
      href: "/dashboard/student/learning",
      enabled: hasLms,
      description: "Parcours de formation, progression et contenus pedagogiques.",
    },
    {
      key: "care",
      title: "Beyond Care",
      href: "/dashboard/student/studio/beyond-care",
      enabled: hasCare,
      description: "Suivi d accompagnement et indicateurs care.",
    },
    {
      key: "pro",
      title: "Beyond Pro",
      href: "/dashboard/entreprise",
      enabled: hasPro,
      description: "Gestion entreprise et suivi pro.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">Navigation Beyond</p>
          <div className="mt-4 grid gap-2">
            {sidebarLinks.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <header className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Dashboard universel Beyond</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mes espaces</h1>
            <p className="mt-2 text-sm text-white/70">
              Accedez a vos suites actives depuis un point d entree unique.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) =>
              card.enabled ? (
                <Link
                  key={card.key}
                  href={card.href}
                  className="rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <p className="text-lg font-semibold">{card.title}</p>
                  <p className="mt-2 text-sm text-white/70">{card.description}</p>
                </Link>
              ) : (
                <div
                  key={card.key}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 opacity-70"
                >
                  <p className="text-lg font-semibold text-white/80">{card.title}</p>
                  <p className="mt-2 text-sm text-white/55">Bientot disponible</p>
                </div>
              ),
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
