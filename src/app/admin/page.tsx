import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { getKpis, getRecentActivity } from "@/lib/queries/admin";
import { getSession } from "@/lib/auth/session";

export default async function AdminPage() {
  const [kpis, activity] = await Promise.all([getKpis(), getRecentActivity()]);
  const session = await getSession();

  const kpiCards = [
    {
      label: "Formations",
      value: kpis.totalCourses,
      hint: "+3 vs. mois dernier",
      trend: "up" as const,
    },
    {
      label: "Apprenants",
      value: kpis.totalLearners,
      hint: "+5% d'engagement",
      trend: "up" as const,
    },
    {
      label: "Formateurs",
      value: kpis.totalInstructors,
      hint: "2 nouveaux cette semaine",
      trend: "up" as const,
    },
    {
      label: "Parcours",
      value: kpis.totalPaths,
      hint: "1 brouillon en cours",
      trend: null,
    },
    {
      label: "Connexions (24h)",
      value: kpis.last24hLogins,
      hint: "activité depuis minuit",
      trend: kpis.last24hLogins > 100 ? "up" : "down",
    },
    {
      label: "Badges (7j)",
      value: kpis.last7dBadges,
      hint: "récompenses attribuées",
      trend: kpis.last7dBadges > 40 ? "up" : "down",
    },
  ];

  const quickItems = [
    {
      key: "formation",
      title: "Créer une formation",
      subtitle: "Organisez un nouveau curriculum",
      cta: "Lancer l'éditeur",
      image: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
    },
    {
      key: "parcours",
      title: "Créer un parcours",
      subtitle: "Composez une progression maîtrisée",
      cta: "Composer",
      image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=900&q=80",
    },
    {
      key: "apprenant",
      title: "Créer un apprenant",
      subtitle: "Invitez un nouveau membre",
      cta: "Ajouter",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
    },
    {
      key: "formateur",
      title: "Créer un formateur",
      subtitle: "Déployez un mentor expert",
      cta: "Onboarder",
      image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <AdminDashboardView 
      kpis={kpiCards} 
      quickItems={quickItems} 
      activity={activity}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    />
  );
}


