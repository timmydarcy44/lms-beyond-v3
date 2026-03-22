import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

const stats = [
  { title: "Nombre de Clients", value: "128" },
  { title: "Périodes de Test", value: "14" },
  { title: "CA du Mois", value: "€ 18 450" },
  { title: "CA de l'Année", value: "€ 214 700" },
];

const recentConnections = [
  {
    name: "Camille R.",
    email: "camille.r@example.com",
    date: "Aujourd'hui · 09:12",
    action: "Quiz terminé",
  },
  {
    name: "Lucas M.",
    email: "lucas.m@example.com",
    date: "Hier · 18:42",
    action: "Fiche générée",
  },
  {
    name: "Nina D.",
    email: "nina.d@example.com",
    date: "Hier · 16:05",
    action: "Schéma exporté",
  },
  {
    name: "Thomas B.",
    email: "thomas.b@example.com",
    date: "Hier · 11:30",
    action: "Audio synthèse",
  },
];

const transformations = [
  { label: "Schémas", value: "1 248" },
  { label: "Fiches", value: "892" },
  { label: "Audio", value: "476" },
  { label: "Quiz", value: "1 034" },
];

const navItems = [
  "Tableau de bord",
  "Clients",
  "Chiffre d'Affaires",
  "Signaux Faibles (Température)",
];

export default async function AdminDashboardPage() {
  const session = await requireSession();
  if (!["admin", "super_admin"].includes(session.role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#0F1117]">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-10">
        <aside className="w-64 rounded-3xl bg-white shadow-sm border border-[#E8E9F0] p-6">
          <div className="text-lg font-semibold mb-6">Admin</div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <div
                key={item}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  item === "Tableau de bord"
                    ? "bg-[#6D28D9] text-white"
                    : "text-[#374151] hover:bg-[#F3F4F8]"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold">Tableau de bord</h1>
            <p className="text-sm text-[#6B7280]">
              Vue d'ensemble de l'activité et des signaux d'engagement.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-2xl border border-[#E8E9F0] bg-white p-5 shadow-sm"
              >
                <p className="text-xs text-[#6B7280] uppercase tracking-widest">
                  {stat.title}
                </p>
                <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-[#E8E9F0] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Dernières Connexions</h2>
              <div className="space-y-4">
                {recentConnections.map((row) => (
                  <div
                    key={`${row.email}-${row.date}`}
                    className="flex items-start justify-between gap-4 border-b border-[#F3F4F8] pb-4 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-[#6B7280]">{row.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#6B7280]">{row.date}</p>
                      <p className="text-sm font-medium">{row.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E8E9F0] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Transformations Stars</h2>
              <div className="grid grid-cols-2 gap-4">
                {transformations.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#F3F4F8] bg-[#F9FAFC] p-4 text-center"
                  >
                    <p className="text-xs uppercase tracking-widest text-[#6B7280]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
